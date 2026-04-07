import { stripStatementAiFooter } from "@/lib/planning/statement-text"
import { createClient } from "@/lib/supabase/server"
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx"
import { NextResponse } from "next/server"
import { z } from "zod"

const DISCLAIMER =
  "This planning statement has been prepared as a draft document for guidance purposes. It does not constitute professional planning advice. Always consult an RTPI-accredited planning consultant before submission."

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\([^)]*\)/g, "$1")
}

function projectTypeFromProposal(proposalText: string): string {
  const idx = proposalText.indexOf(" — ")
  if (idx > 0) return proposalText.slice(0, idx).trim()
  return proposalText.trim() || "—"
}

/** Prefer human-readable text; never surface raw JSON in the document. */
function cleanProjectTypeField(projectType: string | null | undefined): string {
  let cleanProjectType = projectType ?? ""
  try {
    const parsed = JSON.parse(cleanProjectType) as { projectType?: string }
    cleanProjectType = parsed.projectType ?? cleanProjectType
  } catch {
    /* plain string or invalid JSON — use as-is */
  }
  return cleanProjectType.trim()
}

function subtitleProjectType(
  projectType: string | null | undefined,
  proposalText: string,
): string {
  const fromField = cleanProjectTypeField(projectType)
  if (fromField) return fromField

  const trimmed = proposalText.trim()
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { projectType?: string }
      const fromProposal = parsed.projectType?.trim()
      if (fromProposal) return fromProposal
    } catch {
      /* fall through */
    }
    return "—"
  }

  const fromProposal = projectTypeFromProposal(trimmed)
  if (fromProposal.startsWith("{")) {
    try {
      const parsed = JSON.parse(fromProposal) as { projectType?: string }
      return parsed.projectType?.trim() || "—"
    } catch {
      return "—"
    }
  }
  return fromProposal || "—"
}

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullet"; text: string }

function appendParagraphsAndBullets(blocks: Block[], raw: string): void {
  const trimmed = raw.trim()
  if (!trimmed) return
  const paragraphs = trimmed.split(/\n\s*\n/)
  for (const para of paragraphs) {
    const p = para.trim()
    if (!p) continue
    const lines = p.split(/\r?\n/)
    const nonEmpty = lines.filter((l) => l.trim())
    const allBullets =
      nonEmpty.length > 0 &&
      nonEmpty.every((l) => /^[-*]\s+/.test(l.trim()))
    if (allBullets) {
      for (const line of lines) {
        const lt = line.trim()
        if (!lt) continue
        const m = lt.match(/^[-*]\s+(.+)$/)
        if (m) blocks.push({ kind: "bullet", text: stripInlineMarkdown(m[1]) })
      }
      continue
    }
    blocks.push({
      kind: "paragraph",
      text: stripInlineMarkdown(p.replace(/\n/g, " ")),
    })
  }
}

function parsePlainNumberedOrParagraphs(
  text: string,
  opts: { allowNumberedHeadings?: boolean } = {},
): Block[] {
  const allowNumbered = opts.allowNumberedHeadings !== false
  const trimmed = text.trim()
  if (!trimmed) return []

  if (!allowNumbered) {
    const blocks: Block[] = []
    appendParagraphsAndBullets(blocks, trimmed)
    return blocks
  }

  const chunks = /^\d+\.\s/m.test(trimmed)
    ? trimmed.split(/\n(?=\d+\.\s+)/)
    : [trimmed]

  const blocks: Block[] = []
  for (const chunk of chunks) {
    const t = chunk.trim()
    if (!t) continue
    const lines = t.split(/\r?\n/)
    const first = lines[0]?.trim() ?? ""
    const numHeading = /^\d+\.\s+.+$/.test(first) && first.length < 160

    if (numHeading && lines.length > 1) {
      blocks.push({ kind: "heading", level: 2, text: stripInlineMarkdown(first) })
      appendParagraphsAndBullets(blocks, lines.slice(1).join("\n"))
    } else if (numHeading && lines.length === 1) {
      blocks.push({ kind: "heading", level: 2, text: stripInlineMarkdown(first) })
    } else {
      appendParagraphsAndBullets(blocks, t)
    }
  }
  return blocks
}

function parseMarkdownSections(text: string): Block[] {
  const blocks: Block[] = []
  const parts = text.split(/(?=^#{1,3}\s+)/m)
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const m = trimmed.match(/^(#{1,3})\s+([^\n]+)(?:\n([\s\S]*))?$/)
    if (m) {
      const level = m[1].length
      const lvl = (level >= 3 ? 3 : level) as 1 | 2 | 3
      blocks.push({
        kind: "heading",
        level: lvl,
        text: stripInlineMarkdown(m[2].trim()),
      })
      const body = (m[3] ?? "").trim()
      if (body) {
        blocks.push(
          ...parsePlainNumberedOrParagraphs(body, {
            allowNumberedHeadings: true,
          }),
        )
      }
    } else {
      blocks.push(
        ...parsePlainNumberedOrParagraphs(trimmed, {
          allowNumberedHeadings: true,
        }),
      )
    }
  }
  return blocks
}

function parseContentToBlocks(content: string): Block[] {
  const text = (content ?? "").trim()
  if (!text) return []
  if (/^#{1,3}\s/m.test(text)) {
    return parseMarkdownSections(text)
  }
  return parsePlainNumberedOrParagraphs(text, { allowNumberedHeadings: true })
}

function blocksToDocxParagraphs(blocks: Block[]): Paragraph[] {
  const out: Paragraph[] = []
  for (const b of blocks) {
    if (b.kind === "heading") {
      if (b.level === 1) {
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: b.text,
                font: "Calibri",
                size: 36,
                bold: true,
                color: "0B4D2C",
              }),
            ],
          }),
        )
        continue
      }

      if (b.level === 2) {
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text: b.text,
                font: "Calibri",
                size: 28,
                bold: true,
                color: "126B3A",
              }),
            ],
          }),
        )
        continue
      }

      out.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 280, after: 120 },
          children: [
            new TextRun({
              text: b.text,
              font: "Calibri",
              size: 26,
              bold: true,
              color: "126B3A",
            }),
          ],
        }),
      )
    } else if (b.kind === "bullet") {
      out.push(
        new Paragraph({
          spacing: { line: 276, after: 200 },
          children: [new TextRun({ text: `• ${b.text}`, font: "Calibri", size: 24 })],
        }),
      )
    } else {
      out.push(
        new Paragraph({
          spacing: { line: 276, after: 200 },
          children: [new TextRun({ text: b.text, font: "Calibri", size: 24 })],
        }),
      )
    }
  }
  return out
}

function buildDocument(statement: {
  lpa_name: string | null
  proposal_text: string
  project_type: string | null
  generated_content: string | null
}): Document {
  const lpa = (statement.lpa_name ?? "").trim() || "—"
  const projectType = subtitleProjectType(
    statement.project_type,
    statement.proposal_text,
  )
  const subtitle = `${lpa} · ${projectType}`
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: "Planning Statement",
          font: "Calibri",
          size: 36,
          bold: true,
          color: "0B4D2C",
        }),
      ],
    }),
    new Paragraph({
      spacing: { line: 276, after: 200 },
      children: [new TextRun({ text: subtitle, italics: true, font: "Calibri", size: 24 })],
    }),
    new Paragraph({
      spacing: { line: 276, after: 200 },
      children: [new TextRun({ text: `Date generated: ${dateStr}`, font: "Calibri", size: 24 })],
    }),
    new Paragraph({
      spacing: { line: 276, after: 400 },
      border: {
        bottom: {
          color: "666666",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: DISCLAIMER,
          italics: true,
          size: 20,
          color: "666666",
          font: "Calibri",
        }),
      ],
    }),
    ...blocksToDocxParagraphs(
      parseContentToBlocks(
        stripStatementAiFooter(statement.generated_content ?? ""),
      ),
    ),
  ]

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 24,
          },
          paragraph: {
            spacing: {
              line: 276,
              after: 200,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", font: "Calibri", size: 20, color: "666666" }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 20, color: "666666" }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  })
}

async function handleGenerate(
  _request: Request,
  context: { params: Promise<{ statementId: string }> },
) {
  const { statementId } = await context.params
  const idParsed = z.string().uuid().safeParse(statementId)
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid statement id" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: statement, error } = await supabase
    .from("statements")
    .select("id, generated_content, lpa_name, proposal_text, project_type")
    .eq("id", statementId)
    .maybeSingle()

  if (error) {
    console.error("generate-statement-docx fetch error", error)
    return NextResponse.json({ error: "Could not load statement" }, { status: 500 })
  }

  if (!statement) {
    return NextResponse.json({ error: "Statement not found" }, { status: 404 })
  }

  try {
    const doc = buildDocument(statement)
    const buffer = await Packer.toBuffer(doc)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": DOCX_TYPE,
        "Content-Disposition": 'attachment; filename="planning-statement.docx"',
      },
    })
  } catch (e) {
    console.error("generate-statement-docx pack error", e)
    return NextResponse.json({ error: "Document generation failed" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ statementId: string }> },
) {
  return handleGenerate(request, context)
}

/** Same behaviour as POST — supports direct download via `<a href>`. */
export async function GET(
  request: Request,
  context: { params: Promise<{ statementId: string }> },
) {
  return handleGenerate(request, context)
}

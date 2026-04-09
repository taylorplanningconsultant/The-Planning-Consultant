import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { z } from "zod"

const constraintCategorySchema = z.enum([
  "conservation_area",
  "listed_building",
  "article_4_direction",
  "flood_zone",
  "tree_preservation_order",
  "green_belt",
  "aonb",
  "permitted_development",
])

const constraintResultSchema = z.object({
  category: constraintCategorySchema,
  label: z.string(),
  status: z.enum(["pass", "flag", "fail"]),
  detail: z.string(),
})

const bodySchema = z.object({
  projectType: z.string().min(1),
  answers: z.record(z.string(), z.string()),
  constraints: z.array(constraintResultSchema),
  lpaName: z.string().min(1),
  purpose: z.enum(["report", "statement"]),
})

const SYSTEM_PROMPT = `You are a UK planning consultant reviewing 
a client's project answers before generating 
a planning document. Identify if any critical 
information is missing. Respond ONLY with 
valid JSON.`

const aiResponseSchema = z.object({
  status: z.enum(["ready", "questions"]),
  questions: z.array(z.string()),
})

function extractJsonText(raw: string): string {
  const trimmed = raw.trim()
  const fenceMatch = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/m.exec(trimmed)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }
  return trimmed
}

function parseAiResponse(
  text: string,
  purpose: "report" | "statement",
): {
  status: "ready" | "questions"
  questions: string[]
} | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJsonText(text))
  } catch {
    return null
  }

  const result = aiResponseSchema.safeParse(parsed)
  if (!result.success) {
    return null
  }

  const { status, questions } = result.data
  if (status === "ready") {
    return { status: "ready", questions: [] }
  }

  const maxFollowUp = purpose === "statement" ? 4 : 2
  const capped = questions.slice(0, maxFollowUp)
  if (capped.length === 0) {
    return { status: "ready", questions: [] }
  }
  return { status: "questions", questions: capped }
}

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { projectType, answers, constraints, lpaName, purpose } = parsed.data

  const statementChecklist = `
For a planning statement, check specifically whether these are covered in the answers:
- Approximate dimensions (width, depth, height) — if missing, ask
- External materials (walls and roof) — if missing, ask
- Property type (detached, semi, terraced, flat) — if missing, ask
- Parking — existing spaces and whether any will be lost — if missing, ask
- Neighbour impact — will any neighbouring windows be directly affected — if missing, ask
- Boundary distance — approximate distance to nearest boundary — if missing, ask
`

  const reportChecklist = `
For a planning report, check whether these basics are covered:
- Approximate scale of the project
- Materials and design
- Impact on neighbours
`

  const userPrompt = `You are reviewing answers before generating a ${purpose}.

Already answered (DO NOT ask about these again):
${JSON.stringify(answers)}

Project: ${projectType} in ${lpaName}
Constraints found: ${JSON.stringify(constraints)}

${purpose === "statement" ? statementChecklist : reportChecklist}

If the answers above are sufficient, respond with:
{"status":"ready","questions":[]}

If critical information is missing, ask up to ${purpose === "statement" ? 4 : 2} short questions.
Questions must be answerable in one sentence.
Do not repeat anything already answered.

Respond with JSON only:
{"status":"questions","questions":["question1","question2"]}

`

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    })

    const firstBlock = message.content[0]
    const text =
      firstBlock && firstBlock.type === "text" ? firstBlock.text : null

    if (!text) {
      console.error("review-answers: unexpected message shape", message.content)
      return NextResponse.json(
        { error: "Review failed" },
        { status: 500 },
      )
    }

    const review = parseAiResponse(text, purpose)
    if (!review) {
      return NextResponse.json({ status: "ready", questions: [] })
    }

    return NextResponse.json(review)
  } catch (err) {
    console.error("review-answers", err)
    return NextResponse.json({ error: "Review failed" }, { status: 500 })
  }
}

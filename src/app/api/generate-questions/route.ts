import Anthropic from "@anthropic-ai/sdk"
import {
  checkRateLimit,
  generateQuestionsLimiter,
} from "@/lib/ratelimit"
import { sanitiseText } from "@/lib/validation"
import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  projectType: z.string().min(1),
  description: z.string(),
  constraints: z.array(z.any()),
  lpaName: z.string(),
  purpose: z.enum(["report", "statement"]),
})

export type GeneratedQuestion =
  | { id: string; type: "buttons"; label: string; helpText: string; options: string[] }
  | { id: string; type: "text"; label: string; helpText: string; placeholder: string }
  | { id: string; type: "number"; label: string; helpText: string; placeholder: string }

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced?.[1]) return fenced[1].trim()
  const first = raw.indexOf("{")
  const last = raw.lastIndexOf("}")
  if (first !== -1 && last !== -1) return raw.slice(first, last + 1)
  return raw.trim()
}

function normaliseQuestion(q: Record<string, unknown>): GeneratedQuestion {
  const rawType = String(q.type ?? "").toLowerCase()
  const label = String(q.label ?? q.question ?? "")
  const helpText = String(q.helpText ?? "")
  const placeholder = String(q.placeholder ?? "")

  const isText = rawType === "text" || rawType === "string"
  const isNumber = rawType === "number" || rawType === "integer"

  if (!isText && !isNumber) {
    const rawOptions = Array.isArray(q.options) ? q.options : []
    const options = rawOptions.map((o: unknown) => {
      if (typeof o === "string") return o
      if (typeof o === "object" && o !== null && "label" in o) {
        return String((o as Record<string, unknown>).label)
      }
      return String(o)
    })
    return { id: String(q.id ?? ""), type: "buttons", label, helpText, options }
  }

  if (isNumber) {
    return { id: String(q.id ?? ""), type: "number", label, helpText, placeholder }
  }

  return { id: String(q.id ?? ""), type: "text", label, helpText, placeholder }
}

export async function POST(request: Request) {
  const { success, reset } = await checkRateLimit(
    generateQuestionsLimiter,
    request,
  )
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "X-RateLimit-Reset": reset.toString() },
      },
    )
  }

  let json: unknown
  try { json = await request.json() } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { projectType, description, constraints, lpaName, purpose } = parsed.data
  const safeDescription = sanitiseText(description)

  try {
    const promptByPurpose =
      purpose === "report"
        ? `Generate up to 4 questions to understand the physical project for a planning constraint report.
Collect: approximate scale, materials, roof type, property type, neighbour impact.
Prefer button choices. No need for exact dimensions.
Project type: ${projectType}
Description: ${safeDescription}
Location: ${lpaName}
Constraints found: ${JSON.stringify(constraints)}`
        : `Generate up to 8 questions to collect detailed technical information for a formal planning statement.
A good planning statement needs: approximate or exact dimensions (width, depth, eaves height, ridge height in metres), external wall materials, roof materials and design, property type, number of existing parking spaces and whether any will be lost, approximate distance to nearest boundary, whether any neighbouring windows face the extension, and access arrangements.
Only ask about what is NOT already clear from the description.
Use number type for dimensions, buttons for finite choices, text for open answers.
Project type: ${projectType}
Description: ${safeDescription}
Location: ${lpaName}
Constraints found: ${JSON.stringify(constraints)}`

    const client = new Anthropic()
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      temperature: 0,
      system: `You are a UK planning consultant collecting project information from a homeowner.
Ask only about the physical characteristics of the proposed works.
NEVER ask whether planning permission is needed.
NEVER ask about planning policies, conservation areas, listed buildings, Article 4, or any planning constraints — these are checked separately.
NEVER ask about planning history unless it directly affects the physical design.
Only ask about what is genuinely missing from the description provided.
Respond with JSON only.`,
      messages: [{
        role: "user",
        content: `${promptByPurpose}

Return this exact JSON format:
{
  "questions": [
    {
      "id": "unique_id",
      "question": "Simple question?",
      "type": "single_choice",
      "options": [
        {"value": "val1", "label": "Option 1"},
        {"value": "val2", "label": "Option 2"}
      ],
      "helpText": "Brief reassuring explanation"
    }
  ]
}`
      }]
    })

    const text = message.content[0]?.type === "text" 
      ? message.content[0].text 
      : null

    if (!text) return NextResponse.json({ questions: [] })

    let parsed2: unknown
    try { parsed2 = JSON.parse(extractJson(text)) } catch {
      return NextResponse.json({ questions: [] })
    }

    const raw = parsed2 as { questions?: unknown[] }
    if (!Array.isArray(raw.questions)) {
      return NextResponse.json({ questions: [] })
    }

    const questions = raw.questions
      .filter(q => q && typeof q === "object")
      .map(q => normaliseQuestion(q as Record<string, unknown>))
      .filter(q => q.label.length > 0)

    return NextResponse.json({ questions })

  } catch (err) {
    console.error("generate-questions error:", err)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}

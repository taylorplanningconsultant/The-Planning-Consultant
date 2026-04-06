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

function parseAiResponse(text: string): {
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

  const capped = questions.slice(0, 2)
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

  const userPrompt = `Already answered questions (DO NOT ask about these again):
${JSON.stringify(answers)}

Only ask follow-up questions about information that is genuinely missing and was NOT already covered in the answers above.

Review these answers for a ${purpose} for 
a ${projectType} in ${lpaName}.

Constraints found: ${JSON.stringify(constraints)}

Client answers: ${JSON.stringify(answers)}

If answers are sufficient to generate a 
professional ${purpose}, respond with:
{"status":"ready","questions":[]}

If 1-2 critical pieces of information are 
missing, respond with:
{"status":"questions","questions":["question1","question2"]}

Maximum 2 questions. Only ask if truly critical.
Questions should be answerable in one sentence.
Respond with JSON only, no other text.`

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

    const review = parseAiResponse(text)
    if (!review) {
      return NextResponse.json({ status: "ready", questions: [] })
    }

    return NextResponse.json(review)
  } catch (err) {
    console.error("review-answers", err)
    return NextResponse.json({ error: "Review failed" }, { status: 500 })
  }
}

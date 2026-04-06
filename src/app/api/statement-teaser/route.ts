import Anthropic from "@anthropic-ai/sdk"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sanitiseText } from "@/lib/validation"
import type { TablesInsert } from "@/types/database"
import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  projectType: z.string(),
  answers: z.record(z.string(), z.string()),
  lpaName: z.string(),
  constraints: z.array(z.any()),
})

const SYSTEM_PROMPT = `You are a UK planning consultant. 
Write a single short paragraph only. 
No headings. No bullet points. Plain prose only.`

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

  const { projectType, answers, lpaName, constraints } = parsed.data

  const safeProjectType = sanitiseText(projectType)
  const safeLpaName = sanitiseText(lpaName)
  const safeAnswers = Object.fromEntries(
    Object.entries(answers).map(([key, value]) => [key, sanitiseText(value)]),
  )

  const userPrompt = `Write a 3-4 sentence personalised preview 
for a planning statement about a ${safeProjectType} 
in ${safeLpaName}.

Mention the specific LPA by name.
Reference 1-2 relevant NPPF policies by number.
Mention the key constraint findings: 
${JSON.stringify(constraints)}
Project details: ${JSON.stringify(safeAnswers)}

Make it sound specific to this exact site and 
project. Do not be generic.`

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    })

    const firstBlock = message.content[0]
    const teaserText =
      firstBlock && firstBlock.type === "text" ? firstBlock.text.trim() : null

    if (!teaserText) {
      console.error("statement-teaser: unexpected message shape", message.content)
      return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }

    const supabase = createServiceClient()

    const row = {
      lpa_name: lpaName,
      project_type: projectType,
      project_answers: answers,
      constraints: constraints,
      proposal_text: JSON.stringify(answers),
      status: "pending",
      generated_content: null,
    } as TablesInsert<"statements">

    const { data: inserted, error: insertError } = await supabase
      .from("statements")
      .insert(row)
      .select("id")
      .single()

    if (insertError || !inserted) {
      console.error("statement-teaser insert error", insertError)
      return NextResponse.json({ error: "Save failed" }, { status: 500 })
    }

    const statementId = inserted.id

    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (user) {
      await supabase
        .from("statements")
        .update({ user_id: user.id })
        .eq("id", statementId)
    }

    return NextResponse.json({
      teaserText,
      statementId: inserted.id,
    })
  } catch (e) {
    console.error("statement-teaser error", e)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  reportId: z.string().uuid(),
  projectType: z.string().min(1),
  description: z.string().min(1),
})

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

  const { reportId, projectType, description } = parsed.data

  try {
    const supabase = await createClient()
    const { data: report, error } = await supabase
      .from("reports")
      .select("constraint_data, lpa_name")
      .eq("id", reportId)
      .maybeSingle()

    if (error || !report) {
      console.error("generate-report fetch error", error)
      return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }

    const lpaName = report.lpa_name ?? "Unknown"
    const constraintData = report.constraint_data

    const client = new Anthropic()

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a senior UK planning consultant writing a personalised planning assessment for a paying client.

Location: ${lpaName}
Project type: ${projectType}
Client description: ${description}
Constraints found: ${JSON.stringify(constraintData)}

Rules:
- Reference the specific constraints found at this exact location by name
- Tailor every recommendation to this specific project type
- Do not write generic planning advice
- Be specific about what each constraint means for THIS project
- Use professional but plain English
- Be honest about risks and challenges

Structure your response with these exact sections:
## Site Summary
## What Your Constraints Mean For This Project  
## Approval Likelihood
## Your Next Steps`,
        },
      ],
    })

    const firstBlock = message.content[0]
    const assessment =
      firstBlock && firstBlock.type === "text" ? firstBlock.text : null

    if (!assessment) {
      console.error("generate-report: unexpected message shape", message.content)
      return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from("reports")
      .update({ ai_assessment: assessment })
      .eq("id", reportId)

    if (updateError) {
      console.error("generate-report update error", updateError)
      return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }

    return NextResponse.json({ assessment })
  } catch (e) {
    console.error("generate-report error", e)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}

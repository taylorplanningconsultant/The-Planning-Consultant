import Anthropic from "@anthropic-ai/sdk"
import { stripStatementAiFooter } from "@/lib/planning/statement-text"
import { createClient } from "@/lib/supabase/server"
import type { TablesInsert } from "@/types/database"
import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  reportId: z.string().uuid(),
  projectType: z.string().min(1),
  description: z.string().min(1),
  propertyType: z.string().min(1),
  proposedWorks: z.string().min(1),
  hasHistory: z.boolean().optional().default(false),
})

const SYSTEM_PROMPT =
  "You are a professional UK planning consultant writing a formal planning statement for submission to a local planning authority. Write in formal planning language. Reference NPPF policies by paragraph number where relevant. Be specific to the LPA and constraints provided."

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

  const {
    reportId,
    projectType,
    description,
    propertyType,
    proposedWorks,
    hasHistory,
  } = parsed.data

  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("postcode, lpa_name, constraint_data")
      .eq("id", reportId)
      .maybeSingle()

    if (fetchError) {
      console.error("generate-statement fetch error", fetchError)
      return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const postcode = report.postcode
    const lpaName = report.lpa_name ?? "Unknown"
    const constraintData = report.constraint_data

    const planningHistoryLine = hasHistory
      ? "Site has planning history"
      : "No known planning history"

    const userPrompt = `Write a formal planning statement for the following development proposal:

Location: ${postcode}, ${lpaName}
Project type: ${projectType}
Property type: ${propertyType}
Proposed works: ${proposedWorks}
Project description: ${description}
Planning history: ${planningHistoryLine}
Site constraints: ${JSON.stringify(constraintData)}

Structure the statement with these exact sections:
1. Introduction
2. Site Description and Planning History
3. Description of Proposed Development
4. Planning Policy Context (reference ${lpaName} Local Plan and NPPF)
5. Assessment Against Relevant Policies
6. Pre-Application Considerations
7. Conclusion and Planning Balance

Do not add any closing line stating when this document was generated or drafted (for example "Generated on January 2025"). End at the conclusion section only.

Write at least 800 words. Be specific to the constraints and LPA provided. Use formal planning language throughout.`

    const client = new Anthropic()

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    })

    const firstBlock = message.content[0]
    const content =
      firstBlock && firstBlock.type === "text" ? firstBlock.text : null

    if (!content) {
      console.error("generate-statement: unexpected message shape", message.content)
      return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }

    const cleanedContent = stripStatementAiFooter(content)

    const proposalText = `${projectType} — ${propertyType}: ${description}`.slice(
      0,
      10000,
    )

    const row: TablesInsert<"statements"> = {
      report_id: reportId,
      user_id: session?.user?.id ?? null,
      generated_content: cleanedContent,
      lpa_name: report.lpa_name,
      proposal_text: proposalText,
      status: "complete",
    }

    const { data: inserted, error: insertError } = await supabase
      .from("statements")
      .insert(row)
      .select("id")
      .single()

    if (insertError || !inserted) {
      console.error("generate-statement insert error", insertError)
      return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }

    return NextResponse.json({
      statementId: inserted.id,
      content: cleanedContent,
    })
  } catch (e) {
    console.error("generate-statement error", e)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}

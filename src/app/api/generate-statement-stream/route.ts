import Anthropic from "@anthropic-ai/sdk"
import { deductCredits, hasEnoughCredits } from "@/lib/credits"
import { stripStatementAiFooter } from "@/lib/planning/statement-text"
import {
  checkRateLimit,
  generateStatementLimiter,
} from "@/lib/ratelimit"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  statementId: z.string().uuid(),
  sessionId: z.string().optional(),
})

const SYSTEM_PROMPT = `You are a professional UK planning 
consultant writing a formal planning statement 
for submission to a local planning authority. 
Write in formal planning language. Reference 
NPPF policies by paragraph number. 
Be specific to the LPA and project provided.
Maximum 600 words.`

export async function POST(request: Request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get("session_id")

  const { success, reset } = await checkRateLimit(
    generateStatementLimiter,
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
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const isBundleSession = parsed.data.sessionId === "bundle"
  const { statementId } = parsed.data

  const supabase = await createClient()

  const { data: statement, error: fetchError } = await supabase
    .from("statements")
    .select(
      "id, lpa_name, proposal_text, report_id, address, project_type, project_answers, constraints, status, generated_content"
    )
    .eq("id", statementId)
    .maybeSingle()

  if (fetchError) {
    console.error("generate-statement-stream fetch error", fetchError)
    return NextResponse.json({ error: "Statement not found" }, { status: 404 })
  }

  if (!statement) {
    return NextResponse.json({ error: "Statement not found" }, { status: 404 })
  }

  if (
    statement.status === "complete" &&
    statement.generated_content != null
  ) {
    const fullText = stripStatementAiFooter(statement.generated_content)
    const chunks = fullText.match(/.{1,50}/g) ?? []
    const cachedStream = new ReadableStream({
      start(controller) {
        try {
          for (const chunk of chunks) {
            const data = `data: ${JSON.stringify({ text: chunk })}\n\n`
            controller.enqueue(new TextEncoder().encode(data))
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
        } finally {
          try {
            controller.close()
          } catch {}
        }
      },
    })

    return new Response(cachedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  }

  if (statement.status !== "pending") {
    return NextResponse.json(
      { error: "Statement is not ready for generation" },
      { status: 400 },
    )
  }

  const serviceSupabase = createServiceClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  const { data: userData } = accessToken
    ? await serviceSupabase.auth.getUser(accessToken)
    : { data: { user: null } }
  const user = userData.user

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let report: {
    postcode: string | null
    has_bundle: boolean | null
    bundle_statement_used: boolean | null
  } | null = null
  if (statement.report_id) {
    const { data: reportRow } = await supabase
      .from("reports")
      .select("postcode, has_bundle, bundle_statement_used")
      .eq("id", statement.report_id)
      .maybeSingle()
    report = reportRow
  }

  let skipCreditCheck: boolean
  if (isBundleSession) {
    // Bundle purchase - skip all payment checks
    // proceed directly to generation
    skipCreditCheck = true
  } else {
    skipCreditCheck =
      sessionId === "bundle" ||
      (report?.has_bundle === true &&
        report?.bundle_statement_used === false)

    if (!skipCreditCheck) {
      const hasCredits = await hasEnoughCredits(user.id, "statement")
      if (!hasCredits) {
        return NextResponse.json(
          { error: "Insufficient credits" },
          { status: 402 },
        )
      }
    }
  }

  const lpaName = statement.lpa_name ?? "Unknown LPA"

  const st = statement as typeof statement & {
    project_type?: string | null
    project_answers?: unknown
    constraints?: unknown
  }

  const projectAnswers = st.project_answers
    ? JSON.stringify(st.project_answers, null, 2)
    : "Not provided"

  const constraintData = st.constraints
    ? JSON.stringify(st.constraints, null, 2)
    : "Not provided"

  const userContent = `Write a comprehensive formal 
planning statement of at least 1000 words for 
submission to ${lpaName}.

PROJECT DETAILS:
Type: ${st.project_type}
Location: ${lpaName}
Site postcode: ${report?.postcode ?? "Not provided"}

CLIENT'S PROJECT ANSWERS:
${projectAnswers}

PLANNING CONSTRAINTS AT THIS SITE:
${constraintData}

REQUIREMENTS:
- Write at least 1000 words
- Reference specific NPPF paragraphs by number
- Reference ${lpaName} Local Plan policies by name
- Address each constraint found at the site
- Use the client's answers to write specific 
  descriptions - no placeholder text like 
  [applicant name] or [to be confirmed]
- Where applicant name is unknown use 
  "the applicant"
- Where specific dimensions are unknown, 
  reference what the client told us and note 
  that final dimensions are subject to design
- Write in formal planning language throughout
- Be specific to this exact site and project
- Do not add any closing line stating when this document was generated, drafted, or created (for example "Generated on January 2025"). Formal planning statements end at the final section; they do not include AI or draft timestamps.

Structure with these sections:
## 1. Introduction
## 2. Site Description and Planning History
## 3. Description of Proposed Development
## 4. Planning Policy Context
## 5. Assessment Against Relevant Policies
## 6. Conclusion and Planning Balance`

  const client = new Anthropic()

  const stream = client.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
  })

  let accumulated = ""

  const userId = user.id

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text
            accumulated += text
            const data = `data: ${JSON.stringify({ text })}\n\n`
            try {
              controller.enqueue(new TextEncoder().encode(data))
            } catch {
              break
            }
          }
        }
        try {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
        } catch {}

        const cleaned = stripStatementAiFooter(accumulated)

        const { error: updateError } = await supabase
          .from("statements")
          .update({
            generated_content: cleaned,
            status: "complete",
          })
          .eq("id", statementId)

        if (updateError) {
          console.error("generate-statement-stream update error", updateError)
        } else if (!skipCreditCheck) {
          const deducted = await deductCredits(
            userId,
            "statement",
            undefined,
            statementId,
          )
          if (!deducted) {
            console.error(
              "generate-statement-stream: deductCredits returned false",
              { statementId, userId },
            )
          }
        }
      } catch (e) {
        console.error("stream error", e)
      } finally {
        try {
          controller.close()
        } catch {}
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

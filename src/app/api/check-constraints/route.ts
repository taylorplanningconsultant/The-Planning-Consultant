import { checkConstraints } from "@/lib/planning/constraints"
import { getLpaFromPostcode } from "@/lib/planning/lpa"
import { calculateApprovalScore } from "@/lib/planning/score"
import { createClient } from "@/lib/supabase/server"
import type { Json, TablesInsert } from "@/types/database"
import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  postcode: z.string().min(5),
  /** Optional street-level line; when omitted, stored address is derived from the postcode. */
  address: z.string().optional(),
})

export async function POST(request: Request) {
  try {
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

    const { postcode, address } = parsed.data
    const postcodeNorm = postcode.toUpperCase().replace(/\s+/g, " ").trim()
    const addressLine =
      address?.trim() && address.trim().length >= 5
        ? address.trim()
        : `Property in ${postcodeNorm}`

    let lpa = await getLpaFromPostcode(postcodeNorm)
    if (!lpa) {
      lpa = { lpaName: "Unknown LPA", lpaCode: "unknown" }
    }

    const constraints = await checkConstraints(postcodeNorm, lpa.lpaCode)
    const score = calculateApprovalScore(constraints)

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const reportRow: TablesInsert<"reports"> = {
      user_id: session?.user?.id ?? null,
      email: null,
      address: addressLine,
      postcode: postcodeNorm,
      lpa_name: lpa.lpaName,
      lpa_code: lpa.lpaCode,
      constraint_data: constraints as unknown as Json,
      approval_score: score,
      report_type: "basic",
    }

    const { data: inserted, error: insertError } = await supabase
      .from("reports")
      .insert(reportRow)
      .select("id, share_token")
      .single()

    if (insertError || !inserted) {
      console.error("check-constraints insert error", insertError)
      return NextResponse.json(
        { error: "Constraint check failed" },
        { status: 500 },
      )
    }

    const publicConstraints = constraints.slice(0, 3)

    return NextResponse.json({
      constraints: publicConstraints,
      score: null,
      lpa,
      reportId: inserted.id,
      shareToken: inserted.share_token,
      locked: true,
    })
  } catch (e) {
    console.error("check-constraints error", e)
    return NextResponse.json(
      { error: "Constraint check failed" },
      { status: 500 },
    )
  }
}

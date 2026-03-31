import { createClient } from "@/lib/supabase/server"
import type { TablesInsert } from "@/types/database"
import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  email: z.email(),
  postcode: z.string().optional(),
  reportId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  try {
    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const { email, postcode, reportId } = parsed.data

    const supabase = await createClient()
    const leadRow: TablesInsert<"leads"> = {
      email,
      postcode: postcode ?? null,
      source: "report_gate",
      report_id: reportId ?? null,
      converted: false,
    }

    const { error } = await supabase.from("leads").insert(leadRow)

    if (error) {
      console.error("capture-lead insert error", error)
      return NextResponse.json(
        { error: "Failed to capture lead" },
        { status: 500 },
      )
    }

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("constraint_data, approval_score")
      .eq("id", reportId ?? "")
      .single()

    if (reportError || !report) {
      console.error("capture-lead report fetch error", reportError)
      return NextResponse.json(
        { error: "Failed to capture lead" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      constraints: report.constraint_data,
      score: report.approval_score,
    })
  } catch (e) {
    console.error("capture-lead error", e)
    return NextResponse.json(
      { error: "Failed to capture lead" },
      { status: 500 },
    )
  }
}

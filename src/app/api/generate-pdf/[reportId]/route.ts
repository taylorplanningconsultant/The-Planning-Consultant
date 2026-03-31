import { generateReportPDF } from "@/lib/pdf/generator"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"
import type { ConstraintResult } from "@/types/planning"
import { NextResponse } from "next/server"
import { z } from "zod"

const constraintResultSchema = z.object({
  category: z.enum([
    "conservation_area",
    "listed_building",
    "article_4_direction",
    "flood_zone",
    "tree_preservation_order",
    "green_belt",
    "aonb",
    "permitted_development",
  ]),
  label: z.string(),
  status: z.enum(["pass", "flag", "fail"]),
  detail: z.string(),
})

const paramsSchema = z.object({
  reportId: z.string().uuid(),
})

function parseConstraintData(
  json: Tables<"reports">["constraint_data"],
):
  | { ok: true; constraints: ConstraintResult[] }
  | { ok: false } {
  if (json == null) {
    return { ok: true, constraints: [] }
  }
  const parsed = z.array(constraintResultSchema).safeParse(json)
  if (!parsed.success) {
    return { ok: false }
  }
  return { ok: true, constraints: parsed.data }
}

function formatGeneratedAt(createdAt: string | null): string {
  const d = createdAt ? new Date(createdAt) : new Date()
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString()
  }
  return d.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ reportId: string | string[] | undefined }> },
) {
  try {
    const raw = await context.params
    const reportIdParam = raw.reportId
    const reportId =
      typeof reportIdParam === "string"
        ? reportIdParam
        : Array.isArray(reportIdParam)
          ? reportIdParam[0]
          : undefined

    const parsedParams = paramsSchema.safeParse({ reportId })
    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: report, error } = await supabase
      .from("reports")
      .select(
        "id, address, postcode, lpa_name, approval_score, constraint_data, ai_assessment, created_at",
      )
      .eq("id", parsedParams.data.reportId)
      .maybeSingle()

    if (error) {
      console.error("generate-pdf fetch error", error)
      return NextResponse.json({ error: "Failed to load report" }, { status: 500 })
    }

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const constraintsResult = parseConstraintData(report.constraint_data)
    if (!constraintsResult.ok) {
      return NextResponse.json(
        { error: "Report data is invalid" },
        { status: 422 },
      )
    }

    const pdf = await generateReportPDF({
      address: report.address,
      postcode: report.postcode,
      lpaName: report.lpa_name ?? "Unknown",
      score: report.approval_score ?? 0,
      constraints: constraintsResult.constraints,
      ai_assessment: report.ai_assessment ?? undefined,
      generatedAt: formatGeneratedAt(report.created_at),
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="planning-report.pdf"',
      },
    })
  } catch (e) {
    console.error("generate-pdf error", e)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    )
  }
}

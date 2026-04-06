import { DashboardReportsList } from "@/components/dashboard/DashboardReportsList"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Footer } from "@/components/layout/Footer"
import { Nav } from "@/components/layout/Nav"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"
import { redirect } from "next/navigation"

type ReportRow = Pick<
  Tables<"reports">,
  "id" | "postcode" | "lpa_name" | "approval_score" | "share_token" | "report_type" | "created_at"
>

export default async function DashboardReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userId = user.id

  const { data: reportsData, error } = await supabase
    .from("reports")
    .select("id, postcode, lpa_name, approval_score, share_token, report_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const reports: ReportRow[] = reportsData ?? []

  return (
    <>
      <Nav />
      <DashboardShell
        title="Your reports"
        subtitle="Review and share your planning checks"
        illustration="/illustrations/checklist.svg"
      >
        {error ? (
          <div className="rounded-2xl border border-[#F5C6C6] bg-[#FDECEA] p-6">
            <p className="text-sm text-[#991818]">Could not load reports. Please refresh.</p>
          </div>
        ) : (
          <DashboardReportsList reports={reports} />
        )}
      </DashboardShell>
      <Footer />
    </>
  )
}

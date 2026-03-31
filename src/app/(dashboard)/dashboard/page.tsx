import { Footer } from "@/components/layout/Footer"
import { Nav } from "@/components/layout/Nav"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A"

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

function getScoreBadgeStyles(score: number | null): { label: string; classes: string } {
  if (score == null) {
    return {
      label: "No score",
      classes: "bg-secondary text-muted-foreground",
    }
  }

  if (score >= 70) {
    return {
      label: `${Math.round(score)} / 100`,
      classes: "bg-[#EDFAF3] text-[#0F7040]",
    }
  }

  if (score >= 40) {
    return {
      label: `${Math.round(score)} / 100`,
      classes: "bg-[#FEF7E6] text-[#8A6010]",
    }
  }

  return {
    label: `${Math.round(score)} / 100`,
    classes: "bg-[#FDECEA] text-[#991818]",
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = session.user.id

  const [recentReportsResult, totalReportsResult, fullReportsResult, profileResult] = await Promise.all([
    supabase
      .from("reports")
      .select("id, postcode, lpa_name, approval_score, share_token, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("report_type", "full"),
    supabase
      .from("profiles")
      .select("full_name, email, created_at")
      .eq("id", userId)
      .maybeSingle(),
  ])

  const hasError =
    Boolean(recentReportsResult.error) ||
    Boolean(totalReportsResult.error) ||
    Boolean(fullReportsResult.error) ||
    Boolean(profileResult.error)

  const recentReports: Pick<
    Tables<"reports">,
    "id" | "postcode" | "lpa_name" | "approval_score" | "share_token" | "created_at"
  >[] = recentReportsResult.data ?? []
  const totalReports = totalReportsResult.count ?? 0
  const fullReports = fullReportsResult.count ?? 0
  const profile = profileResult.data
  const displayName =
    profile?.full_name?.trim() || profile?.email?.trim() || session.user.email || "there"
  const latestLpa = recentReports[0]?.lpa_name ?? "N/A"
  const memberSince = formatDate(profile?.created_at ?? null)

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-5xl px-6 py-12 md:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Dashboard</p>
          <h1 className="mb-1 text-3xl font-bold text-foreground">Welcome back, {displayName}</h1>
          <p className="text-sm text-muted-foreground">Your planning reports and activity</p>

          <div className="mb-8 mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-brand">
                Total reports
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{totalReports}</p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-brand">
                Full reports
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{fullReports}</p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-brand">Latest LPA</p>
              <p className="mt-2 text-base font-semibold text-foreground">{latestLpa}</p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-brand">
                Member since
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">{memberSince}</p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-foreground">Recent reports</h2>

            {hasError ? (
              <div className="rounded-2xl border border-border bg-secondary p-6">
                <p className="text-sm text-muted-foreground">
                  We could not load your dashboard data right now. Please refresh and try again.
                </p>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="rounded-2xl border border-border bg-secondary p-8 text-center">
                <Image
                  src="/illustrations/analysis.svg"
                  alt="No reports yet"
                  width={220}
                  height={160}
                  className="mx-auto h-auto w-full max-w-[220px]"
                />
                <p className="mt-5 text-sm text-muted-foreground">No reports yet. Run your first check.</p>
                <Link
                  href="/check"
                  className="mt-5 inline-flex bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                >
                  Start first check
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-background px-4 md:px-6">
                {recentReports.map((report) => {
                  const scoreBadge = getScoreBadgeStyles(report.approval_score)

                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{report.postcode}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {report.lpa_name ?? "Unknown LPA"}
                        </p>
                        <p className="text-xs text-muted-brand">{formatDate(report.created_at)}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${scoreBadge.classes}`}
                        >
                          {scoreBadge.label}
                        </span>
                        <Link
                          href={`/report/${report.share_token}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          View report
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </>
  )
}

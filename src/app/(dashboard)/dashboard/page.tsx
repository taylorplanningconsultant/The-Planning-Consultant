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
        <section className="bg-brand-dark dot-bg pt-24 pb-10">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">Dashboard</p>
                <h1 className="mb-1 text-3xl font-bold text-white">Welcome back, {displayName}</h1>
                <p className="text-sm text-white/60">Your planning reports and activity</p>
              </div>
              <div className="hidden justify-end md:flex">
                <Link
                  href="/check"
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition-opacity hover:opacity-90"
                >
                  Run new check →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-5xl px-6 py-6 md:px-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-secondary p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-brand">
                  Total reports
                </p>
                <p className="text-2xl font-bold text-foreground">{totalReports}</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-brand">
                  Full reports
                </p>
                <p className="text-2xl font-bold text-foreground">{fullReports}</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-brand">
                  Latest LPA
                </p>
                <p className="text-base font-bold text-foreground">{latestLpa}</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-brand">
                  Member since
                </p>
                <p className="text-base font-bold text-foreground">{memberSince}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Recent reports</h2>
              <Link href="/check" className="text-sm font-medium text-accent hover:underline">
                Run new check →
              </Link>
            </div>

            {hasError ? (
              <div className="rounded-2xl border border-[#F5C6C6] bg-[#FDECEA] p-6">
                <p className="text-sm text-[#991818]">
                  Could not load dashboard data. Please refresh.
                </p>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="rounded-2xl border border-border bg-secondary p-12 text-center">
                <Image
                  src="/illustrations/analysis.svg"
                  alt="No reports yet"
                  width={220}
                  height={160}
                  className="mx-auto mb-6 h-32 w-auto opacity-70"
                />
                <p className="mb-6 text-muted-foreground">
                  No reports yet. Run your first constraint check to get started.
                </p>
                <Link
                  href="/check"
                  className="inline-flex rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                >
                  Check a postcode
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                {recentReports.map((report) => {
                  const scoreBadge = getScoreBadgeStyles(report.approval_score)

                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 transition-colors last:border-0 hover:bg-secondary"
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
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${scoreBadge.classes}`}
                        >
                          {scoreBadge.label}
                        </span>
                        <Link
                          href={`/report/${report.share_token}`}
                          className="text-sm font-semibold text-accent hover:underline"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

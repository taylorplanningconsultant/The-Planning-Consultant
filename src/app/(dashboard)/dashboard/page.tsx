import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Footer } from "@/components/layout/Footer"
import { Nav } from "@/components/layout/Nav"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"
import { cn } from "@/utils/cn"
import { ArrowRight, CreditCard, FileSearch, ScrollText } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"

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

function isFullType(reportType: string | null | undefined): boolean {
  return reportType?.toLowerCase() === "full"
}

type RecentReportRow = Pick<
  Tables<"reports">,
  "id" | "postcode" | "lpa_name" | "approval_score" | "share_token" | "report_type" | "created_at"
>

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
      .select("id, postcode, lpa_name, approval_score, share_token, report_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
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

  const recentReports: RecentReportRow[] = recentReportsResult.data ?? []
  const totalReports = totalReportsResult.count ?? 0
  const fullReports = fullReportsResult.count ?? 0
  const profile = profileResult.data
  const displayName =
    profile?.full_name?.trim() || profile?.email?.trim() || session.user.email || "there"

  const latestLpa =
    recentReports.length > 0 ? (recentReports[0]?.lpa_name?.trim() || "—") : "—"
  const memberSince = formatDate(profile?.created_at ?? null)

  const quickActions = [
    {
      href: "/check",
      title: "Run new check",
      description: "Analyse a postcode and get an approval-style score.",
      icon: FileSearch,
      variant: "primary" as const,
    },
    {
      href: "/statement",
      title: "Generate statement",
      description: "Draft planning narrative for your application.",
      icon: ScrollText,
      variant: "outline" as const,
    },
    {
      href: "/dashboard/billing",
      title: "View billing",
      description: "Plans, invoices, and subscription settings.",
      icon: CreditCard,
      variant: "outline" as const,
    },
  ]

  return (
    <>
      <Nav />
      <DashboardShell
        title="Overview"
        subtitle={`Welcome back, ${displayName} — your planning workspace at a glance.`}
        illustration="/illustrations/checklist.svg"
      >
        {hasError ? (
          <div className="rounded-2xl border border-[#F5C6C6] bg-[#FDECEA] p-6">
            <p className="text-sm text-[#991818]">Could not load dashboard data. Please refresh.</p>
          </div>
        ) : (
          <div className="space-y-10 md:space-y-12">
            {/* Stats */}
            <section aria-label="Summary statistics">
              <p className="text-[#18A056] mb-3 text-xs font-bold uppercase tracking-widest">
                At a glance
              </p>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                  <p className="text-muted-brand mb-2 text-[10px] font-semibold uppercase tracking-wider">
                    Total reports
                  </p>
                  <p className="text-foreground text-3xl font-extrabold tabular-nums tracking-tight md:text-4xl">
                    {totalReports}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                  <p className="text-muted-brand mb-2 text-[10px] font-semibold uppercase tracking-wider">
                    Full reports
                  </p>
                  <p className="text-foreground text-3xl font-extrabold tabular-nums tracking-tight md:text-4xl">
                    {fullReports}
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl border border-border bg-background p-5 shadow-sm lg:col-span-1">
                  <p className="text-muted-brand mb-2 text-[10px] font-semibold uppercase tracking-wider">
                    Latest LPA
                  </p>
                  <p className="text-foreground line-clamp-2 text-base font-semibold leading-snug md:text-lg">
                    {latestLpa}
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl border border-border bg-background p-5 shadow-sm lg:col-span-1">
                  <p className="text-muted-brand mb-2 text-[10px] font-semibold uppercase tracking-wider">
                    Member since
                  </p>
                  <p className="text-foreground text-base font-semibold tabular-nums md:text-lg">
                    {memberSince}
                  </p>
                </div>
              </div>
            </section>

            {/* Quick actions */}
            <section aria-label="Quick actions">
              <div className="mb-4">
                <p className="text-[#18A056] mb-2 text-xs font-bold uppercase tracking-widest">
                  Quick actions
                </p>
                <h2 className="text-foreground text-lg font-semibold tracking-tight md:text-xl">
                  Jump back in
                </h2>
                <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                  Everything you need for checks, statements, and account billing — one tap away.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  const isPrimary = action.variant === "primary"
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={cn(
                        "group flex flex-col rounded-2xl border p-5 shadow-sm transition-colors md:p-6",
                        isPrimary
                          ? "border-transparent bg-gradient-to-br from-primary to-accent text-white hover:opacity-95"
                          : "border-border bg-background hover:bg-secondary",
                      )}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            "inline-flex rounded-lg p-2.5",
                            isPrimary ? "bg-white/15" : "bg-secondary text-primary",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" aria-hidden />
                        </span>
                        <ArrowRight
                          className={cn(
                            "h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5",
                            isPrimary ? "text-white/80" : "text-muted-brand",
                          )}
                          aria-hidden
                        />
                      </div>
                      <p
                        className={cn(
                          "font-semibold tracking-tight",
                          isPrimary ? "text-white" : "text-foreground",
                        )}
                      >
                        {action.title}
                      </p>
                      <p
                        className={cn(
                          "mt-1.5 text-sm leading-relaxed",
                          isPrimary ? "text-white/85" : "text-muted-foreground",
                        )}
                      >
                        {action.description}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* Recent reports */}
            <section aria-label="Recent reports">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[#18A056] mb-2 text-xs font-bold uppercase tracking-widest">
                    Activity
                  </p>
                  <h2 className="text-foreground text-lg font-semibold tracking-tight md:text-xl">
                    Recent reports
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Last five planning checks — open the full list anytime.
                  </p>
                </div>
                <Link
                  href="/dashboard/reports"
                  className="text-primary text-sm font-semibold hover:underline sm:shrink-0"
                >
                  View all reports
                </Link>
              </div>

              {recentReports.length === 0 ? (
                <div className="rounded-2xl border border-border bg-secondary/30 px-6 py-12 text-center shadow-sm md:px-10 md:py-14">
                  <img
                    src="/illustrations/filing.svg"
                    alt=""
                    className="mx-auto mb-6 h-auto w-40 opacity-90"
                    width={160}
                    height={160}
                  />
                  <p className="text-[#18A056] mb-2 text-xs font-bold uppercase tracking-widest">
                    No reports yet
                  </p>
                  <h3 className="text-foreground mb-3 text-xl font-extrabold tracking-tight md:text-2xl">
                    Run your first planning check
                  </h3>
                  <p className="text-muted-foreground mx-auto mb-8 max-w-md text-base leading-relaxed">
                    Get constraint-aware scores and shareable reports for any UK postcode. Your
                    history will show up here so you can jump back in anytime.
                  </p>
                  <Link
                    href="/check"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                  >
                    Start a check
                  </Link>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                  <div className="hidden border-b border-border bg-secondary/80 px-4 py-2.5 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,5rem)_minmax(0,5.5rem)_minmax(0,4rem)_auto] md:items-center md:gap-3 md:px-5">
                    <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                      Postcode
                    </span>
                    <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                      LPA
                    </span>
                    <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                      Date
                    </span>
                    <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                      Score
                    </span>
                    <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                      Type
                    </span>
                    <span className="text-muted-brand sr-only text-xs font-semibold uppercase tracking-wider md:not-sr-only">
                      Open
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {recentReports.map((report) => {
                      const scoreBadge = getScoreBadgeStyles(report.approval_score)
                      const full = isFullType(report.report_type)
                      return (
                        <li key={report.id}>
                          <Link
                            href={`/report/${report.share_token}`}
                            className="group block px-4 py-4 transition-colors hover:bg-secondary md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,5rem)_minmax(0,5.5rem)_minmax(0,4rem)_auto] md:items-center md:gap-3 md:px-5"
                          >
                            <div className="min-w-0">
                              <p className="text-foreground text-sm font-semibold tracking-tight">
                                {report.postcode}
                              </p>
                              <p className="text-muted-brand mt-0.5 text-xs md:hidden">
                                {formatDate(report.created_at)}
                              </p>
                            </div>
                            <p className="text-muted-foreground mt-2 line-clamp-2 text-sm md:mt-0">
                              {report.lpa_name ?? "Unknown LPA"}
                            </p>
                            <span className="text-muted-foreground mt-2 hidden text-sm tabular-nums md:mt-0 md:block">
                              {formatDate(report.created_at)}
                            </span>
                            <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0">
                              <span
                                className={cn(
                                  "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                                  scoreBadge.classes,
                                )}
                              >
                                {scoreBadge.label}
                              </span>
                            </div>
                            <div className="mt-2 md:mt-0">
                              <span
                                className={cn(
                                  "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                                  full
                                    ? "bg-[#EDFAF3] text-[#0F7040]"
                                    : "bg-secondary text-muted-foreground",
                                )}
                              >
                                {full ? "Full" : "Basic"}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between md:mt-0 md:justify-end">
                              <span className="text-accent text-sm font-medium group-hover:underline md:hidden">
                                View report
                              </span>
                              <span className="text-muted-brand hidden text-sm font-medium transition-colors group-hover:text-accent md:inline">
                                View
                              </span>
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </section>
          </div>
        )}
      </DashboardShell>
      <Footer />
    </>
  )
}

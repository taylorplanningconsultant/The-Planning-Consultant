import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Footer } from "@/components/layout/Footer"
import { Nav } from "@/components/layout/Nav"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"
import { cn } from "@/utils/cn"
import Link from "next/link"
import { redirect } from "next/navigation"

type StatementRow = Pick<
  Tables<"statements">,
  "id" | "address" | "proposal_text" | "lpa_name" | "status" | "created_at"
>

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

function truncateProposal(text: string, max = 90): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

function statusBadgeClasses(status: string): { label: string; className: string } {
  const s = status.toLowerCase()
  if (s === "draft") {
    return {
      label: "Draft",
      className: "bg-secondary text-muted-foreground",
    }
  }
  if (s === "complete" || s === "completed" || s === "ready") {
    return {
      label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
      className: "bg-[#EDFAF3] text-[#0F7040]",
    }
  }
  if (s === "failed" || s === "error") {
    return {
      label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
      className: "bg-[#FDECEA] text-[#991818]",
    }
  }
  return {
    label: status.replace(/_/g, " "),
    className: "bg-[#FEF7E6] text-[#8A6010]",
  }
}

export default async function DashboardStatementsPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = session.user.id

  const { data: statementsData, error } = await supabase
    .from("statements")
    .select("id, address, proposal_text, lpa_name, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const statements: StatementRow[] = statementsData ?? []
  const count = statements.length

  return (
    <>
      <Nav />
      <DashboardShell
        title="Planning statements"
        subtitle="AI-assisted drafts for design & access statements"
        illustration="/illustrations/report.svg"
      >
        {error ? (
          <div className="rounded-2xl border border-[#F5C6C6] bg-[#FDECEA] p-6">
            <p className="text-sm text-[#991818]">Could not load statements. Please refresh.</p>
          </div>
        ) : count === 0 ? (
          <div className="space-y-8">
            <div className="hero-mesh relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
              <div className="absolute right-0 top-0 h-40 w-40 opacity-[0.12] md:h-52 md:w-52" aria-hidden>
                <img
                  src="/illustrations/analysis.svg"
                  alt=""
                  className="h-full w-full object-contain"
                  width={208}
                  height={208}
                />
              </div>
              <div className="relative px-6 py-10 md:px-10 md:py-12">
                <span className="bg-brand-light text-primary mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold">
                  Coming soon
                </span>
                <p className="text-[#18A056] mb-2 text-xs font-bold uppercase tracking-widest">
                  Statement generator
                </p>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#0A0F0C] md:text-4xl md:max-w-xl">
                  Turn site constraints into persuasive narrative
                </h2>
                <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
                  A <strong className="font-semibold text-[#4A5C50]">planning statement</strong> explains
                  how your proposal responds to local policy — design, access, heritage, and sustainability.
                  Our generator will help you draft clear, structured text you can refine with your
                  architect or planning consultant — so applications read as considered, not rushed.
                </p>
                <ul className="mt-8 max-w-xl space-y-4">
                  <li className="flex gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#18A056]"
                      aria-hidden
                    />
                    <div>
                      <p className="text-foreground font-semibold">Aligns with the LPA&apos;s language</p>
                      <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                        Ground your proposal in the same policy hooks officers already use — fewer
                        rounds of clarification.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#18A056]"
                      aria-hidden
                    />
                    <div>
                      <p className="text-foreground font-semibold">Saves hours of blank-page time</p>
                      <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                        Start from a structured draft instead of a cursor — then edit for your project&apos;s
                        story.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#18A056]"
                      aria-hidden
                    />
                    <div>
                      <p className="text-foreground font-semibold">Built for UK planning context</p>
                      <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                        Tuned for how UK applications are read — from constraints to justification.
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href="/statement"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                  >
                    Open statement generator
                  </Link>
                  <p className="text-muted-brand text-sm">
                    You haven&apos;t saved any statements yet — your work will appear here.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 px-6 py-8 text-center md:px-10">
              <img
                src="/illustrations/city.svg"
                alt=""
                className="mx-auto mb-4 h-auto w-32 opacity-90 md:w-40"
                width={160}
                height={128}
              />
              <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
                We&apos;re putting the finishing touches on dashboards, exports, and version history.
                When your first statement is saved, it will show up in the list above — bookmark this
                page for when you&apos;re ready.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-muted-brand text-xs font-medium uppercase tracking-wider">
                  Library
                </p>
                <p className="text-foreground text-2xl font-extrabold tabular-nums tracking-tight md:text-3xl">
                  {count}
                  <span className="text-muted-foreground ml-2 text-base font-semibold md:text-lg">
                    {count === 1 ? "statement" : "statements"}
                  </span>
                </p>
              </div>
              <Link
                href="/statement"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-5 py-2.5 text-center text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
              >
                New statement
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              <div className="hidden border-b border-border bg-secondary/80 px-4 py-2.5 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,6.5rem)_minmax(0,6rem)] md:items-center md:gap-3 md:px-5">
                <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                  Summary
                </span>
                <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                  LPA
                </span>
                <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                  Status
                </span>
                <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                  Created
                </span>
              </div>
              <ul className="divide-y divide-border">
                {statements.map((row) => {
                  const title =
                    row.address?.trim() ||
                    truncateProposal(row.proposal_text, 72) ||
                    "Statement"
                  const badge = statusBadgeClasses(row.status)
                  return (
                    <li
                      key={row.id}
                      className="px-4 py-4 transition-colors hover:bg-secondary md:px-5"
                    >
                      <div className="md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,6.5rem)_minmax(0,6rem)] md:items-center md:gap-3">
                        <div className="min-w-0">
                          <p className="text-foreground text-sm font-semibold leading-snug">{title}</p>
                          {row.address?.trim() ? (
                            <p className="text-muted-brand mt-1 line-clamp-2 text-xs md:hidden">
                              {truncateProposal(row.proposal_text, 100)}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm md:mt-0">
                          {row.lpa_name ?? "—"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0">
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-muted-brand mt-2 text-sm tabular-nums md:mt-0 md:text-right">
                          {formatDate(row.created_at)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            <p className="text-muted-brand text-center text-xs md:text-left">
              Refine and export options are expanding — open the generator anytime from{" "}
              <Link href="/statement" className="text-primary font-medium hover:underline">
                /statement
              </Link>
              .
            </p>
          </div>
        )}
      </DashboardShell>
      <Footer />
    </>
  )
}

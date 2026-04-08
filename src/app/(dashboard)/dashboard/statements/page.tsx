import { DashboardStatementsList } from "@/components/dashboard/DashboardStatementsList"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Footer } from "@/components/layout/Footer"
import { Nav } from "@/components/layout/Nav"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"
import Link from "next/link"
import { redirect } from "next/navigation"

type StatementRow = Pick<
  Tables<"statements">,
  "id" | "address" | "proposal_text" | "lpa_name" | "status" | "created_at"
> & { project_type?: string | null }

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
    .select("id, address, proposal_text, lpa_name, status, created_at, project_type")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const statements: StatementRow[] = (statementsData ?? []) as StatementRow[]
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
                <h2 className="text-2xl font-extrabold tracking-tight text-[#0A0F0C] sm:text-3xl md:max-w-xl md:text-4xl">
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
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 sm:w-auto"
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
          <DashboardStatementsList statements={statements} />
        )}
      </DashboardShell>
      <Footer />
    </>
  )
}

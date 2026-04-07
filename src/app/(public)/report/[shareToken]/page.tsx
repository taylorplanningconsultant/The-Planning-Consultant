import { ConstraintTable } from "@/components/report/ConstraintTable"
import { DownloadPDFButton } from "@/components/report/DownloadPDFButton"
import { ReportUpgradeCTA } from "@/components/report/ReportUpgradeCTA"
import { ScoreGauge } from "@/components/report/ScoreGauge"
import { ShareLinkCopyButton } from "@/components/report/ShareLinkCopyButton"
import { Footer } from "@/components/layout/Footer"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"
import type { ConstraintResult } from "@/types/planning"
import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
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

function parseConstraintData(
  json: Tables<"reports">["constraint_data"],
): ConstraintResult[] {
  if (json == null) {
    return []
  }

  const parsed = z.array(constraintResultSchema).safeParse(json)
  if (!parsed.success) {
    return []
  }

  return parsed.data
}

type ReportPageProps = {
  params: Promise<{ shareToken: string }>
  searchParams: Promise<{ session_id?: string | string[] }>
}

export default async function SharedReportPage({
  params,
  searchParams,
}: ReportPageProps) {
  const { shareToken } = await params
  const query = await searchParams
  const sessionId = Array.isArray(query.session_id)
    ? query.session_id[0]
    : query.session_id

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: reportRow, error } = await supabase
    .from("reports")
    .select(
      "id, user_id, address, postcode, lpa_name, approval_score, constraint_data, ai_assessment, report_type",
    )
    .eq("share_token", shareToken)
    .maybeSingle()

  if (error) {
    return (
      <>
        <main className="min-h-screen bg-background">
          <section className="mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
              Report
            </p>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Unable to load report
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Please try again in a moment.
            </p>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  if (!reportRow) {
    return (
      <>
        <main className="min-h-screen bg-background">
          <section className="mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
              Report
            </p>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Report not found
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              This share link is invalid or the report is no longer available.
            </p>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  let report = reportRow
  let claimedThisRequest = false

  if (report.user_id === null && user?.id) {
    const { data: updated, error: claimError } = await supabase
      .from("reports")
      .update({ user_id: user.id })
      .eq("share_token", shareToken)
      .is("user_id", null)
      .select("id")

    if (!claimError && updated && updated.length > 0) {
      claimedThisRequest = true
      report = { ...report, user_id: user.id }
    }
  }

  const isOwner = Boolean(
    user?.id && report.user_id && user.id === report.user_id,
  )
  const showUpgrade =
    report.report_type?.toLowerCase() === "basic" && isOwner
  const isFullReport = report.report_type?.toLowerCase() === "full"

  const canDownloadPdf =
    Boolean(sessionId) ||
    Boolean(user?.id && report.user_id && user.id === report.user_id)

  const constraints = parseConstraintData(report.constraint_data)

  return (
    <>
      <main className="min-h-screen bg-background">
        <section className="bg-brand-dark dot-bg dot-bg-on-dark pt-20 md:pt-24">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 px-6 py-10 md:grid-cols-2 md:py-14">
            <div className="flex flex-col gap-4">
              <p className="text-xs uppercase tracking-widest text-white/50">
                Planning Constraints Report
              </p>
              <h1 className="text-3xl font-bold text-white">{report.address}</h1>
              <p className="text-sm text-white/60">
                {report.postcode} ·{" "}
                {String((report as Record<string, unknown>).lpa_name ?? "Unknown LPA")}
              </p>
              <div className="mt-2 flex gap-3">
                <ShareLinkCopyButton />
                {canDownloadPdf ? (
                  <DownloadPDFButton reportId={report.id} />
                ) : null}
              </div>
            </div>
            <div className="hidden md:block">
              <Image
                src="/illustrations/report.svg"
                alt=""
                width={320}
                height={280}
                className="mx-auto h-auto w-full max-w-xs opacity-80"
              />
            </div>
          </div>
        </section>

        {showUpgrade ? (
          <section className="border-b border-border bg-background">
            <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
              <ReportUpgradeCTA reportId={report.id} email={user?.email} />
            </div>
          </section>
        ) : null}

        <section className="bg-background py-10">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="rounded-2xl border border-border bg-secondary p-6">
                <ScoreGauge score={report.approval_score} blurred={false} />
                <div className="mt-4 text-center">
                  {(report.approval_score ?? 0) >= 70 ? (
                    <p className="font-semibold text-[#0F7040]">Good prospects</p>
                  ) : (report.approval_score ?? 0) >= 40 ? (
                    <p className="font-semibold text-[#8A6010]">Some constraints</p>
                  ) : (
                    <p className="font-semibold text-[#991818]">Significant constraints</p>
                  )}
                </div>

                <div className="mt-6 border-t border-border pt-6">
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-brand">
                    Constraint Summary
                  </p>
                  {constraints.map((constraint) => (
                    <div
                      key={`${constraint.category}-${constraint.label}`}
                      className="flex items-center gap-2 py-1.5"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          constraint.status === "pass"
                            ? "bg-[#18A056]"
                            : constraint.status === "flag"
                              ? "bg-[#C49A3C]"
                              : "bg-[#D94040]"
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {constraint.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              {report.ai_assessment ? (
                <div>
                  <div className="mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" aria-hidden />
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">
                      AI Planning Assessment
                    </p>
                  </div>
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mb-4 mt-6 text-2xl font-bold text-foreground">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-3 mt-6 border-t border-border pt-4 text-lg font-bold text-foreground">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-2 mt-4 text-base font-semibold text-foreground">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-3 list-inside list-disc space-y-1">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm leading-relaxed text-muted-foreground">
                          {children}
                        </li>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-3 list-inside list-decimal space-y-1">
                          {children}
                        </ol>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">
                          {children}
                        </strong>
                      ),
                    }}
                  >
                    {report.ai_assessment}
                  </ReactMarkdown>
                </div>
              ) : (
                <ConstraintTable constraints={constraints} showAll={true} />
              )}

              {!user && isFullReport ? (
                <div className="mt-6 rounded-2xl border border-border bg-secondary p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-bold text-foreground">
                        Save this report to your account
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Create a free account to access this report anytime from your
                        dashboard.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={`/login?next=/report/${shareToken}`}
                          className="inline-block rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                        >
                          Create account
                        </Link>
                        <Link
                          href={`/login?next=/report/${shareToken}`}
                          className="inline-block rounded-lg border border-ring px-6 py-3 font-medium text-muted-foreground transition-colors hover:bg-muted"
                        >
                          Sign in
                        </Link>
                      </div>
                    </div>
                    <Image
                      src="/illustrations/celebrate.svg"
                      alt=""
                      width={180}
                      height={140}
                      className="h-auto w-full max-w-[180px] self-start opacity-90 md:self-center"
                    />
                  </div>
                </div>
              ) : null}

              {claimedThisRequest ? (
                <div className="mt-6 rounded-2xl border border-border bg-brand-light p-6">
                  <p className="font-semibold text-foreground">
                    This report has been saved to your account
                  </p>
                  <Link
                    href="/dashboard/reports"
                    className="mt-3 inline-block font-semibold text-primary hover:opacity-90"
                  >
                    View in dashboard
                  </Link>
                </div>
              ) : null}

              {report.user_id === null && !user && !isFullReport ? (
                <div className="mt-6 rounded-2xl border border-border bg-secondary p-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
                    Save this report
                  </p>
                  <h3 className="mb-2 font-bold text-foreground">
                    Create a free account to save this report
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Sign up to access this report anytime from your dashboard.
                  </p>
                  <Link
                    href={`/login?next=/report/${shareToken}`}
                    className="inline-block rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                  >
                    Save to my account
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-secondary py-10">
          <div className="mx-auto max-w-5xl px-6">
            <p className="mb-6 text-xs font-bold uppercase tracking-widest text-accent">
              Full Constraint Analysis
            </p>
            <ConstraintTable constraints={constraints} showAll={true} />
          </div>
        </section>

        <section className="bg-brand-dark dot-bg dot-bg-on-dark py-10">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-6 px-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6">
              <Image
                src="/illustrations/undraw_agreement_ftet.svg"
                alt=""
                width={200}
                height={112}
                className="mb-4 h-28 w-auto opacity-90"
              />
              <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                Next step
              </p>
              <h3 className="mb-2 text-lg font-bold text-white">
                Get your planning statement
              </h3>
              <p className="flex-1 text-sm text-white/60">
                AI-generated planning statement citing your local planning
                policies. Ready to submit.
              </p>
              <a
                href="/statement"
                className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-dark"
              >
                Get statement — £59
              </a>
            </div>

            <div className="flex flex-col rounded-2xl border border-white/20 bg-white/10 p-6">
              <Image
                src="/illustrations/experts.svg"
                alt=""
                width={200}
                height={112}
                className="mb-4 h-28 w-auto opacity-90"
              />
              <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                Professional help
              </p>
              <h3 className="mb-2 text-lg font-bold text-white">
                Expert planning advice
              </h3>
              <p className="flex-1 text-sm text-white/60">
                Get in touch and we&apos;ll connect you with an RTPI-accredited
                consultant in your area.
              </p>
              <a
                href="mailto:hello@theplanningconsultant.com"
                className="mt-4 inline-block rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white"
              >
                Speak to a planning consultant
              </a>
            </div>
          </div>
        </section>

        <p className="border-t border-border py-4 text-center text-xs text-muted-brand/50">
          Guidance only ·{" "}
          <Link href="/terms" className="underline">
            View terms
          </Link>
        </p>
      </main>
      <Footer />
    </>
  )
}

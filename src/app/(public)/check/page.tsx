"use client"

import {
  StructuredProjectForm,
  type ProjectAnswers,
} from "@/components/planning/StructuredProjectForm"
import { ConstraintTable } from "@/components/report/ConstraintTable"
import { ScoreGauge } from "@/components/report/ScoreGauge"
import { SparkleLoader } from "@/components/ui/SparkleLoader"
import { Footer } from "@/components/layout/Footer"
import { trackPurchase } from "@/lib/analytics"
import { createClient } from "@/lib/supabase/client"
import { STRIPE_PRODUCTS } from "@/lib/stripe/products"
import type {
  ConstraintCheckResponse,
  ConstraintResult,
} from "@/types/planning"
import { cn } from "@/utils/cn"
import { Check, Loader2, Lock, ShieldCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import ReactMarkdown, { type Components } from "react-markdown"
import type { User } from "@supabase/supabase-js"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"

const primaryCtaClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-accent px-8 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"

const outlineButtonClassName =
  "inline-flex items-center justify-center rounded-lg border border-ring px-6 py-3 font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"

function scoreBandClass(score: number): string {
  if (score >= 70) return "text-[#0F7040]"
  if (score >= 40) return "text-[#8A6010]"
  return "text-[#991818]"
}

function scoreBandLabel(score: number): string {
  if (score >= 70) return "Good prospects"
  if (score >= 40) return "Some constraints"
  return "Significant constraints"
}

function normalizePostcodeInput(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, " ").trim()
}

function splitFirstParagraph(text: string): { first: string; rest: string } {
  const trimmed = text.trim()
  const parts = trimmed.split(/\n\s*\n/)
  if (parts.length <= 1) {
    const single = parts[0] ?? ""
    return { first: single, rest: "" }
  }
  return {
    first: parts[0].trim(),
    rest: parts.slice(1).join("\n\n").trim(),
  }
}

const assessmentPreviewMarkdownComponents: Components = {
  h1: (props) => (
    <h1 className="mb-3 mt-4 text-xl font-bold text-foreground">{props.children}</h1>
  ),
  h2: (props) => (
    <h2 className="mb-2 mt-6 border-t border-border pt-4 text-lg font-bold text-foreground">
      {props.children}
    </h2>
  ),
  h3: (props) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-foreground">
      {props.children}
    </h3>
  ),
  p: (props) => (
    <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{props.children}</p>
  ),
  ul: (props) => (
    <ul className="list-disc list-inside space-y-1 mb-3">{props.children}</ul>
  ),
  li: (props) => (
    <li className="text-sm text-muted-foreground">{props.children}</li>
  ),
  strong: (props) => (
    <strong className="font-semibold text-foreground">{props.children}</strong>
  ),
}

/**
 * Always shown inside the blurred teaser (in addition to any real continuation text)
 * so single-paragraph assessments still get a visible “more below” hook.
 */
const ASSESSMENT_PREVIEW_HOOK = `

The full write-up continues with plain-English notes on your constraint flags, what they usually mean for applications like yours, and practical next steps.

Unlocking delivers the complete PDF — ready to share with a designer or builder.`

function AssessmentPreviewBlock({
  assessment,
  paymentLoading,
  onUnlock,
  onBundleUnlock,
  isGuest,
}: {
  assessment: string
  paymentLoading: boolean
  onUnlock: () => void
  onBundleUnlock: () => void
  isGuest: boolean
}) {
  const { first, rest } = splitFirstParagraph(assessment)
  return (
    <div>
      <ReactMarkdown components={assessmentPreviewMarkdownComponents}>
        {first}
      </ReactMarkdown>
      <div className="relative mt-4">
        <div
          className={cn(
            "pointer-events-none min-h-[7.5rem] max-h-60 select-none overflow-hidden rounded-lg border border-border/60 bg-secondary/40 px-5 py-5",
            "blur-[3.873px]",
            "[-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_55%,rgba(0,0,0,0.65)_85%,transparent_100%)]",
            "[mask-image:linear-gradient(to_bottom,#000_0%,#000_55%,rgba(0,0,0,0.65)_85%,transparent_100%)]",
          )}
          aria-hidden
        >
          {rest ? (
            <ReactMarkdown components={assessmentPreviewMarkdownComponents}>
              {rest}
            </ReactMarkdown>
          ) : null}
          <ReactMarkdown components={assessmentPreviewMarkdownComponents}>
            {ASSESSMENT_PREVIEW_HOOK}
          </ReactMarkdown>
        </div>
        <div className="relative z-10 -mt-10 w-full px-2 pb-1 pt-3">
          <div className="mx-auto flex w-full max-w-md flex-col">
            <p className="mb-3 text-center text-xs leading-relaxed text-muted-foreground">
              Built from live data at planning.data.gov.uk and OS Data Hub —
              the same sources your local council uses.
            </p>
            <button
              type="button"
              onClick={onUnlock}
              disabled={paymentLoading}
              className={cn(
                primaryCtaClassName,
                "shadow-lg w-full max-w-none md:w-full",
              )}
            >
              {paymentLoading
                ? "Redirecting to secure payment…"
                : "Unlock full report — £29 one-off"}
            </button>
            <p className="mt-2 text-center text-xs text-muted-brand">
              vs. £200–£500 for a consultant assessment
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              One-off payment. Instant delivery. No subscription.
            </p>
            <p className="my-2 text-center text-xs text-muted-brand">or</p>
            <button
              type="button"
              onClick={onBundleUnlock}
              disabled={paymentLoading}
              className="w-full rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paymentLoading
                ? "Redirecting to secure payment…"
                : "Report + Statement — £99"}
            </button>
            {isGuest ? (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                <a href="/login" className="font-medium text-primary hover:underline">
                  Sign in or create an account
                </a>{" "}
                to purchase the bundle
              </p>
            ) : null}
            <p className="mt-2 text-center text-xs font-medium text-primary">
              Save £9 vs buying separately (£29 + £79)
            </p>
            <p className="mt-1.5 text-center text-xs text-muted-brand">
              Bundle includes full report + planning statement draft
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckPageContent() {
  const searchParams = useSearchParams()
  const postcodeFromQuery =
    searchParams.get("postcode") ?? searchParams.get("address") ?? ""

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    if (!sessionId) return
    trackPurchase(29)
  }, [searchParams])

  const [postcode, setPostcode] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ConstraintCheckResponse | null>(null)
  const [emailUnlocked, setEmailUnlocked] = useState(false)
  const [leadEmail, setLeadEmail] = useState("")
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [assessment, setAssessment] = useState("")
  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const [showCreditConfirm, setShowCreditConfirm] = useState(false)
  const [pendingAnswers, setPendingAnswers] = useState<ProjectAnswers | null>(
    null,
  )
  const [creditsBalance, setCreditsBalance] = useState(0)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [isSubscriber, setIsSubscriber] = useState(false)
  const [projectFormKey, setProjectFormKey] = useState(0)
  const [creditDialogPending, setCreditDialogPending] = useState(false)
  const [formStepLoading, setFormStepLoading] = useState({
    loadingQuestions: false,
    reviewLoading: false,
  })
  const [cachedAnswers, setCachedAnswers] = useState<Record<string, string>>(
    {},
  )
  const [lastDescription, setLastDescription] = useState("")

  const resultsSectionRef = useRef<HTMLElement | null>(null)
  const projectDetailsSectionRef = useRef<HTMLDivElement | null>(null)
  const hasScrolledToResultsRef = useRef(false)
  const hasScrolledToProjectDetailsRef = useRef(false)

  useEffect(() => {
    setPostcode(postcodeFromQuery)
  }, [postcodeFromQuery])

  useEffect(() => {
    let cancelled = false

    async function loadCreditsProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setAuthUser(null)
        setIsSubscriber(false)
        setCreditsBalance(0)
        return
      }
      setAuthUser(user)
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits_balance, subscription_tier")
        .eq("id", user.id)
        .single()
      if (cancelled) return
      const row = profile as {
        credits_balance?: number | null
        subscription_tier?: string | null
      } | null
      setCreditsBalance(row?.credits_balance ?? 0)
      setIsSubscriber((row?.subscription_tier ?? "free") !== "free")
    }

    void loadCreditsProfile()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!result) {
      hasScrolledToResultsRef.current = false
      hasScrolledToProjectDetailsRef.current = false
      return
    }
    if (isLoading) return
    if (!hasScrolledToResultsRef.current) {
      hasScrolledToResultsRef.current = true
      const frame = requestAnimationFrame(() => {
        resultsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      })
      return () => cancelAnimationFrame(frame)
    }
  }, [result, isLoading])

  useEffect(() => {
    if (!emailUnlocked || !result) return
    if (hasScrolledToProjectDetailsRef.current) return
    hasScrolledToProjectDetailsRef.current = true
    const frame = requestAnimationFrame(() => {
      projectDetailsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [emailUnlocked, result])

  async function fetchSuggestions(pc: string) {
    if (pc.length < 5) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const res = await fetch(
        `/api/address-lookup?postcode=${encodeURIComponent(pc)}`,
      )
      const data = await res.json()
      const list = data.addresses ?? []
      setSuggestions(list)
      setShowSuggestions(list.length > 0)
    } catch {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const postcodeNorm = normalizePostcodeInput(postcode)
    if (postcodeNorm.length < 5) {
      setError("Enter a valid UK postcode.")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setEmailUnlocked(false)
    setAssessment("")
    setShowCreditConfirm(false)
    setPendingAnswers(null)
    setCachedAnswers({})
    setLastDescription("")
    setProjectFormKey((k) => k + 1)

    try {
      const response = await fetch("/api/check-constraints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: postcode.trim().toUpperCase(),
          address: `Property in ${postcode.trim().toUpperCase()}`,
        }),
      })
      const data = (await response.json()) as unknown

      if (!response.ok) {
        setError("Check failed. Please try again.")
        return
      }

      setPostcode(postcodeNorm)
      setResult(data as ConstraintCheckResponse)
    } catch {
      setError("Check failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLeadSubmitting(true)
    try {
      const res = await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: leadEmail,
          postcode,
          reportId: result?.reportId,
        }),
      })
      const data = (await res.json()) as {
        constraints?: ConstraintCheckResponse["constraints"]
        score?: ConstraintCheckResponse["score"]
      }
      if (data.constraints) {
        setResult((prev) =>
          prev
            ? {
                ...prev,
                constraints: data.constraints as ConstraintResult[],
                score: data.score ?? prev.score,
              }
            : prev,
        )
      }
      setEmailUnlocked(true)
    } finally {
      setLeadSubmitting(false)
    }
  }

  async function runGenerateReport(answers: ProjectAnswers) {
    setAssessmentLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId: result?.reportId,
          projectType: answers.projectType,
          description: JSON.stringify(answers),
        }),
      })
      if (res.status === 402) {
        setError(
          "You have insufficient credits. Please top up or upgrade your plan.",
        )
        return
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.")
        return
      }
      const data = await res.json()
      if (data.assessment) {
        setAssessment(data.assessment)
        if (isSubscriber) {
          setCreditsBalance((b) => Math.max(0, b - 1))
        }
      }
    } finally {
      setAssessmentLoading(false)
    }
  }

  async function handlePayment(priceId: string) {
    setPaymentLoading(true)
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          reportId: result?.reportId,
          email: leadEmail,
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleFormInternalLoadingChange = useCallback(
    (state: { loadingQuestions: boolean; reviewLoading: boolean }) => {
      setFormStepLoading(state)
    },
    [],
  )

  const postcodeFieldsDisabled =
    isLoading ||
    assessmentLoading ||
    formStepLoading.loadingQuestions ||
    formStepLoading.reviewLoading

  const trustItems = [
    "8 constraint categories checked",
    "337 local authorities covered",
    "Results in under 60 seconds",
    "Planning consultants charge £200–£500 for this — yours is free",
  ] as const

  const showStateAIdle = !isLoading && !result

  return (
    <>
      <main className="min-h-screen bg-background pt-[58px] font-sans">
        <section className="bg-brand-dark dot-bg dot-bg-on-dark py-10 md:py-24">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <span className="mb-4 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85 md:mb-8">
                  Planning constraint analysis
                </span>
                <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white md:mb-6 md:text-5xl">
                  Find out if your project has planning problems — before you
                  spend anything
                </h1>
                <p className="max-w-xl text-base font-normal leading-relaxed text-white/75 md:text-xl">
                  Enter your postcode. In 60 seconds we&apos;ll flag conservation
                  areas, flood risk, permitted development restrictions, and more
                  — completely free.
                </p>
              </div>
              <div className="hidden text-center md:block">
                <Image
                  src="/illustrations/agreement.svg"
                  alt=""
                  width={320}
                  height={280}
                  className="mx-auto h-auto w-full max-w-sm opacity-95"
                />
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="border-b border-border bg-secondary">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8 md:flex-row md:items-end md:gap-10 md:px-8 md:py-14">
            <div className="min-w-0 flex-1">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent">
                Site location
              </p>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Enter the postcode for the property or site you wish to
                screen. We use it to resolve the local planning authority and
                retrieve constraint layers for that area.
              </p>
              <div className="relative">
                <label
                  htmlFor="check-postcode"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Site postcode
                </label>
                <input
                  id="check-postcode"
                  type="text"
                  value={postcode}
                  onChange={async (e) => {
                    const val = e.target.value.toUpperCase()
                    setPostcode(val)
                    await fetchSuggestions(val)
                  }}
                  autoComplete="postal-code"
                  disabled={postcodeFieldsDisabled}
                  className={inputClassName}
                  placeholder="Enter postcode"
                  inputMode="text"
                  spellCheck={false}
                  role="combobox"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-controls="check-postcode-suggestions"
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                />
                {showSuggestions && suggestions.length > 0 ? (
                  <div
                    id="check-postcode-suggestions"
                    className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-lg"
                    role="listbox"
                  >
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setPostcode(s)
                          setSuggestions([])
                          setShowSuggestions(false)
                        }}
                        className="w-full border-b border-border px-4 py-2.5 text-left text-sm text-foreground last:border-0 hover:bg-secondary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="w-full shrink-0 md:w-auto md:pb-0.5">
              <button
                type="submit"
                disabled={postcodeFieldsDisabled}
                className={cn(
                  primaryCtaClassName,
                  "min-h-12 min-w-[200px] w-full flex-shrink-0 whitespace-nowrap px-10 md:w-auto",
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin"
                      aria-hidden
                    />
                    Retrieving…
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        </form>

        {error && !result ? (
          <div
            className="border-b border-[#F5C6C6] bg-[#FDECEA] py-3"
            role="alert"
          >
            <div className="mx-auto max-w-5xl px-6 text-sm font-medium text-[#991818] md:px-8">
              {error}
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <section className="w-full bg-background py-20 md:py-24">
            <div className="mx-auto max-w-3xl px-6 md:px-8">
              <Image
                src="/illustrations/agreement.svg"
                alt=""
                width={140}
                height={140}
                className="mx-auto mb-10 h-auto w-36 opacity-70"
              />
              <div className="flex justify-center">
                <SparkleLoader message="Retrieving planning constraints" />
              </div>
              <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
                Querying live datasets for your local planning authority — please
                wait a moment
              </p>
            </div>
          </section>
        ) : null}

        {showStateAIdle ? (
          <section className="border-b border-border bg-background py-8 md:py-10">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-6 md:px-8">
              {trustItems.map((label) => (
                <div key={label} className="flex max-w-xs items-start gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden
                  />
                  <span className="text-sm font-medium leading-snug text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!result && !isLoading && (
          <div className="bg-background py-20 md:py-28">
            <div className="mx-auto max-w-5xl px-6 md:px-8">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-accent">
                The service
              </p>
              <h2 className="mx-auto mb-6 max-w-2xl text-center text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                What you&apos;ll see in your free check
              </h2>
              <p className="mx-auto mb-16 max-w-2xl text-center text-base leading-relaxed text-muted-foreground">
                Enter your postcode and we&apos;ll check all 8 constraint
                categories for your area instantly — free, no account needed.
                Upgrade to a full PDF report for £29 if you want the complete
                written analysis.
              </p>
              <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
                <div className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-secondary p-8">
                  <Image
                    src="/illustrations/checklist.svg"
                    alt=""
                    width={200}
                    height={160}
                    className="h-28 w-auto object-contain opacity-90"
                  />
                  <h3 className="text-lg font-bold text-foreground">
                    Eight constraint categories
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Conservation areas, listed buildings, Article 4 directions,
                    flood risk, green belt, AONB, tree preservation, and
                    permitted development context — queried from current national
                    datasets.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-secondary p-8">
                  <Image
                    src="/illustrations/analysis.svg"
                    alt=""
                    width={200}
                    height={160}
                    className="h-28 w-auto object-contain opacity-90"
                  />
                  <h3 className="text-lg font-bold text-foreground">
                    Approval likelihood score
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    After you unlock your free summary, an AI-assisted score
                    reflects constraint severity for your site — a concise
                    indicator, not a substitute for professional advice.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-secondary p-8">
                  <Image
                    src="/illustrations/report.svg"
                    alt=""
                    width={200}
                    height={160}
                    className="h-28 w-auto object-contain opacity-90"
                  />
                  <h3 className="text-lg font-bold text-foreground">
                    Full PDF — £29 one-off
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Purchase when you need the complete written report with
                    analysis, next steps, and policy references to share with
                    your architect or planning consultant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && result ? (
          <>
            <section className="border-b border-border bg-secondary py-6 md:py-7">
              <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 md:flex-row md:items-baseline md:justify-between md:px-8">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Site postcode:
                  </span>{" "}
                  {normalizePostcodeInput(postcode) || "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Local planning authority:
                  </span>{" "}
                  {result.lpa.lpaName}
                </p>
              </div>
            </section>

            <section
              ref={resultsSectionRef}
              id="check-results"
              tabIndex={-1}
              className="scroll-mt-[58px] bg-background py-14 md:py-20 focus:outline-none"
            >
              {error ? (
                <div
                  className="border-b border-[#F5C6C6] bg-[#FDECEA] py-3"
                  role="alert"
                >
                  <div className="mx-auto max-w-5xl px-6 text-sm font-medium text-[#991818] md:px-8">
                    {error}
                  </div>
                </div>
              ) : null}
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 md:grid-cols-4 md:gap-8 md:px-8">
                <div className="md:col-span-1">
                  <div className="sticky top-6 rounded-2xl border border-border bg-background p-8 shadow-sm">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent">
                      Approval likelihood
                    </p>
                    <ScoreGauge
                      score={result.score ?? 0}
                      blurred={!emailUnlocked}
                    />
                    <div className="mt-5 text-center">
                      {emailUnlocked ? (
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            scoreBandClass(result.score ?? 0),
                          )}
                        >
                          {scoreBandLabel(result.score ?? 0)}
                        </p>
                      ) : (
                        <p className="flex items-center justify-center gap-2 text-sm text-muted-brand">
                          <Lock className="h-4 w-4 text-muted-brand" />
                          Submit email below to reveal score
                        </p>
                      )}
                    </div>
                    <div className="mt-8 border-t border-border pt-6">
                      <p className="text-xs leading-relaxed text-muted-brand">
                        Indicative score only, derived from live constraint
                        flags. Not a substitute for RTPI-accredited advice.
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <ShieldCheck
                          className="h-4 w-4 flex-shrink-0 text-accent"
                          aria-hidden
                        />
                        <span className="text-xs text-muted-brand">
                          Authoritative data sources
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
                    Constraint summary
                  </p>
                  <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {result.constraints.length} of eight categories reviewed
                  </h2>
                  <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
                    Data retrieved from national planning and environmental
                    datasets (including planning.data.gov.uk).
                  </p>
                  <ConstraintTable
                    constraints={result.constraints}
                    showAll={true}
                    freeDetailCount={3}
                    detailsUnlocked={emailUnlocked}
                  />

                  {!emailUnlocked ? (
                    <div className="mt-10 grid grid-cols-1 items-center gap-10 rounded-2xl border border-border bg-secondary p-8 md:grid-cols-2 md:gap-12 md:p-10">
                      <div>
                        <h3 className="mb-4 text-2xl font-bold text-foreground">
                          Your results are ready — unlock them free
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          See the full explanation for all 8 constraints, your
                          approval likelihood score, and recommended next steps.
                          Free — no payment required.
                        </p>
                        <Image
                          src="/illustrations/report.svg"
                          alt=""
                          width={160}
                          height={160}
                          className="mt-8 hidden h-auto w-40 opacity-85 md:block"
                        />
                      </div>
                      <div>
                        <form onSubmit={handleLeadSubmit}>
                          <label
                            htmlFor="check-lead-email"
                            className="mb-2 block text-sm font-semibold text-foreground"
                          >
                            Correspondence email
                          </label>
                          <input
                            id="check-lead-email"
                            type="email"
                            value={leadEmail}
                            onChange={(e) => setLeadEmail(e.target.value)}
                            placeholder="Your email address"
                            required
                            className={cn(inputClassName, "mb-4 w-full py-3.5")}
                            autoComplete="email"
                          />
                          <button
                            type="submit"
                            disabled={leadSubmitting}
                            className={cn(
                              primaryCtaClassName,
                              "md:w-full px-10",
                            )}
                          >
                            {leadSubmitting
                              ? "Saving…"
                              : "Unlock my free results"}
                          </button>
                          <p className="mt-4 text-center text-xs text-muted-brand">
                            We will not send unsolicited marketing. You may
                            unsubscribe at any time.
                          </p>
                        </form>
                      </div>
                    </div>
                  ) : null}

                  {emailUnlocked && !assessment ? (
                    <div
                      ref={projectDetailsSectionRef}
                      id="check-project-details"
                      tabIndex={-1}
                      className="mt-10 scroll-mt-[58px] focus:outline-none"
                    >
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
                        Written assessment
                      </p>
                      <h3 className="mb-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        Particulars for your AI report
                      </h3>
                      <p className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
                        The following information shapes the narrative of your
                        planning assessment. Please complete each part in order.
                      </p>
                      <div className="space-y-6">
                        <StructuredProjectForm
                          key={projectFormKey}
                          purpose="report"
                          constraints={result?.constraints}
                          lpaName={result?.lpa?.lpaName}
                          isLoading={assessmentLoading}
                          cachedAnswers={cachedAnswers}
                          setCachedAnswers={setCachedAnswers}
                          lastDescription={lastDescription}
                          setLastDescription={setLastDescription}
                          hideFinishingLoader={
                            showCreditConfirm || creditDialogPending
                          }
                          onInternalLoadingChange={
                            handleFormInternalLoadingChange
                          }
                          onComplete={async (answers) => {
                            if (authUser && isSubscriber) {
                              setCreditDialogPending(true)
                              try {
                                const supabase = createClient()
                                const { data: profile } = await supabase
                                  .from("profiles")
                                  .select("credits_balance")
                                  .eq("id", authUser.id)
                                  .single()
                                const row = profile as {
                                  credits_balance?: number | null
                                } | null
                                setCreditsBalance(row?.credits_balance ?? 0)
                                setPendingAnswers(answers)
                                setShowCreditConfirm(true)
                              } finally {
                                setCreditDialogPending(false)
                              }
                              return
                            }
                            await runGenerateReport(answers)
                          }}
                        />
                        {showCreditConfirm ? (
                          <div
                            className="rounded-2xl border border-border bg-secondary p-6 shadow-sm"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="credit-confirm-title"
                          >
                            <h3
                              id="credit-confirm-title"
                              className="mb-2 text-base font-bold text-foreground"
                            >
                              Generate your AI report
                            </h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                              You have {creditsBalance}{" "}
                              {creditsBalance === 1 ? "credit" : "credits"}{" "}
                              available.
                            </p>
                            <div className="flex flex-row gap-2">
                              <button
                                type="button"
                                className={cn(
                                  outlineButtonClassName,
                                  "min-w-0 flex-1 py-2 px-3 text-sm",
                                )}
                                onClick={() => {
                                  setShowCreditConfirm(false)
                                  setPendingAnswers(null)
                                  setCreditDialogPending(false)
                                  setProjectFormKey((k) => k + 1)
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={creditsBalance === 0}
                                className={cn(
                                  primaryCtaClassName,
                                  "min-w-0 flex-1 py-2 px-3 text-sm !w-auto",
                                )}
                                onClick={() => {
                                  if (!pendingAnswers) return
                                  const answers = pendingAnswers
                                  setShowCreditConfirm(false)
                                  setPendingAnswers(null)
                                  setCreditDialogPending(false)
                                  void runGenerateReport(answers)
                                }}
                              >
                                {creditsBalance === 0
                                  ? "No credits remaining"
                                  : "Use 1 credit"}
                              </button>
                            </div>
                            {creditsBalance === 0 ? (
                              <p className="mt-2 text-xs text-danger">
                                You have no credits.{" "}
                                <Link
                                  href="/dashboard/billing"
                                  className="text-accent underline-offset-2 hover:underline"
                                >
                                  Top up here →
                                </Link>
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {emailUnlocked && assessment ? (
                    <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-brand-dark dot-bg dot-bg-on-dark text-white shadow-xl ring-1 ring-white/10">
                      <div className="border-b border-white/10 px-8 py-8 md:px-10 md:py-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                          Report preview
                        </p>
                        <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                          Planning assessment
                        </h3>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
                          The following is an extract. Purchase the full report
                          to remove the paywall and receive the complete PDF.
                        </p>
                      </div>
                      <div className="bg-background px-8 py-8 text-foreground md:px-10 md:py-10">
                        <AssessmentPreviewBlock
                          assessment={assessment}
                          paymentLoading={paymentLoading}
                          onUnlock={() =>
                            handlePayment(STRIPE_PRODUCTS.oneOff.fullReport)
                          }
                          onBundleUnlock={() => {
                            if (!authUser) {
                              window.location.href = "/login"
                              return
                            }
                            handlePayment(STRIPE_PRODUCTS.oneOff.bundle)
                          }}
                          isGuest={!authUser}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
      <Footer />
    </>
  )
}

function CheckLoadingFallback() {
  return (
    <>
      <main className="min-h-screen bg-background pt-[58px] font-sans">
        <section className="bg-brand-dark dot-bg dot-bg-on-dark py-10 md:py-24">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <span className="mb-4 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85 md:mb-8">
              Planning constraint analysis
            </span>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white md:mb-6 md:text-5xl">
              Find out if your project has planning problems — before you spend
              anything
            </h1>
            <p className="max-w-xl text-base font-normal leading-relaxed text-white/75 md:text-xl">
              Enter your postcode. In 60 seconds we&apos;ll flag conservation
              areas, flood risk, permitted development restrictions, and more
              — completely free.
            </p>
          </div>
        </section>
        <div className="border-b border-border bg-secondary">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8 md:flex-row md:items-end md:gap-10 md:px-8 md:py-14">
            <div className="min-w-0 flex-1">
              <div className="mb-4 h-3 w-28 animate-pulse rounded bg-border" />
              <div className="mb-4 h-12 max-w-lg animate-pulse rounded bg-white/60" />
              <div className="h-[46px] w-full max-w-md animate-pulse rounded-lg bg-white/80" />
            </div>
            <div className="h-12 w-full max-w-[200px] shrink-0 animate-pulse rounded-lg bg-white/40 md:pb-0.5" />
          </div>
        </div>
        <section className="w-full bg-background py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <div className="flex justify-center">
              <SparkleLoader message="Loading" />
            </div>
            <p className="mt-8 text-center text-sm text-muted-brand">
              Preparing form…
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default function CheckPage() {
  return (
    <Suspense fallback={<CheckLoadingFallback />}>
      <CheckPageContent />
    </Suspense>
  )
}

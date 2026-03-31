"use client"

import { ConstraintTable } from "@/components/report/ConstraintTable"
import { ScoreGauge } from "@/components/report/ScoreGauge"
import { SparkleLoader } from "@/components/ui/SparkleLoader"
import { Footer } from "@/components/layout/Footer"
import { Nav } from "@/components/layout/Nav"
import { STRIPE_PRODUCTS } from "@/lib/stripe/products"
import type { ConstraintCheckResponse } from "@/types/planning"
import { cn } from "@/utils/cn"
import {
  Check,
  ChevronDown,
  Clock,
  Database,
  Loader2,
  Lock,
  Shield,
  ShieldCheck,
} from "lucide-react"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"

const primaryCtaClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-accent px-8 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"

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

const PROJECT_TYPE_OPTIONS = [
  "Rear extension",
  "Loft conversion",
  "Side extension",
  "Outbuilding / garden room",
  "New build",
  "Change of use",
  "Other",
] as const

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

function AssessmentPreviewBlock({
  assessment,
  paymentLoading,
  onUnlock,
}: {
  assessment: string
  paymentLoading: boolean
  onUnlock: () => void
}) {
  const { first, rest } = splitFirstParagraph(assessment)
  return (
    <div>
      <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
        {first}
      </p>
      {rest ? (
        <div className="relative mt-4">
          <div
            className="pointer-events-none max-h-48 select-none overflow-hidden blur-sm"
            aria-hidden
          >
            <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
              {rest}
            </p>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-12">
            <button
              type="button"
              onClick={onUnlock}
              disabled={paymentLoading}
              className={cn(
                primaryCtaClassName,
                "pointer-events-auto shadow-lg",
              )}
            >
              {paymentLoading
                ? "Redirecting…"
                : "Unlock full report — £29"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onUnlock}
            disabled={paymentLoading}
            className={cn(primaryCtaClassName, "shadow-lg")}
          >
            {paymentLoading
              ? "Redirecting…"
              : "Unlock full report — £29"}
          </button>
        </div>
      )}
    </div>
  )
}

function CheckPageContent() {
  const searchParams = useSearchParams()
  const postcodeFromQuery =
    searchParams.get("postcode") ?? searchParams.get("address") ?? ""

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
  const [projectType, setProjectType] = useState("")
  const [description, setDescription] = useState("")
  const [concerns, setConcerns] = useState<string[]>([])
  const [formStep, setFormStep] = useState(1)
  const [isStepFading, setIsStepFading] = useState(false)
  const [pendingStep, setPendingStep] = useState<number | null>(null)
  const [assessment, setAssessment] = useState("")
  const [assessmentLoading, setAssessmentLoading] = useState(false)

  useEffect(() => {
    setPostcode(postcodeFromQuery)
  }, [postcodeFromQuery])

  useEffect(() => {
    if (pendingStep === null) return
    const timeoutId = setTimeout(() => {
      setFormStep(pendingStep)
      setIsStepFading(false)
      setPendingStep(null)
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [pendingStep])

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
    setProjectType("")
    setDescription("")
    setConcerns([])
    setFormStep(1)
    setAssessment("")

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
                constraints: data.constraints,
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

  async function handleGenerateAssessment() {
    if (!projectType || !description.trim()) return
    setAssessmentLoading(true)
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: result?.reportId,
          projectType,
          description: description.trim(),
          concerns,
        }),
      })
      const data = (await res.json()) as { assessment?: string }
      if (typeof data.assessment === "string") {
        setAssessment(data.assessment)
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

  function goToStep(step: number) {
    if (step === formStep) return
    setIsStepFading(true)
    setPendingStep(step)
  }

  function toggleConcern(concern: string) {
    setConcerns((prev) =>
      prev.includes(concern)
        ? prev.filter((item) => item !== concern)
        : [...prev, concern],
    )
  }

  const trustItems = [
    { label: "8 constraint categories checked", Icon: Shield },
    { label: "Live government data", Icon: Database },
    { label: "Results in under 60 seconds", Icon: Clock },
    { label: "Free basic check", Icon: Check },
  ] as const

  const showStateAIdle = !isLoading && !result

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background font-sans">
        <section className="bg-brand-dark dot-bg dot-bg-on-dark py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
              <div>
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/80">
                  ● Live planning data
                </span>
                <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
                  Check planning constraints for your postcode
                </h1>
                <p className="max-w-2xl text-lg font-normal text-white/70">
                  Enter your UK postcode for an area-level constraint check from
                  8 live government sources. Free to check — full PDF report
                  from £29.
                </p>
              </div>
              <div className="hidden text-center md:block">
                <img
                  src="/illustrations/house_searching.svg"
                  alt=""
                  className="h-auto w-full max-w-xs opacity-90"
                />
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 border-b border-border bg-background px-6 py-8 md:flex-row md:px-8"
        >
          <div className="relative w-full md:w-80">
            <label
              htmlFor="check-postcode"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Postcode
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
              autoComplete="off"
              disabled={isLoading}
              className={inputClassName}
              placeholder="Start typing your postcode…"
              inputMode="text"
              spellCheck={false}
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-haspopup="listbox"
            />
            {showSuggestions && suggestions.length > 0 ? (
              <div
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
          <div className="w-full shrink-0 md:w-auto">
            <span className="mb-2 hidden text-sm font-semibold text-transparent md:block">
              &nbsp;
            </span>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                primaryCtaClassName,
                "flex-shrink-0 whitespace-nowrap",
              )}
            >
              {isLoading ? (
                <>
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin"
                    aria-hidden
                  />
                  Checking...
                </>
              ) : (
                "Check now →"
              )}
            </button>
          </div>
        </form>

        {isLoading ? (
          <section className="w-full bg-background py-16">
            <div className="mx-auto max-w-5xl px-6 md:px-8">
              <img
                src="/illustrations/analysis.svg"
                alt=""
                className="mx-auto mb-8 h-auto w-40 opacity-60"
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl bg-secondary p-6"
                  >
                    <div className="mb-6 h-4 w-24 rounded bg-border" />
                    <div className="mb-4 h-10 w-16 rounded bg-border" />
                    <div className="mb-2 h-3 w-full rounded bg-border" />
                    <div className="h-3 w-3/4 rounded bg-border" />
                  </div>
                ))}
              </div>
              <div className="py-4 text-center">
                <p className="text-sm text-muted-brand">
                  Checking live planning data — this takes a few seconds
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {showStateAIdle ? (
          <section className="border-b border-border bg-secondary py-4">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-6 px-6 md:px-8">
              {trustItems.map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span className="text-sm font-medium text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!result && !isLoading && (
          <div className="bg-background py-16">
            <div className="max-w-5xl mx-auto px-6 md:px-8">
              <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3 text-center">
                What you get
              </p>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight text-center mb-12">
                Everything you need before hiring an architect
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-secondary border border-border rounded-2xl p-6 flex flex-col items-start gap-4">
                  <img
                    src="/illustrations/checklist.svg"
                    alt=""
                    className="h-32 w-auto object-contain"
                  />
                  <h3 className="text-lg font-bold text-foreground">
                    8 constraint checks
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Conservation areas, listed buildings, Article 4 directions,
                    flood zones, green belt, AONB, TPOs, and permitted
                    development rights — all checked instantly from live
                    government data.
                  </p>
                </div>
                <div className="bg-secondary border border-border rounded-2xl p-6 flex flex-col items-start gap-4">
                  <img
                    src="/illustrations/analysis.svg"
                    alt=""
                    className="h-32 w-auto object-contain"
                  />
                  <h3 className="text-lg font-bold text-foreground">
                    Approval likelihood score
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get an AI-calculated approval likelihood score based on your
                    site constraints and local planning precedent. Know your
                    chances before you spend a penny on professional fees.
                  </p>
                </div>
                <div className="bg-secondary border border-border rounded-2xl p-6 flex flex-col items-start gap-4">
                  <img
                    src="/illustrations/report.svg"
                    alt=""
                    className="h-32 w-auto object-contain"
                  />
                  <h3 className="text-lg font-bold text-foreground">
                    Full PDF report — £29
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Download a complete planning report with constraint analysis,
                    next steps, and local policy references. Share directly
                    with your architect or planning consultant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {!isLoading && result ? (
          <>
            <section className="border-b border-border bg-secondary py-4">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 md:px-8">
                <p className="text-sm text-muted-foreground">
                  Results for:{" "}
                  <span className="font-semibold text-foreground">
                    {normalizePostcodeInput(postcode) || "—"}
                  </span>
                </p>
                <p className="text-sm text-muted-brand">{result.lpa.lpaName}</p>
              </div>
            </section>

            <section className="bg-background py-10">
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 md:grid-cols-4">
                  <div className="md:col-span-1">
                    <div className="sticky top-6 rounded-2xl border border-border bg-background p-6">
                      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-accent">
                        Approval Score
                      </p>
                      <ScoreGauge score={result.score ?? 0} blurred={!emailUnlocked} />
                      <div className="mt-4 text-center">
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
                            <Lock className="w-4 h-4 text-muted-brand" />
                            Unlock to reveal your score
                          </p>
                        )}
                      </div>
                      <div className="mt-6 border-t border-border pt-6">
                        <p className="text-xs leading-relaxed text-muted-brand">
                          Score based on live constraint data. For professional
                          advice, consult an RTPI-accredited planning
                          consultant.
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                          <ShieldCheck
                            className="h-4 w-4 flex-shrink-0 text-accent"
                            aria-hidden
                          />
                          <span className="text-xs text-muted-brand">
                            RTPI-accredited data sources
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
                      Planning Constraints
                    </p>
                    <h2 className="mb-1 text-xl font-bold text-foreground">
                      {result.constraints.length} of 8 categories checked
                    </h2>
                    <p className="mb-6 text-sm text-muted-brand">
                      Live data from planning.data.gov.uk
                    </p>
                    <ConstraintTable constraints={result.constraints} showAll={true} />

                    {!emailUnlocked ? (
                      <div className="mt-6 grid grid-cols-1 items-center gap-8 rounded-2xl border border-border bg-secondary p-8 md:grid-cols-2">
                        <div>
                          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
                            Free full report
                          </p>
                          <h3 className="mb-3 text-2xl font-bold text-foreground">
                            Unlock all 8 constraints and your approval score
                          </h3>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            Enter your email to see your complete results, full
                            approval likelihood score, and personalised next steps —
                            completely free.
                          </p>
                          <img
                            src="/illustrations/report.svg"
                            alt=""
                            className="mt-6 hidden h-auto w-40 opacity-80 md:block"
                          />
                        </div>
                        <div>
                          <form onSubmit={handleLeadSubmit}>
                            <input
                              type="email"
                              value={leadEmail}
                              onChange={(e) => setLeadEmail(e.target.value)}
                              placeholder="your@email.com"
                              required
                              className={cn(inputClassName, "mb-3 w-full")}
                              autoComplete="email"
                            />
                            <button
                              type="submit"
                              disabled={leadSubmitting}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-accent px-8 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {leadSubmitting ? "Saving..." : "Unlock free report →"}
                            </button>
                            <p className="mt-3 text-center text-xs text-muted-brand">
                              No spam. Unsubscribe any time.
                            </p>
                          </form>
                        </div>
                      </div>
                    ) : null}

                    {emailUnlocked && !assessment ? (
                      <div className="mt-6 rounded-2xl border border-border bg-background p-6">
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
                          Get your AI report
                        </p>
                        <h3 className="mb-6 text-xl font-bold text-foreground md:text-2xl">
                          Tell us what you want to build
                        </h3>
                        <div
                          className={cn(
                            "rounded-2xl border border-border bg-secondary p-6 transition-opacity duration-200",
                            isStepFading ? "opacity-0" : "opacity-100",
                          )}
                        >
                          <p className="mb-4 text-sm font-semibold text-muted-foreground">
                            Step {formStep} of 3
                          </p>

                          {formStep === 1 ? (
                            <div className="space-y-4">
                              <div>
                                <label
                                  htmlFor="check-project-type"
                                  className="mb-2 block text-sm font-semibold text-foreground"
                                >
                                  What do you want to build?
                                </label>
                                <div className="relative">
                                  <select
                                    id="check-project-type"
                                    value={projectType}
                                    onChange={(e) =>
                                      setProjectType(e.target.value)
                                    }
                                    className={cn(
                                      inputClassName,
                                      "w-full cursor-pointer appearance-none pr-10",
                                    )}
                                  >
                                    <option value="">
                                      Select a project type…
                                    </option>
                                    {PROJECT_TYPE_OPTIONS.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown
                                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand"
                                    aria-hidden
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => goToStep(2)}
                                  disabled={!projectType}
                                  className={cn(primaryCtaClassName)}
                                >
                                  Next →
                                </button>
                              </div>
                            </div>
                          ) : null}

                          {formStep === 2 ? (
                            <div className="space-y-4">
                              <div>
                                <label
                                  htmlFor="check-description"
                                  className="mb-2 block text-sm font-semibold text-foreground"
                                >
                                  Describe your project briefly
                                </label>
                                <textarea
                                  id="check-description"
                                  value={description}
                                  onChange={(e) => setDescription(e.target.value)}
                                  placeholder="e.g. Single storey rear extension, approximately 4m projection, flat roof, brick to match existing..."
                                  rows={4}
                                  className={cn(
                                    inputClassName,
                                    "min-h-[6.5rem] resize-y",
                                  )}
                                />
                              </div>
                              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                                <button
                                  type="button"
                                  onClick={() => goToStep(1)}
                                  className="rounded-lg border border-ring px-6 py-3 font-medium text-muted-foreground transition-colors hover:bg-muted"
                                >
                                  Back
                                </button>
                                <button
                                  type="button"
                                  onClick={() => goToStep(3)}
                                  disabled={description.trim().length < 20}
                                  className={cn(primaryCtaClassName)}
                                >
                                  Next →
                                </button>
                              </div>
                            </div>
                          ) : null}

                          {formStep === 3 ? (
                            <div className="space-y-4">
                              <div>
                                <p className="mb-3 block text-sm font-semibold text-foreground">
                                  Any specific concerns?
                                </p>
                                <div className="space-y-2">
                                  {[
                                    "Neighbour objections",
                                    "Trees in or near garden",
                                    "Limited budget",
                                    "Need to complete quickly",
                                    "Unsure about permitted development",
                                  ].map((concern) => (
                                    <label
                                      key={concern}
                                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={concerns.includes(concern)}
                                        onChange={() => toggleConcern(concern)}
                                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                                      />
                                      <span>{concern}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              {assessmentLoading ? (
                                <SparkleLoader message="Analysing your site and generating personalised planning assessment..." />
                              ) : (
                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                                  <button
                                    type="button"
                                    onClick={() => goToStep(2)}
                                    className="rounded-lg border border-ring px-6 py-3 font-medium text-muted-foreground transition-colors hover:bg-muted"
                                  >
                                    Back
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleGenerateAssessment}
                                    className={cn(primaryCtaClassName)}
                                  >
                                    Generate my report — £29
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {emailUnlocked && assessment ? (
                      <div className="mt-6 rounded-2xl border border-border bg-background p-6">
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
                          Your AI preview
                        </p>
                        <h3 className="mb-4 text-xl font-bold text-foreground md:text-2xl">
                          Planning assessment
                        </h3>
                        <AssessmentPreviewBlock
                          assessment={assessment}
                          paymentLoading={paymentLoading}
                          onUnlock={() =>
                            handlePayment(STRIPE_PRODUCTS.oneOff.fullReport)
                          }
                        />
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
      <Nav />
      <main className="min-h-screen bg-background font-sans">
        <section className="bg-brand-dark dot-bg dot-bg-on-dark py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/80">
              ● Live planning data
            </span>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              Check planning constraints for your postcode
            </h1>
            <p className="max-w-2xl text-lg font-normal text-white/70">
              Enter your UK postcode for an area-level constraint check from 8
              live government sources. Free to check — full PDF report from £29.
            </p>
          </div>
        </section>
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 border-b border-border bg-background px-6 py-8 md:flex-row md:px-8">
          <div className="w-full md:w-80">
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-border" />
            <div className="h-[46px] w-full animate-pulse rounded-lg bg-secondary" />
          </div>
          <div className="w-full shrink-0 md:w-auto">
            <div className="mb-2 hidden h-4 md:block" />
            <div className="h-12 w-full animate-pulse rounded-lg bg-secondary md:min-w-[140px]" />
          </div>
        </div>
        <section className="w-full bg-background py-16">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <img
              src="/illustrations/analysis.svg"
              alt=""
              className="mx-auto mb-8 h-auto w-40 opacity-60"
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl bg-secondary p-6"
                >
                  <div className="mb-6 h-4 w-24 rounded bg-border" />
                  <div className="mb-4 h-10 w-16 rounded bg-border" />
                  <div className="mb-2 h-3 w-full rounded bg-border" />
                  <div className="h-3 w-3/4 rounded bg-border" />
                </div>
              ))}
            </div>
            <p className="py-4 text-center text-sm text-muted-brand">
              Loading…
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

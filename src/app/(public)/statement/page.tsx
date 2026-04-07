"use client"

import {
  StructuredProjectForm,
  type ProjectAnswers,
} from "@/components/planning/StructuredProjectForm"

function projectAnswersToRecord(answers: ProjectAnswers): Record<string, string> {
  const base: Record<string, string> = {
    projectType: answers.projectType,
    projectDescription: answers.size,
    additionalNotes: answers.materials,
    roofType: answers.roofType,
    floor: answers.floor,
    propertyType: answers.propertyType,
    hasHistory: answers.hasHistory,
    neighboursAffected: answers.neighboursAffected,
  }
  for (const [k, v] of Object.entries(answers.followUpAnswers)) {
    base[k] = v
  }
  return base
}
import { SparkleLoader } from "@/components/ui/SparkleLoader"
import { Footer } from "@/components/layout/Footer"
import { createClient } from "@/lib/supabase/client"
import { STRIPE_PRODUCTS } from "@/lib/stripe/products"
import type { ConstraintCheckResponse } from "@/types/planning"
import { cn } from "@/utils/cn"
import { Check, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"

const primaryCtaClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-accent px-8 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"

function normalizePostcodeInput(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, " ").trim()
}

function StatementPageContent() {
  const searchParams = useSearchParams()
  const postcodeFromQuery =
    searchParams.get("postcode") ?? searchParams.get("address") ?? ""

  const [postcode, setPostcode] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ConstraintCheckResponse | null>(null)

  const [projectAnswers, setProjectAnswers] = useState<ProjectAnswers | null>(
    null,
  )
  const [formComplete, setFormComplete] = useState(false)
  const [teaserText, setTeaserText] = useState("")
  const [teaserLoading, setTeaserLoading] = useState(false)
  const [statementId, setStatementId] = useState("")

  const [leadEmail, setLeadEmail] = useState("")
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [bundleReportId, setBundleReportId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const router = useRouter()

  const [loginHref, setLoginHref] = useState(
    () => `/login?next=${encodeURIComponent("/statement")}`,
  )

  const projectDetailsSectionRef = useRef<HTMLElement>(null)
  const hasScrolledToProjectDetailsRef = useRef(false)

  useEffect(() => {
    setPostcode(postcodeFromQuery)
  }, [postcodeFromQuery])

  useEffect(() => {
    setLoginHref(`/login?next=${encodeURIComponent(window.location.href)}`)
  }, [])

  const checkForBundle = useCallback(async (): Promise<string | null> => {
    if (!user) return null
    const supabase = createClient()
    const { data } = await supabase
      .from("reports")
      .select("id")
      .eq("user_id", user.id)
      .eq("has_bundle", true)
      .eq("bundle_statement_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    return data?.id ?? null
  }, [user])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  useEffect(() => {
    checkForBundle().then(setBundleReportId)
  }, [checkForBundle])

  useEffect(() => {
    if (!result) {
      hasScrolledToProjectDetailsRef.current = false
      return
    }
    if (isLoading || formComplete) return
    if (hasScrolledToProjectDetailsRef.current) return
    hasScrolledToProjectDetailsRef.current = true
    const frame = requestAnimationFrame(() => {
      projectDetailsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [result, isLoading, formComplete])

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

  async function handlePostcodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const postcodeNorm = normalizePostcodeInput(postcode)
    if (postcodeNorm.length < 5) {
      setError("Enter a valid UK postcode.")
      return
    }

    setIsLoading(true)
    setError(null)
    setCheckoutError(null)
    setResult(null)
    setFormComplete(false)
    setProjectAnswers(null)
    setTeaserText("")
    setTeaserLoading(false)
    setStatementId("")

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
        setError("We couldn’t load planning data for that postcode. Try again.")
        return
      }

      setPostcode(postcodeNorm)
      setResult(data as ConstraintCheckResponse)
    } catch {
      setError("We couldn’t load planning data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePayment() {
    if (!projectAnswers || !statementId) {
      setCheckoutError("Complete the form above before paying.")
      return
    }
    setPaymentLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: STRIPE_PRODUCTS.oneOff.statement,
          reportId: result?.reportId,
          statementId,
          email: leadEmail.trim() || undefined,
          successPath: "/statement",
        }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
      else
        setCheckoutError(
          data.error ?? "Checkout could not be started. Try again.",
        )
    } finally {
      setPaymentLoading(false)
    }
  }

  async function handleBundleGenerate(reportId: string) {
    if (!projectAnswers) {
      setCheckoutError("Complete the form above before generating.")
      return
    }

    const supabase = createClient()
    const { error: bundleUpdateError } = await supabase
      .from("reports")
      .update({ bundle_statement_used: true })
      .eq("id", reportId)

    if (bundleUpdateError) {
      console.error(bundleUpdateError)
      setCheckoutError("Could not apply bundle credit. Try again.")
      return
    }

    setGenerating(true)
    setCheckoutError(null)

    try {
      const res = await fetch("/api/statement-teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType: projectAnswers.projectType ?? "Not specified",
          answers: projectAnswersToRecord(projectAnswers),
          lpaName: result?.lpa?.lpaName ?? "",
          constraints: result?.constraints ?? [],
        }),
      })
      const data = (await res.json()) as {
        statementId?: string
        error?: string
      }
      if (data.statementId) {
        router.push(
          `/statement/${data.statementId}?session_id=bundle`,
        )
      } else {
        setCheckoutError(data.error ?? "Could not prepare your statement.")
      }
    } catch {
      setCheckoutError("Could not prepare your statement. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const lpaName = result?.lpa.lpaName ?? "your local planning authority"
  const displayPostcode = normalizePostcodeInput(postcode) || "—"

  const showIdleMarketing = !isLoading && !result

  return (
    <>
      <main className="min-h-screen bg-background font-sans">
        <section className="bg-brand-dark dot-bg dot-bg-on-dark py-20 md:py-24">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <span className="mb-8 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
                  Professional document service
                </span>
                <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
                  Generate your planning statement
                </h1>
                <p className="max-w-xl text-lg font-normal leading-relaxed text-white/75 md:text-xl">
                  A professionally structured planning statement tailored to your
                  site and LPA&apos;s local plan policies
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

        {!result ? (
          user ? (
            <form
              onSubmit={handlePostcodeSubmit}
              className="border-b border-border bg-secondary"
            >
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 md:flex-row md:items-end md:gap-10 md:px-8 md:py-14">
                <div className="min-w-0 flex-1">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent">
                    Site location
                  </p>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    We require the site postcode to identify the local planning
                    authority and align your statement with the correct local plan
                    framework.
                  </p>
                  <div className="relative">
                    <label
                      htmlFor="statement-postcode"
                      className="mb-2 block text-sm font-semibold text-foreground"
                    >
                      Site postcode
                    </label>
                    <input
                      id="statement-postcode"
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
                      placeholder="Enter postcode"
                      inputMode="text"
                      spellCheck={false}
                      role="combobox"
                      aria-expanded={showSuggestions && suggestions.length > 0}
                      aria-controls="statement-postcode-suggestions"
                      aria-autocomplete="list"
                      aria-haspopup="listbox"
                    />
                    {showSuggestions && suggestions.length > 0 ? (
                      <div
                        id="statement-postcode-suggestions"
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
                    disabled={isLoading}
                    className={cn(
                      primaryCtaClassName,
                      "min-w-[200px] flex-shrink-0 whitespace-nowrap px-10",
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
          ) : (
            <div className="border-b border-border bg-secondary">
              <div className="mx-auto max-w-md px-6 py-16 text-center">
                <Image
                  src="/illustrations/agreement.svg"
                  alt=""
                  width={128}
                  height={112}
                  className="mx-auto mb-6 h-auto w-32 opacity-80"
                />
                <h2 className="mb-3 text-2xl font-bold text-foreground">
                  Sign in to generate your statement
                </h2>
                <p className="mb-8 text-muted-foreground">
                  Create a free account to generate and save your planning
                  statement. Your statement will be saved to your account for easy
                  access.
                </p>
                <div className="flex justify-center gap-3">
                  <Link
                    href={loginHref}
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                  >
                    Sign in
                  </Link>
                  <Link
                    href={loginHref}
                    className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="border-b border-border bg-secondary py-4">
            <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 md:px-8">
              <p className="text-sm text-muted-foreground">
                Checking constraints for:
              </p>
              <span className="font-semibold text-foreground">{postcode}</span>
              <span className="text-muted-brand">·</span>
              <span className="text-sm text-muted-foreground">
                {result.lpa?.lpaName}
              </span>
              <button
                type="button"
                onClick={() => {
                  setResult(null)
                  setFormComplete(false)
                  setTeaserText("")
                  setStatementId("")
                  setPostcode("")
                }}
                className="ml-auto text-xs text-accent hover:underline"
              >
                Start over
              </button>
            </div>
          </div>
        )}

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
                <SparkleLoader message="Retrieving planning records" />
              </div>
              <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
                Confirming local planning authority and plan framework for your
                site — please wait a moment
              </p>
            </div>
          </section>
        ) : null}

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

        {showIdleMarketing ? (
          <section className="border-b border-border bg-background py-8 md:py-10">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-6 md:px-8">
              {[
                "Formal document structure",
                "Grounded in your adopted local plan",
                "Suitable for submission or pre-application use",
              ].map((label) => (
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

        {showIdleMarketing ? (
          <div className="bg-background py-20 md:py-28">
            <div className="mx-auto max-w-5xl px-6 md:px-8">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-accent">
                The service
              </p>
              <h2 className="mx-auto mb-6 max-w-2xl text-center text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                A drafted statement, not a casual summary
              </h2>
              <p className="mx-auto mb-16 max-w-2xl text-center text-base leading-relaxed text-muted-foreground">
                Suitable for homeowners and small developers who need clear,
                policy-literate wording without commissioning a full consultant
                report at this stage.
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
                    Conventional structure
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Your draft follows the sections officers expect — site and
                    history, proposal, policy, assessment, and conclusion — so it
                    reads as a serious planning submission document.
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
                    LPA-specific framing
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    The narrative is anchored to your postcode and planning
                    authority, so references to policy context match where your
                    application will be determined.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-secondary p-8">
                  <Image
                    src="/illustrations/agreement.svg"
                    alt=""
                    width={200}
                    height={160}
                    className="h-28 w-auto object-contain opacity-90"
                  />
                  <h3 className="text-lg font-bold text-foreground">
                    £79 one-off
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    A single payment for your generated draft. No subscription
                    required to complete this instruction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && result && !formComplete ? (
          <>
            <section className="border-b border-border bg-secondary py-6 md:py-7">
              <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 md:flex-row md:items-baseline md:justify-between md:px-8">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Site postcode:
                  </span>{" "}
                  {displayPostcode}
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
              ref={projectDetailsSectionRef}
              id="statement-project-details"
              tabIndex={-1}
              className="scroll-mt-[58px] bg-background py-14 md:py-20 focus:outline-none"
            >
              <div className="mx-auto max-w-3xl px-6 md:px-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
                  Instruction for draft
                </p>
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Particulars for your statement
                </h2>
                <p className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  Please complete each part in order. The information you provide
                  forms the factual basis of your planning statement and allows
                  the draft to reference the correct development type, site
                  characteristics, and policy context.
                </p>
                <StructuredProjectForm
                  purpose="statement"
                  constraints={result?.constraints}
                  lpaName={result?.lpa?.lpaName}
                  isLoading={false}
                  onComplete={async (answers) => {
                    setFormComplete(true)
                    setTeaserLoading(true)
                    setCheckoutError(null)
                    setProjectAnswers(answers)
                    try {
                      const res = await fetch("/api/statement-teaser", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          projectType: answers.projectType,
                          answers: projectAnswersToRecord(answers),
                          lpaName: result.lpa.lpaName,
                          constraints: result.constraints,
                        }),
                      })
                      const data = (await res.json()) as {
                        teaserText?: string
                        statementId?: string
                        error?: string
                      }
                      if (!res.ok) {
                        setCheckoutError(
                          data.error ?? "Could not prepare your preview.",
                        )
                        return
                      }
                      if (data.teaserText) setTeaserText(data.teaserText)
                      if (data.statementId) setStatementId(data.statementId)
                    } catch {
                      setCheckoutError(
                        "Could not prepare your preview. Please try again.",
                      )
                    } finally {
                      setTeaserLoading(false)
                    }
                  }}
                />
              </div>
            </section>
          </>
        ) : null}

        {!isLoading && result && formComplete && teaserLoading ? (
          <section className="border-t border-border bg-secondary py-14 md:py-20">
            <div className="mx-auto max-w-3xl px-6 md:px-8">
              <div className="flex justify-center">
                <SparkleLoader message="Preparing your personalised statement..." />
              </div>
            </div>
          </section>
        ) : null}

        {!isLoading && result && formComplete && !teaserLoading && !teaserText && checkoutError ? (
          <div
            className="border-b border-[#F5C6C6] bg-[#FDECEA] py-3"
            role="alert"
          >
            <div className="mx-auto max-w-5xl px-6 text-sm font-medium text-[#991818] md:px-8">
              {checkoutError}
            </div>
          </div>
        ) : null}

        {!isLoading && result && formComplete && generating ? (
          <section className="border-t border-border bg-secondary py-14 md:py-20">
            <div className="mx-auto max-w-3xl px-6 md:px-8">
              <div className="flex justify-center">
                <SparkleLoader message="Preparing your planning statement..." />
              </div>
            </div>
          </section>
        ) : null}

        {!isLoading && result && formComplete && teaserText && !generating ? (
          <section className="border-t border-border bg-secondary py-14 md:py-20">
            <div className="mx-auto max-w-3xl px-6 md:px-8">
              <div className="rounded-2xl bg-brand-dark p-8 dot-bg dot-bg-on-dark text-white shadow-xl ring-1 ring-white/10">
                <p className="mb-3 text-xs uppercase tracking-widest text-white/50">
                  Your planning statement
                </p>
                <p className="mb-6 text-base leading-relaxed text-white">
                  {teaserText}
                </p>
                <div className="border-t border-white/20 pt-6">
                  <p className="mb-4 text-sm text-white/70">
                    Your full statement will include:
                  </p>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li>• Site description and planning history</li>
                    <li>• Description of proposed development</li>
                    <li>
                      • Planning policy context ({lpaName} Local Plan)
                    </li>
                    <li>• Assessment against relevant policies</li>
                    <li>• Conclusion and planning balance</li>
                  </ul>
                </div>
                <div className="mt-6 border-t border-white/20 pt-6">
                  <p className="mb-4 text-xs text-white/50">
                    Professionally structured document — instant download as Word
                    file
                  </p>
                  {!user && (
                    <>
                      <label
                        htmlFor="statement-checkout-email"
                        className="mb-2 block text-sm font-semibold text-white/90"
                      >
                        Correspondence email (optional)
                      </label>
                      <p className="mb-3 text-xs text-white/55">
                        For Stripe receipt and confirmation only.
                      </p>
                      <input
                        id="statement-checkout-email"
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        autoComplete="email"
                        placeholder="name@example.com"
                        className={cn(
                          inputClassName,
                          "mb-6 border-0 bg-white text-foreground placeholder:text-muted-brand",
                        )}
                      />
                    </>
                  )}
                  {bundleReportId ? (
                    <div className="mb-4 rounded-xl border border-accent bg-brand-dark p-4 text-white">
                      <p className="mb-1 text-sm font-bold text-white">
                        Bundle credit available
                      </p>
                      <p className="mb-3 text-xs text-white/70">
                        Your recent report purchase includes a planning
                        statement. Generate it now for free.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleBundleGenerate(bundleReportId)}
                        disabled={generating}
                        className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Generate my statement — included in bundle
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePayment()}
                      disabled={paymentLoading}
                      className="w-full rounded-lg bg-white py-3 font-bold text-brand-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {paymentLoading ? (
                        <>
                          <Loader2
                            className="mr-2 inline h-4 w-4 animate-spin"
                            aria-hidden
                          />
                          Redirecting to secure payment…
                        </>
                      ) : (
                        "Generate my statement — £79"
                      )}
                    </button>
                  )}
                  {checkoutError ? (
                    <p
                      className="mt-4 text-center text-sm font-medium text-[#F5B4B4]"
                      role="alert"
                    >
                      {checkoutError}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  )
}

function StatementLoadingFallback() {
  return (
    <>
      <main className="min-h-screen bg-background font-sans">
        <section className="bg-brand-dark dot-bg dot-bg-on-dark py-20 md:py-24">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <span className="mb-8 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
              Professional document service
            </span>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              Generate your planning statement
            </h1>
            <p className="max-w-xl text-lg font-normal leading-relaxed text-white/75 md:text-xl">
              A professionally structured planning statement tailored to your
              site and LPA&apos;s local plan policies
            </p>
          </div>
        </section>
        <div className="border-b border-border bg-secondary">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 md:flex-row md:items-end md:gap-10 md:px-8 md:py-14">
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

export default function StatementPage() {
  return (
    <Suspense fallback={<StatementLoadingFallback />}>
      <StatementPageContent />
    </Suspense>
  )
}

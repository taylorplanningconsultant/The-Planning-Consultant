"use client"

import { SparkleLoader } from "@/components/ui/SparkleLoader"
import type { ConstraintResult } from "@/types/planning"
import { cn } from "@/utils/cn"
import { ChevronDown } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import { useEffect, useId, useRef, useState } from "react"

const PROJECT_TYPE_OPTIONS = [
  "Rear extension",
  "Loft conversion",
  "Side extension",
  "Outbuilding / garden room",
  "New build",
  "Change of use",
  "Other",
] as const

/** Mirrors API `GeneratedQuestion` shape (kept local for client bundle). */
type GeneratedQuestion =
  | {
      id: string
      type: "buttons"
      label: string
      helpText: string
      options: string[]
    }
  | {
      id: string
      type: "text"
      label: string
      helpText: string
      placeholder: string
    }
  | {
      id: string
      type: "number"
      label: string
      helpText: string
      placeholder: string
    }

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"

const primaryCtaClassName =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-accent px-8 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"

const outlineButtonClassName =
  "rounded-lg border border-ring px-6 py-3 font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"

export type ProjectAnswers = {
  projectType: string
  size: string
  materials: string
  roofType: string
  floor: string
  propertyType: string
  hasHistory: string
  neighboursAffected: string
  followUpAnswers: Record<string, string>
}

const emptyProjectAnswers = (): ProjectAnswers => ({
  projectType: "",
  size: "",
  materials: "",
  roofType: "",
  floor: "",
  propertyType: "",
  hasHistory: "",
  neighboursAffected: "",
  followUpAnswers: {},
})

export type StructuredProjectFormProps = {
  onComplete: (answers: ProjectAnswers) => void
  isLoading: boolean
  constraints?: ConstraintResult[]
  lpaName?: string
  purpose: "report" | "statement"
  /** When true, the post–review "Finishing" loader is hidden (e.g. credit confirmation is shown). */
  hideFinishingLoader?: boolean
  /** Fires when internal step loading flags change (for disabling parent UI such as postcode). */
  onInternalLoadingChange?: (state: {
    loadingQuestions: boolean
    reviewLoading: boolean
  }) => void
  /** Optional: lift question/answer cache to parent (check page). If omitted, state stays internal. */
  cachedAnswers?: Record<string, string>
  setCachedAnswers?: Dispatch<SetStateAction<Record<string, string>>>
  lastDescription?: string
  setLastDescription?: Dispatch<SetStateAction<string>>
}

type UiStep = 1 | 2 | 3

function buildReviewAnswersPayload(
  base: Omit<ProjectAnswers, "followUpAnswers">,
  generatedById: Record<string, string>,
): Record<string, string> {
  return {
    projectType: base.projectType,
    projectDescription: base.size,
    additionalNotes: base.materials,
    roofType: base.roofType,
    floor: base.floor,
    propertyType: base.propertyType,
    hasHistory: base.hasHistory,
    neighboursAffected: base.neighboursAffected,
    ...generatedById,
  }
}

function isGeneratedAnswerComplete(
  q: GeneratedQuestion,
  value: string | undefined,
): boolean {
  const v = value?.trim() ?? ""
  if (q.type === "buttons") {
    return v.length > 0 && q.options.includes(v)
  }
  if (q.type === "text") {
    return v.length > 0
  }
  if (q.type === "number") {
    if (v.length === 0) return false
    return !Number.isNaN(Number.parseFloat(v))
  }
  return false
}

function allGeneratedAnswered(
  questions: GeneratedQuestion[],
  byId: Record<string, string>,
): boolean {
  return questions.every((q) => isGeneratedAnswerComplete(q, byId[q.id]))
}

export function StructuredProjectForm({
  onComplete,
  isLoading,
  constraints,
  lpaName,
  purpose,
  hideFinishingLoader = false,
  onInternalLoadingChange,
  cachedAnswers: cachedAnswersProp,
  setCachedAnswers: setCachedAnswersProp,
  lastDescription: lastDescriptionProp,
  setLastDescription: setLastDescriptionProp,
}: StructuredProjectFormProps) {
  const uid = useId()
  const [uiStep, setUiStep] = useState<UiStep>(1)
  const [answers, setAnswers] = useState<ProjectAnswers>(emptyProjectAnswers)
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedQuestion[]
  >([])
  const [generatedAnswers, setGeneratedAnswers] = useState<
    Record<string, string>
  >({})

  const [cachedAnswersInternal, setCachedAnswersInternal] = useState<
    Record<string, string>
  >({})
  const [lastDescriptionInternal, setLastDescriptionInternal] = useState("")
  const cachedAnswers = cachedAnswersProp ?? cachedAnswersInternal
  const setCachedAnswers = setCachedAnswersProp ?? setCachedAnswersInternal
  const lastDescription = lastDescriptionProp ?? lastDescriptionInternal
  const setLastDescription =
    setLastDescriptionProp ?? setLastDescriptionInternal

  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)

  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewQuestions, setReviewQuestions] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [followUpDraft, setFollowUpDraft] = useState("")
  const [followUpAnswers, setFollowUpAnswers] = useState<
    Record<string, string>
  >({})

  /** Avoids a one-frame empty Step 3 after review returns ready. */
  const [exitedAfterComplete, setExitedAfterComplete] = useState(false)

  const [contentVisible, setContentVisible] = useState(true)
  const skipFadeRef = useRef(true)
  const onInternalLoadingChangeRef = useRef(onInternalLoadingChange)
  onInternalLoadingChangeRef.current = onInternalLoadingChange

  const fadeKey = `${uiStep}-${loadingQuestions}-${reviewLoading}-${reviewQuestions.length}-${currentQuestionIndex}`

  useEffect(() => {
    if (skipFadeRef.current) {
      skipFadeRef.current = false
      return
    }
    setContentVisible(false)
    const id = window.setTimeout(() => setContentVisible(true), 45)
    return () => window.clearTimeout(id)
  }, [fadeKey])

  useEffect(() => {
    onInternalLoadingChangeRef.current?.({ loadingQuestions, reviewLoading })
  }, [loadingQuestions, reviewLoading])

  useEffect(() => {
    if (uiStep === 2) {
      setCachedAnswers(generatedAnswers)
    }
  }, [generatedAnswers, uiStep])

  const base = answers
  const disabled = isLoading || reviewLoading || loadingQuestions

  const step1Valid =
    Boolean(base.projectType.trim()) && Boolean(base.size.trim())
  const step2Valid = allGeneratedAnswered(generatedQuestions, generatedAnswers)

  const resolvedConstraints = constraints ?? []
  const resolvedLpa = (lpaName ?? "").trim() || "Unknown"

  function updateBase(
    patch: Partial<Omit<ProjectAnswers, "followUpAnswers">>,
  ) {
    setAnswers((prev) => ({ ...prev, ...patch, followUpAnswers: {} }))
  }

  async function handleStep1Continue() {
    setQuestionsError(null)
    const description = base.size.trim()
    if (
      description === lastDescription.trim() &&
      generatedQuestions.length > 0
    ) {
      setGeneratedAnswers({ ...cachedAnswers })
      setUiStep(2)
      return
    }
    setLoadingQuestions(true)
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType: base.projectType,
          description: base.size,
          constraints: resolvedConstraints,
          lpaName: resolvedLpa,
          purpose,
        }),
      })

      const data: unknown = await res.json().catch(() => null)

      if (!res.ok) {
        const err =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Could not prepare questions"
        setQuestionsError(err)
        return
      }

      let qs: GeneratedQuestion[] = []
      if (
        data &&
        typeof data === "object" &&
        "questions" in data &&
        Array.isArray((data as { questions: unknown }).questions)
      ) {
        const rawQuestions = (data as { questions: unknown[] }).questions
        qs = rawQuestions
          .filter((q) => Boolean(q) && typeof q === "object" && q !== null)
          .map((q) => {
            const question = q as Record<string, unknown>
            return {
              id: String(question.id ?? Math.random()),
              type: (["buttons", "text", "number"].includes(
                String(question.type),
              )
                ? question.type
                : "buttons") as "buttons" | "text" | "number",
              label: String(question.label || question.question || ""),
              helpText: String(question.helpText || ""),
              options: Array.isArray(question.options)
                ? question.options.map((o: unknown) =>
                    typeof o === "string"
                      ? o
                      : typeof o === "object" && o !== null && "label" in o
                        ? String((o as { label: unknown }).label)
                        : String(o),
                  )
                : [],
              placeholder: String(question.placeholder || ""),
            }
          })
          .filter((q) => q.label.length > 0)
      }

      setGeneratedQuestions(qs)
      setLastDescription(base.size.trim())
      setGeneratedAnswers({})
      setUiStep(2)
    } catch {
      setQuestionsError("Something went wrong. Please try again.")
    } finally {
      setLoadingQuestions(false)
    }
  }

  async function handleStep2Continue() {
    setReviewError(null)
    setReviewLoading(true)
    setUiStep(3)

    const payloadAnswers = buildReviewAnswersPayload(base, generatedAnswers)

    try {
      const res = await fetch("/api/review-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType: base.projectType,
          answers: payloadAnswers,
          constraints: resolvedConstraints,
          lpaName: resolvedLpa,
          purpose,
        }),
      })

      const data: unknown = await res.json().catch(() => null)

      if (!res.ok) {
        const err =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Review failed"
        setReviewError(err)
        setUiStep(2)
        return
      }

      if (
        data &&
        typeof data === "object" &&
        "status" in data &&
        (data as { status: string }).status === "ready"
      ) {
        setExitedAfterComplete(true)
        onComplete({
          ...base,
          followUpAnswers: { ...generatedAnswers },
        })
        return
      }

      if (
        data &&
        typeof data === "object" &&
        "status" in data &&
        (data as { status: string }).status === "questions" &&
        "questions" in data &&
        Array.isArray((data as { questions: unknown }).questions)
      ) {
        const qs = (data as { questions: string[] }).questions.filter(
          (q) => typeof q === "string" && q.trim().length > 0,
        )
        if (qs.length === 0) {
          setExitedAfterComplete(true)
          onComplete({
            ...base,
            followUpAnswers: { ...generatedAnswers },
          })
          return
        }
        setReviewQuestions(qs)
        setCurrentQuestionIndex(0)
        setFollowUpAnswers({})
        setFollowUpDraft("")
        return
      }

      setExitedAfterComplete(true)
      onComplete({
        ...base,
        followUpAnswers: { ...generatedAnswers },
      })
    } catch (err) {
      setReviewError("Something went wrong. Please try again.")
      setUiStep(2)
    } finally {
      setReviewLoading(false)
    }
  }

  function handleFollowUpNext() {
    const q = reviewQuestions[currentQuestionIndex]
    if (!q) return
    const value = followUpDraft.trim()
    if (!value) return

    const nextMap = { ...followUpAnswers, [q]: value }
    setFollowUpAnswers(nextMap)

    if (currentQuestionIndex >= reviewQuestions.length - 1) {
      setExitedAfterComplete(true)
      onComplete({
        ...base,
        followUpAnswers: { ...generatedAnswers, ...nextMap },
      })
      return
    }

    setCurrentQuestionIndex((i) => i + 1)
    setFollowUpDraft("")
  }

  function handleFollowUpBack() {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1
      const prevQ = reviewQuestions[newIndex]
      setCurrentQuestionIndex(newIndex)
      setFollowUpDraft(prevQ ? (followUpAnswers[prevQ] ?? "") : "")
      return
    }
    setReviewQuestions([])
    setFollowUpDraft("")
    setFollowUpAnswers({})
    setUiStep(2)
  }

  const progressStep: 1 | 2 | 3 =
    uiStep === 1 && !loadingQuestions
      ? 1
      : loadingQuestions || uiStep === 2
        ? 2
        : 3

  const totalSteps = purpose === "statement" ? 4 : 3
  const stepLabel =
    reviewQuestions.length > 0 && uiStep === 3 && !reviewLoading
      ? `Step ${totalSteps} of ${totalSteps}`
      : `Step ${progressStep} of ${totalSteps}`

  const showFollowUp =
    uiStep === 3 && !reviewLoading && reviewQuestions.length > 0

  if (exitedAfterComplete) {
    if (hideFinishingLoader) {
      return null
    }
    return (
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm md:p-8">
        <div className="py-4">
          <SparkleLoader steps={["Finishing…"]} />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm md:p-8">
      <div className="mb-6 border-b border-border pb-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
          {stepLabel}
        </p>
        <div className="flex gap-2" aria-hidden>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                n <= progressStep ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      {questionsError && uiStep === 1 ? (
        <p
          className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {questionsError}
        </p>
      ) : null}

      {reviewError && uiStep === 2 ? (
        <p
          className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {reviewError}
        </p>
      ) : null}

      <div
        className={cn(
          "transition-opacity duration-300 ease-out",
          contentVisible ? "opacity-100" : "opacity-0",
        )}
      >
        {loadingQuestions ? (
          <div className="py-6">
            <SparkleLoader
              message="Preparing your questions..."
              steps={["Preparing your questions..."]}
            />
          </div>
        ) : null}

        {!loadingQuestions && uiStep === 1 ? (
          <div className="space-y-8">
            <div>
              <label
                htmlFor={`${uid}-project-type`}
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                What do you want to build?
              </label>
              <div className="relative">
                <select
                  id={`${uid}-project-type`}
                  value={base.projectType}
                  disabled={disabled}
                  onChange={(e) => updateBase({ projectType: e.target.value })}
                  className={cn(
                    inputClassName,
                    "w-full cursor-pointer appearance-none py-3.5 pr-10",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <option value="">Select an option…</option>
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

            <div>
              <label
                htmlFor={`${uid}-description`}
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                What are you trying to achieve?
              </label>
              <p className="mb-2 text-sm text-muted-foreground">
                Don&apos;t worry about technical language — just tell us what
                you want to build in plain English.
              </p>
              <textarea
                id={`${uid}-description`}
                rows={3}
                value={base.size}
                disabled={disabled}
                onChange={(e) => updateBase({ size: e.target.value })}
                placeholder="e.g. I want to extend my kitchen at the back of the house to create more living space, roughly the width of the house and about 4 metres deep"
                className={cn(
                  inputClassName,
                  "min-h-[5.5rem] resize-y",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              />
              <div className="mt-2 space-y-1 text-xs text-muted-brand">
                <p>e.g. I want to convert my loft into a bedroom</p>
                <p>e.g. I want to build a home office in the garden</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={!step1Valid || disabled}
                onClick={handleStep1Continue}
                className={cn(primaryCtaClassName, "px-10")}
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {!loadingQuestions && uiStep === 2 ? (
          <div className="space-y-8">
            {generatedQuestions.map((q) => (
              <div key={q.id}>
                <p className="mb-1 text-xs font-semibold text-muted-brand">
                  {q.label}
                </p>
                <p className="mb-3 text-xs text-muted-brand">{q.helpText}</p>

                {q.type === "buttons" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const selected = generatedAnswers[q.id] === opt
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            setGeneratedAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt,
                            }))
                          }
                          className={cn(
                            "rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors",
                            selected
                              ? "bg-primary text-white"
                              : "border border-border bg-background text-foreground hover:bg-muted",
                            disabled && "cursor-not-allowed opacity-60",
                          )}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {q.type === "text" ? (
                  <input
                    id={`${uid}-q-${q.id}`}
                    type="text"
                    value={generatedAnswers[q.id] ?? ""}
                    disabled={disabled}
                    onChange={(e) =>
                      setGeneratedAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    placeholder={q.placeholder}
                    className={cn(inputClassName, disabled && "opacity-60")}
                  />
                ) : null}

                {q.type === "number" ? (
                  <input
                    id={`${uid}-q-${q.id}`}
                    type="number"
                    inputMode="decimal"
                    value={generatedAnswers[q.id] ?? ""}
                    disabled={disabled}
                    onChange={(e) =>
                      setGeneratedAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    placeholder={q.placeholder}
                    className={cn(inputClassName, disabled && "opacity-60")}
                  />
                ) : null}
              </div>
            ))}

            <div>
              <label
                htmlFor={`${uid}-extra`}
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Anything else to add?
              </label>
              <textarea
                id={`${uid}-extra`}
                rows={3}
                value={base.materials}
                disabled={disabled}
                onChange={(e) => updateBase({ materials: e.target.value })}
                placeholder="Any other details that might be relevant..."
                className={cn(
                  inputClassName,
                  "min-h-[5.5rem] resize-y",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setGeneratedQuestions([])
                  setGeneratedAnswers({})
                  setUiStep(1)
                }}
                className={outlineButtonClassName}
              >
                Back
              </button>
              <button
                type="button"
                disabled={!step2Valid || disabled}
                onClick={handleStep2Continue}
                className={cn(primaryCtaClassName, "px-10 sm:ml-auto")}
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {uiStep === 3 && reviewLoading ? (
          <div className="py-6">
            <SparkleLoader
              message="Reviewing your project details..."
              steps={["Reviewing your project details..."]}
            />
          </div>
        ) : null}

        {showFollowUp ? (
          <div className="space-y-6">
            <div>
              <label
                htmlFor={`${uid}-followup`}
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                {reviewQuestions[currentQuestionIndex] ?? ""}
              </label>
              <input
                id={`${uid}-followup`}
                type="text"
                value={followUpDraft}
                disabled={disabled}
                onChange={(e) => setFollowUpDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleFollowUpNext()
                  }
                }}
                className={cn(inputClassName, disabled && "opacity-60")}
                placeholder="Type your answer…"
              />
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {reviewQuestions.length}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleFollowUpBack}
                  className={outlineButtonClassName}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={disabled || !followUpDraft.trim()}
                  onClick={handleFollowUpNext}
                  className={cn(primaryCtaClassName, "px-10 sm:ml-auto")}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

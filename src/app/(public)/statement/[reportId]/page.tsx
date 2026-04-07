"use client"

import { Footer } from "@/components/layout/Footer"
import { NavClient } from "@/components/layout/NavClient"
import { SparkleLoader } from "@/components/ui/SparkleLoader"
import { createClient } from "@/lib/supabase/client"
import { stripStatementAiFooter } from "@/lib/planning/statement-text"
import type { User } from "@supabase/supabase-js"
import { FileDown } from "lucide-react"
import Link from "next/link"
import {
  type ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import ReactMarkdown from "react-markdown"
import { useParams, useSearchParams } from "next/navigation"

const markdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mb-6 mt-0 text-2xl font-extrabold tracking-tight text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mb-4 mt-8 border-b border-border pb-2 text-lg font-bold text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-4 mt-8 border-b border-border pb-2 text-lg font-bold text-foreground first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-4 text-base font-normal leading-relaxed text-muted-foreground">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-4 list-inside list-disc space-y-2 text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-4 list-inside list-decimal space-y-2 text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="text-base leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
}

function StatementPageInner() {
  const params = useParams()
  const searchParams = useSearchParams()

  const segment = useMemo(() => {
    const raw = params.reportId
    if (typeof raw === "string") return raw
    if (Array.isArray(raw)) return raw[0] ?? ""
    return ""
  }, [params.reportId])

  const sessionIdRaw = searchParams.get("session_id")
  const sessionId =
    sessionIdRaw && sessionIdRaw.trim().length > 0
      ? sessionIdRaw.trim()
      : null

  const [content, setContent] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [complete, setComplete] = useState(false)
  const [lpaName, setLpaName] = useState("")
  const [projectType, setProjectType] = useState("")
  const [generatedDateLabel, setGeneratedDateLabel] = useState<string | null>(
    null,
  )
  const [statementId, setStatementId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [navUser, setNavUser] = useState<User | null>(null)
  const [hasExistingGeneratedContent, setHasExistingGeneratedContent] =
    useState(false)
  const [allowStream, setAllowStream] = useState(false)

  const streamStarted = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setNavUser(user ?? null)
    })
  }, [])

  useEffect(() => {
    if (!segment) {
      setLoadError("Invalid link.")
      return
    }

    const supabase = createClient()
    supabase
      .from("statements")
      .select(
        "id, lpa_name, proposal_text, generated_content, status, project_type, created_at",
      )
      .eq("id", segment)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setLoadError(
            "We could not load this planning statement. Please try again.",
          )
          return
        }
        if (!data) {
          setLoadError(
            "We could not find a planning statement for this link. Start from the statement flow to create one.",
          )
          return
        }
        setStatementId(data.id)

        const row = data as typeof data & { project_type?: string | null }
        const projectTypeRaw = row.project_type ?? ""
        let cleanProjectType = projectTypeRaw
        try {
          const parsed = JSON.parse(projectTypeRaw) as {
            projectType?: string
          }
          cleanProjectType = parsed.projectType ?? projectTypeRaw
        } catch {
          /* keep cleanProjectType as plain string */
        }
        setProjectType(cleanProjectType)
        setLpaName(data.lpa_name ?? "")

        if (data.created_at) {
          const d = new Date(data.created_at)
          setGeneratedDateLabel(
            Number.isNaN(d.getTime())
              ? null
              : d.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
          )
        } else {
          setGeneratedDateLabel(null)
        }

        const existingContent = Boolean(data.generated_content?.trim())
        setHasExistingGeneratedContent(existingContent)

        const canStream =
          sessionId != null &&
          (data.status === "pending" || data.status === "paid") &&
          !existingContent
        setAllowStream(canStream)

        if (existingContent) {
          setContent(stripStatementAiFooter(data.generated_content!))
          setComplete(data.status === "complete")
        }
      })
  }, [params.reportId, sessionId, segment])

  useEffect(() => {
    if (!allowStream || !statementId || !segment) return
    if (streamStarted.current) return
    if (!sessionId) return
    if (hasExistingGeneratedContent) return
    streamStarted.current = true

    let cancelled = false
    const abortController = new AbortController()

    async function run() {
      setLoadError(null)

      setStreaming(true)
      setContent("")

      try {
        const response = await fetch("/api/generate-statement-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: abortController.signal,
          body: JSON.stringify({
            statementId: segment,
            sessionId,
          }),
        })

        if (!response.ok || !response.body) {
          setLoadError("Generation could not start. Please try again.")
          setStreaming(false)
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (cancelled) break
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") {
                setStreaming(false)
                setComplete(true)
                break
              }
              try {
                const parsed = JSON.parse(data) as { text?: string }
                if (parsed.text) {
                  setContent((prev) => prev + parsed.text)
                }
              } catch {
                /* ignore partial JSON */
              }
            }
          }
        }

        if (buffer.trim()) {
          for (const line of buffer.split("\n")) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") {
                setStreaming(false)
                setComplete(true)
              } else {
                try {
                  const parsed = JSON.parse(data) as { text?: string }
                  if (parsed.text) {
                    setContent((prev) => prev + parsed.text)
                  }
                } catch {
                  /* ignore */
                }
              }
            }
          }
        }

        setContent((prev) => stripStatementAiFooter(prev))
      } catch (e) {
        if (cancelled || (e instanceof DOMException && e.name === "AbortError")) {
          return
        }
        setLoadError("Something went wrong while generating your statement.")
        setStreaming(false)
      }
    }

    void run()

    return () => {
      cancelled = true
      abortController.abort()
      streamStarted.current = false
    }
  }, [
    allowStream,
    hasExistingGeneratedContent,
    segment,
    sessionId,
    statementId,
  ])

  const wordHref = statementId
    ? `/api/generate-statement-docx/${statementId}`
    : null

  return (
    <>
      <NavClient user={navUser} />
      <main className="min-h-screen bg-background font-sans">
        <header className="bg-brand-dark dot-bg dot-bg-on-dark pt-24 pb-10">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 md:flex-row md:items-end md:justify-between md:px-8">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#18A056]">
                Planning Statement
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                {projectType || "—"}
              </h1>
              <p className="mt-2 text-base text-white/85">{lpaName || "—"}</p>
              {generatedDateLabel ? (
                <p className="mt-2 text-sm text-white/60">
                  Generated {generatedDateLabel}
                </p>
              ) : null}
            </div>
            {complete && wordHref ? (
              <a
                href={wordHref}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-brand-dark transition-opacity hover:opacity-90"
              >
                <FileDown className="h-4 w-4" aria-hidden />
                Download
              </a>
            ) : null}
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6 py-10 md:px-8">
          {loadError ? (
            <div
              className="rounded-2xl border border-border bg-secondary p-8 text-center"
              role="alert"
            >
              <p className="text-base leading-relaxed text-muted-foreground">
                {loadError}
              </p>
              <Link
                href="/statement"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
              >
                Planning statement
              </Link>
            </div>
          ) : null}

          {!loadError && streaming ? (
            <>
              <div className="flex justify-center">
                <SparkleLoader
                  message="Generating your planning statement..."
                  steps={[
                    "Reviewing your site constraints...",
                    "Referencing local planning policies...",
                    "Drafting policy assessment...",
                    "Writing conclusion...",
                    "Finalising your statement...",
                  ]}
                />
              </div>
              <div className="mt-6 prose prose-sm max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              </div>
            </>
          ) : null}

          {!loadError && !streaming && complete ? (
            <article>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              </div>

              {wordHref ? (
                <div className="mt-10">
                  <a
                    href={wordHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-4 text-center text-base font-bold text-white shadow-md transition-opacity hover:opacity-90 md:w-auto md:px-10"
                  >
                    <FileDown className="h-5 w-5" aria-hidden />
                    Download as Word
                  </a>
                </div>
              ) : null}

              <section className="mt-12 border-t border-border pt-10">
                <p className="font-semibold text-foreground">Need help submitting?</p>
                <a
                  href="mailto:hello@theplanningconsultant.com"
                  className="mt-2 inline-block font-medium text-primary underline-offset-4 hover:underline"
                >
                  Speak to a planning consultant
                </a>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get in touch and we&apos;ll connect you with an RTPI-accredited
                  consultant in your area.
                </p>
              </section>
            </article>
          ) : null}

          {!loadError && !streaming && !complete && !sessionId && statementId ? (
            <div className="rounded-2xl border border-border bg-secondary p-8 text-center">
              <p className="text-base leading-relaxed text-muted-foreground">
                No generation in progress. Complete payment from the statement
                flow to generate your document, or open the link from your
                confirmation email.
              </p>
              <Link
                href="/statement"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
              >
                Back to planning statement
              </Link>
            </div>
          ) : null}
        </div>

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

function StatementPageFallback() {
  return (
    <>
      <NavClient user={null} />
      <main className="min-h-screen bg-background font-sans">
        <header className="bg-brand-dark dot-bg dot-bg-on-dark pt-24 pb-10">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="h-9 w-64 animate-pulse rounded bg-white/20" />
            <div className="mt-3 h-5 w-48 animate-pulse rounded bg-white/15" />
          </div>
        </header>
        <div className="mx-auto flex max-w-3xl justify-center px-6 py-16 md:px-8">
          <SparkleLoader message="Loading" />
        </div>

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

export default function StatementResultPage() {
  return (
    <Suspense fallback={<StatementPageFallback />}>
      <StatementPageInner />
    </Suspense>
  )
}

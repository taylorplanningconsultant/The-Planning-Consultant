"use client"

import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { FormEvent, useState } from "react"

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"

const primaryCtaClassName =
  "inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    setIsSubmitting(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/auth/callback?next=/dashboard",
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message || "Unable to send reset link. Please try again.")
      return
    }

    setSuccessMessage("Check your email for a password reset link.")
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        <section className="relative hidden bg-brand-dark dot-bg dot-bg-on-dark text-white md:block">
          <Link
            href="/"
            className="absolute left-8 top-8 inline-flex items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="relative mx-auto flex h-full w-full max-w-xl flex-col justify-center px-10 py-16 lg:px-14">
            <h1 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
              Your planning journey starts here
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">
              Instant constraint checks, AI-powered reports, and everything you need before you
              apply.
            </p>
            <Image
              src="/illustrations/report.svg"
              alt="Planning report illustration"
              width={320}
              height={280}
              className="mt-8 h-auto w-full max-w-xs opacity-90"
            />

            <ul className="mt-10 space-y-4">
              <li className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3.5 w-3.5 text-accent" />
                </span>
                <span>Free constraint check for any UK postcode</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3.5 w-3.5 text-accent" />
                </span>
                <span>AI planning report tailored to your project</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3.5 w-3.5 text-accent" />
                </span>
                <span>Saved reports and planning history</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-background">
          <div className="flex min-h-screen items-center justify-center px-8">
            <div className="w-full max-w-[400px]">
              <div className="mb-8 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M3 8L8 3L13 8"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 13V8.5L8 5.5L11 8.5V13"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-lg font-bold text-foreground">MyPlanningGuide</span>
              </div>

              <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
                Reset your password
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClassName}
                    placeholder="you@example.com"
                  />
                </div>

                <button type="submit" className={`${primaryCtaClassName} mt-2`} disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </button>
              </form>

              {errorMessage ? (
                <p className="mt-2 text-xs font-medium text-danger" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <p className="mt-2 text-xs font-medium text-[#0F7040]" role="status">
                  {successMessage}
                </p>
              ) : null}

              <p className="mt-4 text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="font-medium text-primary transition-opacity hover:opacity-90"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { FormEvent, useState } from "react"

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"

const primaryCtaClassName =
  "inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"

export function ForgotPasswordForm() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")
    setIsSubmitting(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "https://theplanningconsultant.com/auth/reset-password",
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message || "Unable to send reset link. Please try again.")
      return
    }

    setSuccessMessage("Check your email for a reset link")
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Reset your password</h1>
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
        <Link href="/login" className="font-medium text-primary transition-opacity hover:opacity-90">
          Back to sign in
        </Link>
      </p>
    </>
  )
}

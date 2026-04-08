"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"

const primaryCtaClassName =
  "inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"

export function ResetPasswordForm() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match")
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.auth.updateUser({ password })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message || "Unable to update your password. Please try again.")
      return
    }

    router.push("/dashboard")
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Set a new password</h1>
      <p className="mb-6 text-sm text-muted-foreground">Enter and confirm your new password.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password" className="text-sm font-medium text-foreground">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClassName}
            placeholder="Re-enter your new password"
          />
        </div>

        <button type="submit" className={`${primaryCtaClassName} mt-2`} disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>

      {errorMessage ? (
        <p className="mt-2 text-xs font-medium text-danger" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </>
  )
}

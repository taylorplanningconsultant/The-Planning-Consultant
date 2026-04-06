"use client"

import { STRIPE_PRODUCTS } from "@/lib/stripe/products"
import { cn } from "@/utils/cn"
import { Loader2 } from "lucide-react"
import { useState } from "react"

const primaryCtaClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-accent px-8 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"

type ReportUpgradeCTAProps = {
  reportId: string
  email: string | null | undefined
  className?: string
}

export function ReportUpgradeCTA({
  reportId,
  email,
  className,
}: ReportUpgradeCTAProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUnlock() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: STRIPE_PRODUCTS.oneOff.fullReport,
          reportId,
          email: email?.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? "Checkout could not be started. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-secondary p-6 shadow-sm md:p-8",
        className,
      )}
    >
      <p className="text-accent mb-2 text-xs font-bold uppercase tracking-widest">
        Basic report
      </p>
      <h2 className="text-foreground mb-2 text-xl font-extrabold tracking-tight md:text-2xl">
        Unlock the full report
      </h2>
      <p className="text-muted-foreground mb-6 text-base leading-relaxed">
        Remove limits and get the complete PDF with the full AI planning
        assessment — same as when you upgrade from the check flow.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleUnlock}
          disabled={loading}
          className={primaryCtaClassName}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Redirecting to secure payment…
            </>
          ) : (
            "Unlock full report — £29 one-off"
          )}
        </button>
      </div>
      {error ? (
        <p className="text-danger mt-4 text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

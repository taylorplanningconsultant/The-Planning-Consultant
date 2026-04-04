"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) setShow(true)
  }, [])

  function handleAccept() {
    localStorage.setItem("cookie-consent", "accepted")
    setShow(false)
  }

  function handleDecline() {
    localStorage.setItem("cookie-consent", "declined")
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-brand-dark border-t border-white/10 px-6 py-4"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-white/80 text-sm">
          We use essential cookies to keep you signed in and analytics cookies
          to improve our service. See our{" "}
          <Link href="/privacy" className="underline text-white">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className="border border-white/30 text-white text-sm px-4 py-2 rounded-lg hover:bg-white/10"
            onClick={handleDecline}
          >
            Decline
          </button>
          <button
            type="button"
            className="bg-white text-brand-dark font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90"
            onClick={handleAccept}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

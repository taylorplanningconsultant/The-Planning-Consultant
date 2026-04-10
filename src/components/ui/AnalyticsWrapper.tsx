"use client"

import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleAnalytics } from "@next/third-parties/google"
import { useEffect, useState } from "react"

export function AnalyticsWrapper() {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    function syncConsent() {
      setHasConsent(localStorage.getItem("cookie-consent") === "accepted")
    }

    syncConsent()
    window.addEventListener("cookie-accepted", syncConsent)

    return () => {
      window.removeEventListener("cookie-accepted", syncConsent)
    }
  }, [])

  if (!hasConsent) return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""} />
    </>
  )
}

"use client"

import { useState } from "react"

export function ShareLinkCopyButton() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="border border-white/40 bg-transparent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 rounded-lg"
      aria-live="polite"
    >
      {copied ? "Link copied" : "Copy share link"}
    </button>
  )
}

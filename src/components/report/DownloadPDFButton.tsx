'use client'

import { useState } from 'react'

export function DownloadPDFButton({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)

    try {
      const res = await fetch(`/api/generate-pdf/${reportId}`, {
        method: 'POST',
      })

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'planning-report.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-dark hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {loading ? 'Generating...' : 'Download PDF report'}
    </button>
  )
}

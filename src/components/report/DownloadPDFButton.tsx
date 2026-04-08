'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/utils/cn'

type DownloadPDFButtonProps = {
  reportId: string
  className?: string
  variant?: 'default' | 'icon'
}

export function DownloadPDFButton({
  reportId,
  className,
  variant = 'default',
}: DownloadPDFButtonProps) {
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

  const isIcon = variant === 'icon'

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      aria-label={loading ? 'Generating PDF' : 'Download PDF report'}
      title="Download PDF report"
      className={cn(
        isIcon
          ? 'inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60'
          : 'rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-60',
        className,
      )}
    >
      {loading ? (
        isIcon ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          'Generating...'
        )
      ) : isIcon ? (
        <Download className="size-4" aria-hidden />
      ) : (
        'Download PDF report'
      )}
    </button>
  )
}

"use client"

import { Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { DownloadPDFButton } from "@/components/report/DownloadPDFButton"
import type { Tables } from "@/types/database"
import { cn } from "@/utils/cn"

const PAGE_SIZE = 10

export type DashboardReportRow = Pick<
  Tables<"reports">,
  "id" | "postcode" | "lpa_name" | "approval_score" | "share_token" | "report_type" | "created_at"
>

type TypeFilter = "all" | "basic" | "full"

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

function getScoreBadgeStyles(score: number | null): { label: string; classes: string } {
  if (score == null) {
    return {
      label: "No score",
      classes: "bg-secondary text-muted-foreground",
    }
  }

  const rounded = Math.round(score)
  const suffix = " / 100"

  if (score >= 70) {
    return {
      label: `${rounded}${suffix}`,
      classes: "bg-[#EDFAF3] text-[#0F7040]",
    }
  }

  if (score >= 40) {
    return {
      label: `${rounded}${suffix}`,
      classes: "bg-[#FEF7E6] text-[#8A6010]",
    }
  }

  return {
    label: `${rounded}${suffix}`,
    classes: "bg-[#FDECEA] text-[#991818]",
  }
}

function isFullType(reportType: string | null | undefined): boolean {
  return reportType?.toLowerCase() === "full"
}

function normalizePostcode(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "")
}

function matchesPostcode(row: DashboardReportRow, q: string): boolean {
  if (!q.trim()) return true
  const nq = normalizePostcode(q)
  const pc = normalizePostcode(row.postcode ?? "")
  return pc.includes(nq)
}

function matchesReportType(row: DashboardReportRow, filter: TypeFilter): boolean {
  if (filter === "all") return true
  const full = isFullType(row.report_type)
  if (filter === "full") return full
  return !full
}

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "basic", label: "Basic" },
  { value: "full", label: "Full" },
]

export type DashboardReportsListProps = {
  reports: DashboardReportRow[]
}

export function DashboardReportsList({ reports }: DashboardReportsListProps) {
  const total = reports.length
  const [postcodeQuery, setPostcodeQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [page, setPage] = useState(1)

  const postcodeMatchedRows = useMemo(() => {
    return reports.filter((r) => matchesPostcode(r, postcodeQuery))
  }, [reports, postcodeQuery])

  const filtered = useMemo(() => {
    return reports.filter(
      (r) => matchesPostcode(r, postcodeQuery) && matchesReportType(r, typeFilter),
    )
  }, [reports, postcodeQuery, typeFilter])

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  useEffect(() => {
    setPage(1)
  }, [postcodeQuery, typeFilter])

  const paginated = useMemo(() => {
    return filtered.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    )
  }, [filtered, currentPage])

  const isSearchActive = postcodeQuery.trim().length > 0
  const noPostcodeMatch = isSearchActive && postcodeMatchedRows.length === 0
  const showSearchEmpty = noPostcodeMatch
  const showFilterOnlyEmpty = !noPostcodeMatch && totalFiltered === 0

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-border bg-background p-10 shadow-sm md:p-14">
        <div className="mx-auto max-w-md text-center">
          <img
            src="/illustrations/filing.svg"
            alt=""
            className="mx-auto mb-6 h-auto w-40 opacity-90"
            width={160}
            height={160}
          />
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#18A056]">
            No reports yet
          </p>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-[#0A0F0C]">
            Run your first planning check
          </h2>
          <p className="mb-8 text-base leading-relaxed text-[#4A5C50]">
            When you complete a check, your reports will appear here so you can revisit scores and
            share links anytime.
          </p>
          <Link
            href="/check"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 sm:w-auto"
          >
            Start a check
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-muted-brand mb-1 text-xs font-medium uppercase tracking-wider">
            Total reports
          </p>
          <p className="text-foreground text-4xl font-extrabold tabular-nums tracking-tight md:text-5xl">
            {total}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 shadow-sm md:flex-row md:flex-wrap md:items-end">
        <div className="min-w-0 flex-1 md:max-w-md">
          <label
            htmlFor="reports-search-postcode"
            className="text-muted-brand mb-1 block text-xs font-semibold uppercase tracking-wider"
          >
            Search by postcode
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand"
              aria-hidden
            />
            <input
              id="reports-search-postcode"
              type="search"
              value={postcodeQuery}
              onChange={(e) => setPostcodeQuery(e.target.value)}
              placeholder="Postcode"
              className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              autoComplete="off"
              spellCheck={false}
              aria-label="Filter reports by postcode"
            />
          </div>
        </div>
        <div>
          <span className="text-muted-brand mb-1 block text-xs font-semibold uppercase tracking-wider">
            Report type
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="w-full min-w-0 rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent md:min-w-[10rem] md:w-auto"
            aria-label="Filter by report type"
          >
            {TYPE_FILTERS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showSearchEmpty ? (
        <div className="rounded-xl border border-border bg-secondary/50 px-6 py-10 text-center">
          <p className="text-muted-foreground text-sm leading-relaxed">
            No results for &apos;{postcodeQuery.trim()}&apos;
          </p>
          <button
            type="button"
            onClick={() => setPostcodeQuery("")}
            className="text-primary mt-4 inline-block text-sm font-medium hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : showFilterOnlyEmpty ? (
        <div className="rounded-xl border border-border bg-secondary/50 px-6 py-10 text-center">
          <img
            src="/illustrations/house_searching.svg"
            alt=""
            className="mx-auto mb-4 h-auto w-28 opacity-80"
            width={112}
            height={112}
          />
          <p className="text-foreground mb-1 text-sm font-semibold">No reports match your filters</p>
          <p className="text-muted-foreground mb-4 text-sm">
            Try a different postcode or switch the report type filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setPostcodeQuery("")
              setTypeFilter("all")
            }}
            className="min-h-[44px] w-full rounded-lg border border-[#C8D4CA] px-4 py-2 text-sm font-medium text-[#4A5C50] transition-colors hover:bg-[#F0F4F1] sm:w-auto"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            <div className="hidden border-b border-border bg-secondary/80 px-4 py-2.5 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,7rem)_minmax(0,5.5rem)_minmax(0,4.5rem)_minmax(0,12rem)] md:items-center md:gap-3">
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                Postcode
              </span>
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                LPA
              </span>
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                Date
              </span>
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                Score
              </span>
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                Type
              </span>
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                Actions
              </span>
            </div>

            <ul className="divide-y divide-border">
              {paginated.map((report) => {
                const scoreBadge = getScoreBadgeStyles(report.approval_score)
                const full = isFullType(report.report_type)
                const reportHref = `/report/${report.share_token}`

                return (
                  <li key={report.id}>
                    <div className="group flex flex-col px-4 py-4 transition-colors hover:bg-secondary md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,7rem)_minmax(0,5.5rem)_minmax(0,4.5rem)_minmax(0,12rem)] md:items-center md:gap-3">
                      <Link href={reportHref} className="min-w-0 md:contents">
                        <div className="mb-3 md:mb-0">
                          <span className="block text-sm font-semibold tracking-tight text-foreground md:block">
                            {report.postcode}
                          </span>
                          <span className="mt-0.5 text-xs text-muted-brand md:hidden">
                            {formatDate(report.created_at)}
                          </span>
                        </div>

                        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground md:mb-0">
                          {report.lpa_name ?? "Unknown LPA"}
                        </p>

                        <span className="mb-3 hidden text-sm tabular-nums text-muted-foreground md:mb-0 md:block">
                          {formatDate(report.created_at)}
                        </span>

                        <div className="mb-3 flex flex-wrap items-center gap-2 md:mb-0">
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                              scoreBadge.classes,
                            )}
                          >
                            {scoreBadge.label}
                          </span>
                        </div>

                        <div className="mb-3 md:mb-0">
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                              full ? "bg-[#EDFAF3] text-[#0F7040]" : "bg-secondary text-muted-foreground",
                            )}
                          >
                            {full ? "Full" : "Basic"}
                          </span>
                        </div>
                      </Link>

                      <div className="flex flex-wrap items-center justify-end gap-2 md:mt-0">
                        <Link
                          href={reportHref}
                          className="text-sm font-medium text-accent hover:underline md:text-muted-brand md:no-underline md:group-hover:text-accent md:group-hover:underline"
                        >
                          <span className="md:hidden">View report</span>
                          <span className="hidden md:inline">View</span>
                        </Link>
                        <DownloadPDFButton reportId={report.id} variant="icon" />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row">
            <p className="text-muted-brand text-sm">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, totalFiltered)} of {totalFiltered}
            </p>
            <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
              {currentPage <= 1 ? (
                <span className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-brand opacity-50">
                  Previous
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Previous
                </button>
              )}
              <span className="text-muted-brand text-sm tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage >= totalPages ? (
                <span className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-brand opacity-50">
                  Next
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

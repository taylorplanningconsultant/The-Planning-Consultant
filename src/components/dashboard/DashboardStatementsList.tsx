"use client"

import { Download } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import type { Tables } from "@/types/database"
import { cn } from "@/utils/cn"

const PAGE_SIZE = 10

export type DashboardStatementRow = Pick<
  Tables<"statements">,
  "id" | "address" | "proposal_text" | "lpa_name" | "status" | "created_at"
> & { project_type?: string | null }

type StatusFilter = "all" | "complete" | "pending"

function getStatementSummary(projectType: string): string {
  try {
    const parsed = JSON.parse(projectType) as { projectType?: string }
    return parsed.projectType ?? projectType
  } catch {
    return projectType ?? "Planning Statement"
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

function truncateProposal(text: string, max = 90): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

function statusBadgeClasses(status: string): { label: string; className: string } {
  const s = status.toLowerCase()
  if (s === "draft") {
    return {
      label: "Draft",
      className: "bg-secondary text-muted-foreground",
    }
  }
  if (s === "complete" || s === "completed" || s === "ready") {
    return {
      label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
      className: "bg-[#EDFAF3] text-[#0F7040]",
    }
  }
  if (s === "failed" || s === "error") {
    return {
      label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
      className: "bg-[#FDECEA] text-[#991818]",
    }
  }
  return {
    label: status.replace(/_/g, " "),
    className: "bg-[#FEF7E6] text-[#8A6010]",
  }
}

function isCompleteStatus(status: string): boolean {
  const s = status.toLowerCase()
  return s === "complete" || s === "completed" || s === "ready"
}

function matchesStatusFilter(row: DashboardStatementRow, filter: StatusFilter): boolean {
  if (filter === "all") return true
  const complete = isCompleteStatus(row.status)
  if (filter === "complete") return complete
  return !complete
}

function matchesLpaSearch(row: DashboardStatementRow, term: string): boolean {
  if (!term.trim()) return true
  const t = term.trim().toLowerCase()
  return (row.lpa_name ?? "").toLowerCase().includes(t)
}

export type DashboardStatementsListProps = {
  statements: DashboardStatementRow[]
}

export function DashboardStatementsList({ statements }: DashboardStatementsListProps) {
  const count = statements.length
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)

  const lpaMatchedRows = useMemo(() => {
    return statements.filter((row) => matchesLpaSearch(row, searchTerm))
  }, [statements, searchTerm])

  const filtered = useMemo(() => {
    return statements.filter(
      (row) =>
        matchesLpaSearch(row, searchTerm) && matchesStatusFilter(row, statusFilter),
    )
  }, [statements, searchTerm, statusFilter])

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter])

  const paginated = useMemo(() => {
    return filtered.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    )
  }, [filtered, currentPage])

  const isSearchActive = searchTerm.trim().length > 0
  const noLpaMatch = isSearchActive && lpaMatchedRows.length === 0
  const showSearchEmpty = noLpaMatch
  const showFilterOnlyEmpty = !noLpaMatch && totalFiltered === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-muted-brand mb-1 text-xs font-medium uppercase tracking-wider">
            Library
          </p>
          <p className="text-foreground text-2xl font-extrabold tabular-nums tracking-tight md:text-3xl">
            {count}
            <span className="text-muted-foreground ml-2 text-base font-semibold md:text-lg">
              {count === 1 ? "statement" : "statements"}
            </span>
          </p>
        </div>
        <Link
          href="/statement"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-5 py-2.5 text-center text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
        >
          New statement
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 shadow-sm md:flex-row md:flex-wrap md:items-end">
        <div className="min-w-0 flex-1 md:max-w-md">
          <label
            htmlFor="statements-search-lpa"
            className="text-muted-brand mb-1 block text-xs font-semibold uppercase tracking-wider"
          >
            Search by LPA
          </label>
          <input
            id="statements-search-lpa"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Local planning authority"
            autoComplete="off"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label
            htmlFor="statements-status-filter"
            className="text-muted-brand mb-1 block text-xs font-semibold uppercase tracking-wider"
          >
            Status
          </label>
          <select
            id="statements-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full min-w-[10rem] rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent md:w-auto"
          >
            <option value="all">All</option>
            <option value="complete">Complete</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {showSearchEmpty ? (
        <div className="rounded-xl border border-border bg-secondary/50 px-6 py-10 text-center">
          <p className="text-muted-foreground text-sm leading-relaxed">
            No results for &apos;{searchTerm.trim()}&apos;
          </p>
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="text-primary mt-4 inline-block text-sm font-medium hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : showFilterOnlyEmpty ? (
        <div className="rounded-xl border border-border bg-secondary/50 px-6 py-10 text-center">
          <p className="text-muted-foreground text-sm leading-relaxed">
            No statements match your filters. Try adjusting status.
          </p>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="text-primary mt-4 inline-block text-sm font-medium hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            <div className="hidden border-b border-border bg-secondary/80 px-4 py-2.5 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,6.5rem)_minmax(0,6rem)_minmax(0,12rem)] md:items-center md:gap-3 md:px-5">
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                Summary
              </span>
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                LPA
              </span>
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                Status
              </span>
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                Created
              </span>
              <span className="text-muted-brand text-xs font-semibold uppercase tracking-wider">
                Actions
              </span>
            </div>

            <ul className="divide-y divide-border">
              {paginated.map((row) => {
                const summaryLine = getStatementSummary(row.project_type ?? "").trim()
                const title =
                  summaryLine ||
                  row.address?.trim() ||
                  truncateProposal(row.proposal_text, 72) ||
                  "Statement"
                const badge = statusBadgeClasses(row.status)
                const statementHref = `/statement/${row.id}`
                const docxHref = `/api/generate-statement-docx/${row.id}`

                return (
                  <li key={row.id}>
                    <div className="group flex flex-col px-4 py-4 transition-colors hover:bg-secondary md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,6.5rem)_minmax(0,6rem)_minmax(0,12rem)] md:items-center md:gap-3 md:px-5">
                      <Link href={statementHref} className="min-w-0 md:contents">
                        <div className="min-w-0 md:mb-0">
                          <p className="text-foreground text-sm font-semibold leading-snug">{title}</p>
                          {row.address?.trim() ? (
                            <p className="text-muted-brand mt-1 line-clamp-2 text-xs md:hidden">
                              {truncateProposal(row.proposal_text, 100)}
                            </p>
                          ) : null}
                        </div>

                        <p className="text-muted-foreground mt-2 text-sm md:mt-0">
                          {row.lpa_name ?? "—"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0">
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <p className="text-muted-brand mt-2 text-sm tabular-nums md:mt-0 md:text-right">
                          {formatDate(row.created_at)}
                        </p>
                      </Link>

                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 md:mt-0">
                        <Link
                          href={statementHref}
                          className="text-accent text-sm font-medium hover:underline md:text-muted-brand md:no-underline md:group-hover:text-accent md:group-hover:underline"
                        >
                          <span className="md:hidden">View statement</span>
                          <span className="hidden md:inline">View</span>
                        </Link>
                        <a
                          href={docxHref}
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted"
                          aria-label="Download Word document"
                          title="Download Word document"
                        >
                          <Download className="size-4" aria-hidden />
                        </a>
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
            <div className="flex items-center gap-2">
              {currentPage <= 1 ? (
                <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-brand opacity-50">
                  Previous
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Previous
                </button>
              )}
              <span className="text-muted-brand text-sm tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage >= totalPages ? (
                <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-brand opacity-50">
                  Next
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <p className="text-muted-brand text-center text-xs md:text-left">
        Refine and export options are expanding — open the generator anytime from{" "}
        <Link href="/statement" className="text-primary font-medium hover:underline">
          /statement
        </Link>
        .
      </p>
    </div>
  )
}

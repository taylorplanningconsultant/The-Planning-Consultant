"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { Tables } from "@/types/database";
import { cn } from "@/utils/cn";

export type DashboardReportRow = Pick<
  Tables<"reports">,
  "id" | "postcode" | "lpa_name" | "approval_score" | "share_token" | "report_type" | "created_at"
>;

type TypeFilter = "all" | "basic" | "full";

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

function getScoreBadgeStyles(score: number | null): { label: string; classes: string } {
  if (score == null) {
    return {
      label: "No score",
      classes: "bg-secondary text-muted-foreground",
    };
  }

  const rounded = Math.round(score);
  const suffix = " / 100";

  if (score >= 70) {
    return {
      label: `${rounded}${suffix}`,
      classes: "bg-[#EDFAF3] text-[#0F7040]",
    };
  }

  if (score >= 40) {
    return {
      label: `${rounded}${suffix}`,
      classes: "bg-[#FEF7E6] text-[#8A6010]",
    };
  }

  return {
    label: `${rounded}${suffix}`,
    classes: "bg-[#FDECEA] text-[#991818]",
  };
}

function isFullType(reportType: string | null | undefined): boolean {
  return reportType?.toLowerCase() === "full";
}

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "basic", label: "Basic" },
  { value: "full", label: "Full" },
];

export type DashboardReportsListProps = {
  reports: DashboardReportRow[];
};

export function DashboardReportsList({ reports }: DashboardReportsListProps) {
  const total = reports.length;
  const [postcodeQuery, setPostcodeQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filtered = useMemo(() => {
    const q = postcodeQuery.trim().toLowerCase().replace(/\s+/g, "");

    return reports.filter((r) => {
      if (typeFilter === "basic" && isFullType(r.report_type)) return false;
      if (typeFilter === "full" && !isFullType(r.report_type)) return false;

      if (!q) return true;
      const pc = (r.postcode ?? "").toLowerCase().replace(/\s+/g, "");
      return pc.includes(q);
    });
  }, [reports, postcodeQuery, typeFilter]);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-border bg-background p-10 md:p-14 shadow-sm">
        <div className="mx-auto max-w-md text-center">
          <img
            src="/illustrations/filing.svg"
            alt=""
            className="mx-auto mb-6 h-auto w-40 opacity-90"
            width={160}
            height={160}
          />
          <p className="text-[#18A056] text-xs font-bold uppercase tracking-widest mb-2">
            No reports yet
          </p>
          <h2 className="text-2xl font-extrabold text-[#0A0F0C] tracking-tight mb-3">
            Run your first planning check
          </h2>
          <p className="text-[#4A5C50] text-base leading-relaxed mb-8">
            When you complete a check, your reports will appear here so you can
            revisit scores and share links anytime.
          </p>
          <Link
            href="/check"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
          >
            Start a check
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-muted-brand text-xs font-medium uppercase tracking-wider mb-1">
            Total reports
          </p>
          <p className="text-4xl font-extrabold tabular-nums tracking-tight text-foreground md:text-5xl">
            {total}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand"
            aria-hidden
          />
          <input
            type="search"
            value={postcodeQuery}
            onChange={(e) => setPostcodeQuery(e.target.value)}
            placeholder="Search by postcode"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
            autoComplete="off"
            spellCheck={false}
            aria-label="Filter reports by postcode"
          />
        </div>

        <div
          className="inline-flex shrink-0 rounded-lg border border-border bg-secondary p-0.5"
          role="group"
          aria-label="Filter by report type"
        >
          {TYPE_FILTERS.map(({ value, label }) => {
            const active = typeFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                className={cn(
                  "min-w-[4.5rem] rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="hidden border-b border-border bg-secondary/80 px-4 py-2.5 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,7rem)_minmax(0,5.5rem)_minmax(0,4.5rem)_auto] md:items-center md:gap-3">
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
          <span className="text-muted-brand sr-only text-xs font-semibold uppercase tracking-wider md:not-sr-only">
            Open
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <img
              src="/illustrations/house_searching.svg"
              alt=""
              className="mx-auto mb-4 h-auto w-28 opacity-80"
              width={112}
              height={112}
            />
            <p className="text-foreground text-sm font-semibold mb-1">
              No reports match your filters
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Try a different postcode or switch the type filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setPostcodeQuery("");
                setTypeFilter("all");
              }}
              className="border border-[#C8D4CA] text-[#4A5C50] font-medium px-4 py-2 rounded-lg text-sm hover:bg-[#F0F4F1] transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((report) => {
              const scoreBadge = getScoreBadgeStyles(report.approval_score);
              const full = isFullType(report.report_type);

              return (
                <li key={report.id}>
                  <Link
                    href={`/report/${report.share_token}`}
                    className="group block px-4 py-4 transition-colors hover:bg-secondary md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,7rem)_minmax(0,5.5rem)_minmax(0,4.5rem)_auto] md:items-center md:gap-3"
                  >
                    <div className="mb-3 md:mb-0">
                      <span className="text-foreground text-sm font-semibold tracking-tight md:block">
                        {report.postcode}
                      </span>
                      <span className="text-muted-brand mt-0.5 text-xs md:hidden">
                        {formatDate(report.created_at)}
                      </span>
                    </div>

                    <p className="text-muted-foreground mb-3 line-clamp-2 text-sm md:mb-0">
                      {report.lpa_name ?? "Unknown LPA"}
                    </p>

                    <span className="text-muted-foreground mb-3 hidden text-sm tabular-nums md:block">
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
                          full
                            ? "bg-[#EDFAF3] text-[#0F7040]"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {full ? "Full" : "Basic"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between md:justify-end">
                      <span className="text-accent text-sm font-medium group-hover:underline md:hidden">
                        View report
                      </span>
                      <span className="text-muted-brand hidden text-sm font-medium transition-colors group-hover:text-accent md:inline">
                        View
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

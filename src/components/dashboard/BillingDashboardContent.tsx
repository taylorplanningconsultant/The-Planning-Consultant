"use client";

import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/utils/cn";

import type { openBillingPortalAction } from "@/app/(dashboard)/dashboard/billing/actions";

type ChargeRow = {
  id: string;
  amountFormatted: string;
  description: string;
  dateLabel: string;
  paid: boolean;
};

export type BillingDashboardContentProps = {
  planTitle: string;
  subStatus: string | null;
  hasSubscriptionRow: boolean;
  renewalLabel: string | null;
  showUpgrade: boolean;
  showCancelButton: boolean;
  charges: ChargeRow[];
  hasPaymentHistory: boolean;
  cancelAction: typeof openBillingPortalAction;
};

const TIERS = [
  {
    key: "starter",
    name: "Starter",
    monthly: 59,
    annual: 49,
    annualBillNote: "Billed as £590/year · save £118",
    href: "/signup?plan=starter",
    cta: "Start free trial",
    featured: false,
    features: ["10 AI reports / month", "3 statements / month", "1 seat"],
  },
  {
    key: "pro",
    name: "Pro",
    monthly: 129,
    annual: 107,
    annualBillNote: "Billed as £1,290/year · save £258",
    href: "/signup?plan=pro",
    cta: "Start free trial",
    featured: true,
    features: ["40 AI reports / month", "15 statements / month", "1 seat"],
  },
  {
    key: "agency",
    name: "Agency",
    monthly: 299,
    annual: 249,
    annualBillNote: "Billed as £2,990/year · save £598",
    href: "/contact?plan=agency",
    cta: "Contact us",
    featured: false,
    features: ["100 AI reports / month", "40 statements / month", "5 seats"],
  },
] as const;

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#EDFAF3] px-2.5 py-1 text-xs font-semibold text-[#0F7040]">
        Active
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        Cancelled
      </span>
    );
  }
  if (status === "past_due") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#FEF7E6] px-2.5 py-1 text-xs font-semibold text-[#8A6010]">
        Past due
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function BillingDashboardContent({
  planTitle,
  subStatus,
  hasSubscriptionRow,
  renewalLabel,
  showUpgrade,
  showCancelButton,
  charges,
  hasPaymentHistory,
  cancelAction,
}: BillingDashboardContentProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="space-y-10 md:space-y-12">
      {/* Current plan */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-dark via-primary to-accent" aria-hidden />
        <div className="p-6 md:flex md:items-start md:justify-between md:gap-8 md:p-8">
          <div className="min-w-0 flex-1">
            <p className="text-[#18A056] mb-2 text-xs font-bold uppercase tracking-widest">
              Current plan
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0A0F0C] md:text-4xl">
                {planTitle}
              </h2>
              {hasSubscriptionRow ? <StatusBadge status={subStatus} /> : null}
            </div>
            {!hasSubscriptionRow && planTitle === "Free" ? (
              <p className="text-muted-foreground mt-3 max-w-xl text-base leading-relaxed">
                You&apos;re on the free tier. Upgrade when you need higher limits, team
                seats, and priority support for client work.
              </p>
            ) : (
              <p className="text-muted-foreground mt-3 max-w-xl text-base leading-relaxed">
                {hasSubscriptionRow
                  ? "Your subscription is managed securely through Stripe. Invoices and payment methods can be updated anytime."
                  : "Your plan is active. Manage billing details whenever you need to."}
              </p>
            )}
            {renewalLabel ? (
              <p className="text-muted-brand mt-4 text-sm">{renewalLabel}</p>
            ) : null}
          </div>
          <div className="mt-6 shrink-0 md:mt-0 md:w-44">
            <img
              src="/illustrations/experts.svg"
              alt=""
              className="mx-auto h-auto w-36 opacity-95 md:mx-0 md:w-40"
              width={160}
              height={160}
            />
          </div>
        </div>
        {showCancelButton ? (
          <div className="border-t border-border bg-secondary/50 px-6 py-4 md:px-8">
            <form action={cancelAction}>
              <button
                type="submit"
                className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 transition-colors hover:underline"
              >
                Cancel subscription
              </button>
            </form>
          </div>
        ) : null}
      </section>

      {/* Upgrade — free only */}
      {showUpgrade ? (
        <section className="rounded-2xl border border-border bg-secondary/40 p-6 md:p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[#18A056] mb-2 text-xs font-bold uppercase tracking-widest">
                Upgrade
              </p>
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0A0F0C] md:text-3xl">
                Professional plans built for practice workflows
              </h3>
              <p className="text-muted-foreground mt-2 text-base leading-relaxed">
                Every tier includes a 14-day free trial. No credit card required to start.
                Switch billing monthly or annually anytime from checkout.
              </p>
            </div>
            <div className="inline-flex shrink-0 items-center rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  !annual
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                  annual
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                <span>Annual</span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    annual ? "bg-white/20 text-white" : "bg-brand-light text-accent",
                  )}
                >
                  Save 2 months
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.key}
                className={cn(
                  "flex flex-col rounded-2xl border bg-background p-6 shadow-sm",
                  tier.featured
                    ? "border-primary ring-2 ring-primary/20 md:scale-[1.02]"
                    : "border-border",
                )}
              >
                {tier.featured ? (
                  <span className="bg-brand-light text-primary mb-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    Most popular
                  </span>
                ) : (
                  <span className="mb-3 block h-5" aria-hidden />
                )}
                <p className="text-foreground text-lg font-bold">{tier.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tabular-nums text-[#0A0F0C]">
                    £{annual ? tier.annual : tier.monthly}
                  </span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                {annual ? (
                  <p className="text-muted-brand mt-2 text-xs leading-snug">{tier.annualBillNote}</p>
                ) : (
                  <p className="text-muted-brand mt-2 text-xs">&nbsp;</p>
                )}
                <ul className="mt-4 flex flex-1 flex-col gap-3">
                  {tier.features.map((f) => (
                    <li key={f} className="text-muted-foreground flex gap-2 text-sm leading-snug">
                      <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={cn(
                    "mt-6 inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-center text-sm font-semibold transition-opacity",
                    tier.featured
                      ? "bg-gradient-to-br from-primary to-accent text-white shadow-md hover:opacity-90"
                      : "border border-[#C8D4CA] text-[#4A5C50] hover:bg-[#F0F4F1]",
                  )}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-muted-brand mt-6 text-center text-xs">
            Prefer to compare on the homepage?{" "}
            <Link href="/#professional-pricing" className="text-primary font-medium hover:underline">
              View full pricing
            </Link>
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-brand-light/40 p-6 md:p-8">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <img
                src="/illustrations/report.svg"
                alt=""
                className="h-auto w-16 shrink-0 opacity-90"
                width={64}
                height={64}
              />
              <div>
                <p className="text-[#18A056] mb-1 text-xs font-bold uppercase tracking-widest">
                  Need more capacity?
                </p>
                <p className="text-foreground font-semibold">Compare plans or add seats</p>
                <p className="text-muted-foreground mt-1 max-w-md text-sm leading-relaxed">
                  Change tiers, update payment details, or download invoices from our
                  secure billing portal — powered by Stripe.
                </p>
              </div>
            </div>
            <Link
              href="/#professional-pricing"
              className="border border-[#C8D4CA] text-[#4A5C50] font-medium px-6 py-3 rounded-lg hover:bg-[#F0F4F1] transition-colors shrink-0 inline-flex items-center gap-1"
            >
              View plans
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {/* Payment history */}
      <section>
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[#18A056] mb-2 text-xs font-bold uppercase tracking-widest">
              Payment history
            </p>
            <h3 className="text-2xl font-extrabold tracking-tight text-[#0A0F0C]">
              Invoices & charges
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Successful and failed card charges linked to your account.
            </p>
          </div>
        </div>

        {!hasPaymentHistory ? (
          <div className="rounded-2xl border border-border bg-background px-6 py-14 text-center shadow-sm md:px-10">
            <img
              src="/illustrations/notify.svg"
              alt=""
              className="mx-auto mb-5 h-auto w-28 opacity-85"
              width={112}
              height={112}
            />
            <p className="text-foreground font-semibold">No payments yet</p>
            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
              When you subscribe or buy a report, transactions will appear here with date
              and status.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-background p-4 shadow-sm md:p-6">
            <ul className="space-y-0">
              {charges.map((row, index) => {
                const isLast = index === charges.length - 1;
                return (
                  <li key={row.id} className="relative flex gap-4 md:gap-6">
                    <div className="relative flex w-8 shrink-0 flex-col items-center md:w-10">
                      {!isLast ? (
                        <span
                          className="bg-border absolute left-1/2 top-4 z-0 h-full w-px -translate-x-1/2"
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className={cn(
                          "relative z-[1] mt-1.5 flex h-3 w-3 shrink-0 rounded-full border-2 border-background ring-2",
                          row.paid ? "bg-[#18A056] ring-[#EDFAF3]" : "bg-danger ring-[#FDECEA]",
                        )}
                        aria-hidden
                      />
                    </div>
                    <div className={cn("min-w-0 flex-1", !isLast && "pb-2")}>
                      <div
                        className={cn(
                          "flex flex-col gap-3 pb-6 sm:flex-row sm:items-start sm:justify-between",
                          !isLast && "border-b border-border",
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <p className="text-foreground text-lg font-bold tabular-nums">
                              {row.amountFormatted}
                            </p>
                            {index === 0 ? (
                              <span className="text-muted-brand text-[10px] font-semibold uppercase tracking-wider">
                                Latest
                              </span>
                            ) : null}
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm">{row.description}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                          <span className="text-muted-brand text-sm tabular-nums">{row.dateLabel}</span>
                          {row.paid ? (
                            <span className="inline-flex rounded-full bg-[#EDFAF3] px-2.5 py-1 text-xs font-semibold text-[#0F7040]">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-[#FDECEA] px-2.5 py-1 text-xs font-semibold text-[#991818]">
                              Failed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

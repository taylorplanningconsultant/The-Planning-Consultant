import { openBillingPortalAction } from "@/app/(dashboard)/dashboard/billing/actions"
import { BillingSubscriptionTierCards } from "@/components/dashboard/BillingDashboardContent"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Footer } from "@/components/layout/Footer"
import { Nav } from "@/components/layout/Nav"
import { getCreditsBalance } from "@/lib/credits"
import { stripe } from "@/lib/stripe/client"
import { STRIPE_PRODUCTS } from "@/lib/stripe/products"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"
import { cn } from "@/utils/cn"
import Link from "next/link"
import { redirect } from "next/navigation"

async function manageSubscriptionAction() {
  "use server"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect("/login")
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
  if (!baseUrl) {
    redirect("/dashboard/billing")
  }

  const res = await fetch(`${baseUrl}/api/create-portal-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email }),
  })

  const data = (await res.json()) as { url?: string }

  if (data.url) {
    redirect(data.url)
  }

  redirect("/dashboard/billing")
}

async function startTopUpCheckout(formData: FormData) {
  "use server"

  const raw = formData.get("size")
  if (raw !== "small" && raw !== "medium" && raw !== "large") {
    redirect("/dashboard/billing")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const priceId = STRIPE_PRODUCTS.topUp[raw]
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
  if (!baseUrl) {
    redirect("/dashboard/billing")
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard/billing`,
    customer_email: user.email ?? undefined,
    metadata: {
      reportId: "",
      statementId: "",
      priceId,
    },
  })

  if (!checkoutSession.url) {
    redirect("/dashboard/billing")
  }

  redirect(checkoutSession.url)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

function formatChargeDate(unixSeconds: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(unixSeconds * 1000))
}

function capitalizePlan(plan: string): string {
  const p = plan.toLowerCase()
  if (p === "starter") return "Starter"
  if (p === "pro") return "Pro"
  if (p === "agency") return "Agency"
  if (p === "free") return "Free"
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountMinor / 100)
}

type SubscriptionRow = Pick<
  Tables<"subscriptions">,
  "plan" | "status" | "current_period_end"
>

type PaidReportRow = Pick<
  Tables<"reports">,
  "id" | "postcode" | "lpa_name" | "created_at" | "report_type" | "email" | "share_token"
>

type ChargeRow = {
  id: string
  amountFormatted: string
  description: string
  dateLabel: string
  paid: boolean
  url?: string
}

type ChargeRowWithSort = ChargeRow & { sortTime: number }

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#EDFAF3] px-2.5 py-1 text-xs font-semibold text-[#0F7040]">
        Active
      </span>
    )
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        Cancelled
      </span>
    )
  }
  if (status === "past_due") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#FEF7E6] px-2.5 py-1 text-xs font-semibold text-[#8A6010]">
        Past due
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">
      {status.replace(/_/g, " ")}
    </span>
  )
}

const TRANSACTIONS_PAGE_SIZE = 10

function billingPageHref(annual: boolean, page: number): string {
  const params = new URLSearchParams()
  if (annual) params.set("period", "annual")
  if (page > 1) params.set("page", String(page))
  const qs = params.toString()
  return `/dashboard/billing${qs ? `?${qs}` : ""}`
}

type PageProps = {
  searchParams: Promise<{ period?: string; page?: string }>
}

export default async function BillingPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const annual = sp.period === "annual"
  const pageRaw = typeof sp.page === "string" ? sp.page : "1"
  const pageNum = Math.max(1, parseInt(pageRaw, 10) || 1)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userId = user.id

  const creditsBalance = await getCreditsBalance(userId)

  const [profileResult, subscriptionResult, paidReportsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_tier, stripe_customer_id")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("reports")
      .select("id, postcode, lpa_name, created_at, report_type, email, share_token")
      .eq("user_id", userId)
      .eq("report_type", "full")
      .order("created_at", { ascending: false }),
  ])

  const profile = profileResult.data
  const subscription: SubscriptionRow | null = subscriptionResult.data ?? null
  const paidReports: PaidReportRow[] = paidReportsResult.data ?? []

  const { data: paidStatements, error: paidStatementsError } = await supabase
    .from("statements")
    .select("id, lpa_name, project_type, created_at")
    .eq("user_id", userId)
    .eq("status", "complete")
    .order("created_at", { ascending: false })

  const transactions = [
    ...(paidReports ?? []).map((r) => ({
      id: r.id,
      amount: "£29.00",
      description: `Planning Report — ${r.postcode}`,
      date: r.created_at,
      type: "report" as const,
      url: `/report/${r.share_token}`,
    })),
    ...(paidStatements ?? []).map((s) => ({
      id: s.id,
      amount: "£79.00",
      description: `Planning Statement — ${s.lpa_name}`,
      date: s.created_at,
      type: "statement" as const,
      url: `/statement/${s.id}`,
    })),
  ].sort(
    (a, b) =>
      new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime(),
  )

  const fetchError =
    Boolean(profileResult.error) ||
    Boolean(subscriptionResult.error) ||
    Boolean(paidReportsResult.error) ||
    Boolean(paidStatementsError)

  let planTitle = "Free"
  if (subscription) {
    planTitle = capitalizePlan(subscription.plan)
  } else if (profile?.subscription_tier && profile.subscription_tier !== "free") {
    planTitle = capitalizePlan(profile.subscription_tier)
  }

  const isFreePlan = planTitle === "Free"

  const subStatus = subscription?.status ?? null
  const showRenewal =
    subStatus === "active" && subscription?.current_period_end != null

  const showUpgrade = isFreePlan

  const showCancelButton =
    Boolean(profile?.stripe_customer_id?.trim()) &&
    subscription != null &&
    (subStatus === "active" || subStatus === "past_due")

  const combinedCharges: ChargeRowWithSort[] = []
  const customerId = profile?.stripe_customer_id?.trim()

  if (customerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const list = await stripe.charges.list({
        customer: customerId,
        limit: 25,
      })

      for (const ch of list.data) {
        combinedCharges.push({
          id: ch.id,
          amountFormatted: formatMoney(ch.amount, ch.currency),
          description: (ch.description?.trim() || "Planning report") as string,
          dateLabel: formatChargeDate(ch.created),
          paid: ch.status === "succeeded" && ch.paid,
          sortTime: ch.created * 1000,
        })
      }
    } catch {
      /* leave Stripe list empty */
    }
  }

  for (const t of transactions) {
    const sortTime = t.date ? new Date(t.date).getTime() : 0
    combinedCharges.push({
      id: `${t.type}-${t.id}`,
      amountFormatted: t.amount,
      description: t.description,
      dateLabel: formatDate(t.date),
      paid: true,
      sortTime,
      url: t.url,
    })
  }

  combinedCharges.sort((a, b) => b.sortTime - a.sortTime)
  const charges: ChargeRow[] = combinedCharges.map(({ sortTime: _t, ...row }) => row)

  const hasPaymentHistory = charges.length > 0
  const totalCharges = charges.length
  const totalChargePages = Math.max(1, Math.ceil(totalCharges / TRANSACTIONS_PAGE_SIZE))
  const currentChargePage = Math.min(pageNum, totalChargePages)
  const paginatedCharges = charges.slice(
    (currentChargePage - 1) * TRANSACTIONS_PAGE_SIZE,
    currentChargePage * TRANSACTIONS_PAGE_SIZE,
  )

  const renewalLabel =
    showRenewal && subscription?.current_period_end
      ? `Renews on ${formatDate(subscription.current_period_end)}`
      : null

  const tierRaw = profile?.subscription_tier ?? "free"
  const tier =
    tierRaw === "free" || tierRaw === "starter" || tierRaw === "pro" || tierRaw === "agency"
      ? tierRaw
      : "free"

  return (
    <>
      <Nav />
      <DashboardShell
        title="Billing"
        subtitle="Plan, invoices, and subscription preferences"
        illustration="/illustrations/celebrate.svg"
      >
        {fetchError ? (
          <div className="rounded-2xl border border-[#F5C6C6] bg-[#FDECEA] p-6">
            <p className="text-sm text-[#991818]">Could not load billing data. Please refresh.</p>
          </div>
        ) : (
          <div className="space-y-10 md:space-y-12">
            {/* Current plan */}
            <section className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
              <div
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-dark via-primary to-accent"
                aria-hidden
              />
              <div className="p-6 md:flex md:items-start md:justify-between md:gap-8 md:p-8">
                <div className="min-w-0 flex-1">
                  <div className="mb-4 rounded-2xl border border-border bg-background p-6">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Credits</p>
                    <div className="mb-1 flex items-end gap-2">
                      <span className="text-4xl font-bold text-foreground tabular-nums">
                        {creditsBalance}
                      </span>
                      <span className="mb-1 text-sm text-muted-foreground">credits remaining</span>
                    </div>
                    {tier !== "free" ? (
                      <p className="mt-2 text-xs text-muted-brand">
                        Refreshes monthly · Rolls over up to{" "}
                        {tier === "starter" ? 30 : tier === "pro" ? 120 : 320} credits
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-brand">Subscribe to get monthly credits</p>
                    )}
                  </div>

                  <p className="text-[#18A056] mb-2 text-xs font-bold uppercase tracking-widest">
                    Current plan
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-extrabold tracking-tight text-[#0A0F0C] md:text-4xl">
                      {planTitle}
                    </h2>
                    {subscription != null ? <StatusBadge status={subStatus} /> : null}
                  </div>
                  {!subscription && planTitle === "Free" ? (
                    <p className="text-muted-foreground mt-3 max-w-xl text-base leading-relaxed">
                      You&apos;re on the free tier. Upgrade when you need higher limits, team seats,
                      and priority support for client work.
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-3 max-w-xl text-base leading-relaxed">
                      {subscription
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
                  <form action={openBillingPortalAction}>
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

            {tier !== "free" ? (
              <div className="mt-4 rounded-2xl border border-border bg-background p-6">
                <p className="text-accent mb-4 text-xs font-bold uppercase tracking-widest">
                  Top up credits
                </p>
                <div className="divide-y divide-border">
                  <form action={startTopUpCheckout} className="block">
                    <input type="hidden" name="size" value="small" />
                    <div className="flex items-center justify-between py-3 first:pt-0">
                      <div>
                        <p className="text-sm font-semibold text-foreground">5 credits</p>
                        <p className="text-xs text-muted-brand">£7.00/credit</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-foreground">£35</p>
                        <button
                          type="submit"
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          Buy →
                        </button>
                      </div>
                    </div>
                  </form>
                  <form action={startTopUpCheckout} className="block">
                    <input type="hidden" name="size" value="medium" />
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">15 credits</p>
                        <p className="text-xs text-muted-brand">£6.33/credit</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-foreground">£95</p>
                        <button
                          type="submit"
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          Buy →
                        </button>
                      </div>
                    </div>
                  </form>
                  <form action={startTopUpCheckout} className="block">
                    <input type="hidden" name="size" value="large" />
                    <div className="flex items-center justify-between py-3 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-foreground">40 credits</p>
                        <p className="text-xs text-muted-brand">£5.48/credit</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-foreground">£219</p>
                        <button
                          type="submit"
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          Buy →
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}

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
                      Switch billing monthly or annually anytime from checkout.
                    </p>
                  </div>
                  <div className="inline-flex shrink-0 items-center rounded-lg border border-border bg-background p-1">
                    <Link
                      href="/dashboard/billing?period=monthly"
                      scroll={false}
                      className={cn(
                        "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                        !annual
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      Monthly
                    </Link>
                    <Link
                      href="/dashboard/billing?period=annual"
                      scroll={false}
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
                        Best value
                      </span>
                    </Link>
                  </div>
                </div>

                <BillingSubscriptionTierCards annual={annual} />

                <p className="text-muted-brand mt-6 text-center text-xs">
                  Prefer to compare on the homepage?{" "}
                  <Link href="/#professional-pricing" className="text-primary font-medium hover:underline">
                    Compare plans
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
                        Change tiers, update payment details, or download invoices from our secure
                        billing portal — powered by Stripe.
                      </p>
                    </div>
                  </div>
                  <form action={manageSubscriptionAction}>
                    <button
                      type="submit"
                      className="border-border hover:bg-secondary rounded-lg border px-4 py-2 text-sm font-medium"
                    >
                      Manage subscription
                    </button>
                  </form>
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
                    When you subscribe or buy a report, transactions will appear here with date and
                    status.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-border bg-background p-4 shadow-sm md:p-6">
                    <ul className="space-y-0">
                      {paginatedCharges.map((row, index) => {
                      const isLast = index === paginatedCharges.length - 1
                      const globalIndex = (currentChargePage - 1) * TRANSACTIONS_PAGE_SIZE + index
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
                                  {globalIndex === 0 ? (
                                    <span className="text-muted-brand text-[10px] font-semibold uppercase tracking-wider">
                                      Latest
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-muted-foreground mt-1 text-sm">{row.description}</p>
                              </div>
                              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                                <span className="text-muted-brand text-sm tabular-nums">
                                  {row.dateLabel}
                                </span>
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  {row.paid ? (
                                    <span className="inline-flex rounded-full bg-[#EDFAF3] px-2.5 py-1 text-xs font-semibold text-[#0F7040]">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-[#FDECEA] px-2.5 py-1 text-xs font-semibold text-[#991818]">
                                      Failed
                                    </span>
                                  )}
                                  {row.url ? (
                                    <Link
                                      href={row.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-medium text-accent hover:underline"
                                    >
                                      View →
                                    </Link>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                      })}
                    </ul>
                  </div>

                  <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row">
                    <p className="text-muted-brand text-sm">
                      Showing {(currentChargePage - 1) * TRANSACTIONS_PAGE_SIZE + 1}–
                      {Math.min(currentChargePage * TRANSACTIONS_PAGE_SIZE, totalCharges)} of{" "}
                      {totalCharges}
                    </p>
                    <div className="flex items-center gap-2">
                      {currentChargePage <= 1 ? (
                        <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-brand opacity-50">
                          Previous
                        </span>
                      ) : (
                        <Link
                          href={billingPageHref(annual, currentChargePage - 1)}
                          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          Previous
                        </Link>
                      )}
                      <span className="text-muted-brand text-sm tabular-nums">
                        Page {currentChargePage} of {totalChargePages}
                      </span>
                      {currentChargePage >= totalChargePages ? (
                        <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-brand opacity-50">
                          Next
                        </span>
                      ) : (
                        <Link
                          href={billingPageHref(annual, currentChargePage + 1)}
                          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          Next
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </DashboardShell>
      <Footer />
    </>
  )
}

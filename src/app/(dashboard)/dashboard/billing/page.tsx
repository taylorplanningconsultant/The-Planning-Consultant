import { openBillingPortalAction } from "@/app/(dashboard)/dashboard/billing/actions"
import { BillingDashboardContent } from "@/components/dashboard/BillingDashboardContent"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Footer } from "@/components/layout/Footer"
import { Nav } from "@/components/layout/Nav"
import { stripe } from "@/lib/stripe/client"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"
import { redirect } from "next/navigation"

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

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = session.user.id

  const [profileResult, subscriptionResult] = await Promise.all([
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
  ])

  const profile = profileResult.data
  const subscription: SubscriptionRow | null = subscriptionResult.data ?? null
  const fetchError = Boolean(profileResult.error) || Boolean(subscriptionResult.error)

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

  type ChargeRow = {
    id: string
    amountFormatted: string
    description: string
    dateLabel: string
    paid: boolean
  }

  let charges: ChargeRow[] = []
  const customerId = profile?.stripe_customer_id?.trim()

  if (customerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const list = await stripe.charges.list({
        customer: customerId,
        limit: 25,
      })

      charges = list.data.map((ch) => ({
        id: ch.id,
        amountFormatted: formatMoney(ch.amount, ch.currency),
        description: (ch.description?.trim() || "Planning report") as string,
        dateLabel: formatChargeDate(ch.created),
        paid: ch.status === "succeeded" && ch.paid,
      }))
    } catch {
      charges = []
    }
  }

  const hasPaymentHistory = Boolean(customerId) && charges.length > 0

  const renewalLabel =
    showRenewal && subscription?.current_period_end
      ? `Renews on ${formatDate(subscription.current_period_end)}`
      : null

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
          <BillingDashboardContent
            planTitle={planTitle}
            subStatus={subStatus}
            hasSubscriptionRow={subscription != null}
            renewalLabel={renewalLabel}
            showUpgrade={showUpgrade}
            showCancelButton={showCancelButton}
            charges={charges}
            hasPaymentHistory={hasPaymentHistory}
            cancelAction={openBillingPortalAction}
          />
        )}
      </DashboardShell>
      <Footer />
    </>
  )
}

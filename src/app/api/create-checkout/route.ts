import { getSubscriptionTier } from "@/lib/credits"
import { stripe } from "@/lib/stripe/client"
import { STRIPE_PRODUCTS } from "@/lib/stripe/products"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { z } from "zod"

const bodySchema = z.object({
  priceId: z.string().min(1, "priceId must be a non-empty string"),
  mode: z.enum(["payment", "subscription"]).optional().default("payment"),
  reportId: z.string().optional(),
  email: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.email().optional(),
  ),
  successPath: z.string().optional(),
  projectAnswers: z.unknown().optional(),
  statementId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const {
      priceId,
      mode,
      reportId,
      email,
      successPath: successPathBody,
      statementId,
    } = parsed.data
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()
    const userEmail = user?.email ?? email ?? undefined

    const topUpPriceIds = Object.values(STRIPE_PRODUCTS.topUp) as string[]
    const isTopUp = topUpPriceIds.includes(priceId)

    if (isTopUp) {
      if (!userEmail) {
        return NextResponse.json(
          { error: "Email is required for top-up purchases" },
          { status: 400 },
        )
      }

      const supabase = createServiceClient()
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, subscription_tier")
        .eq("email", userEmail)
        .maybeSingle()

      const tier = profile
        ? await getSubscriptionTier(profile.id)
        : "free"

      if (!profile || tier === "free") {
        return NextResponse.json(
          { error: "Top-up credits require an active subscription" },
          { status: 403 },
        )
      }
    }

    let successUrl: string
    let cancelUrl: string

    if (reportId) {
      const supabase = await createClient()
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .select("share_token")
        .eq("id", reportId)
        .single()
      if (reportError || !report) {
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 },
        )
      }
      const shareToken = report.share_token
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""

      if (statementId) {
        // Bundle or statement purchase with report context
        successUrl = `${appUrl}/statement/${statementId}?session_id={CHECKOUT_SESSION_ID}`
        cancelUrl = `${appUrl}/statement`
      } else {
        // Report purchase
        successUrl = `${appUrl}/report/${shareToken}?session_id={CHECKOUT_SESSION_ID}`
        cancelUrl = `${appUrl}/report/${shareToken}`
      }
    } else if (statementId) {
      // Standalone statement purchase (no report)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
      successUrl = `${appUrl}/statement/${statementId}?session_id={CHECKOUT_SESSION_ID}`
      cancelUrl = `${appUrl}/statement`
    } else if (successPathBody === "/dashboard/billing") {
      // Subscription purchase
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
      successUrl = `${appUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`
      cancelUrl = `${appUrl}/dashboard/billing`
    } else {
      // Fallback
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
      successUrl = `${appUrl}/check?session_id={CHECKOUT_SESSION_ID}`
      cancelUrl = `${appUrl}/check`
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: mode ?? "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        reportId: reportId ?? "",
        statementId: statementId ?? "",
        priceId: priceId,
      },
    }

    if (userEmail) {
      const existing = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      })

      const existingCustomerId = existing.data[0]?.id

      if (existingCustomerId) {
        sessionParams.customer = existingCustomerId
      } else {
        sessionParams.customer_email = userEmail
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout" },
        { status: 500 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error("create-checkout error", e)
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 },
    )
  }
}

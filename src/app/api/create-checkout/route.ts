import { stripe } from "@/lib/stripe/client"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  priceId: z.string().min(1, "priceId must be a non-empty string"),
  reportId: z.string().optional(),
  email: z.email().optional(),
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

    const { priceId, reportId, email } = parsed.data

    let successUrl: string
    if (reportId) {
      const supabase = await createClient()
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .select("share_token")
        .eq("id", reportId)
        .single()

      if (reportError || !report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 })
      }

      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/report/${report.share_token}?session_id={CHECKOUT_SESSION_ID}`
    } else {
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/check?session_id={CHECKOUT_SESSION_ID}`
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/check`,
      customer_email: email ?? undefined,
      metadata: { reportId: reportId ?? "" },
    })

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

import { stripe } from "@/lib/stripe/client"
import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  email: z.email(),
})

export async function POST(request: Request) {
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

  const { email } = parsed.data

  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  const customerId = customers.data[0]?.id
  if (!customerId) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    )
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}

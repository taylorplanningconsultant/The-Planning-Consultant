import { sendEmail } from "@/lib/email"
import { welcomeEmail } from "@/lib/email/templates/welcome"
import { NextResponse } from "next/server"
import { z } from "zod"

const welcomeSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name } = welcomeSchema.parse(body)
    const { subject, html } = welcomeEmail(name)

    await sendEmail(email, subject, html)

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 })
  }
}

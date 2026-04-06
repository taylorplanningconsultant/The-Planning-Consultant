import { redirect } from "next/navigation"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstString(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value
  if (Array.isArray(value) && value[0]) return value[0]
  return undefined
}

export default async function SignupPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const params = new URLSearchParams()
  params.set("view", "signup")

  const plan = firstString(sp.plan)
  if (plan) params.set("plan", plan)

  const next = firstString(sp.next)
  if (next) params.set("next", next)

  redirect(`/login?${params.toString()}`)
}

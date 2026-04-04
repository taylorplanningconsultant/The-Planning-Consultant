"use client"

import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Footer } from "@/components/layout/Footer"
import { NavClient } from "@/components/layout/NavClient"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { TablesUpdate } from "@/types/database"
import { cn } from "@/utils/cn"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { z } from "zod"

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"

const profileUpdateSchema = z.object({
  full_name: z.string().max(200).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
})

function formatMemberSince(dateString: string | null): string {
  if (!dateString) return "N/A"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

function avatarInitial(fullName: string | null, email: string | null): string {
  const name = fullName?.trim()
  if (name && name.length > 0) {
    return name[0]!.toUpperCase()
  }
  const e = email?.trim()
  if (e && e.length > 0) {
    return e[0]!.toUpperCase()
  }
  return "?"
}

type ProfileRow = {
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: string | null
}

export default function AccountPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading")
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionEmail, setSessionEmail] = useState<string>("")
  const [navUser, setNavUser] = useState<User | null>(null)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<"invalid" | "update" | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (!session) {
        router.replace("/login")
        return
      }

      setNavUser(session.user)
      setSessionEmail(session.user.email ?? "")
      setUserId(session.user.id)

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone, created_at")
        .eq("id", session.user.id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setLoadState("error")
        return
      }

      setProfile(data as ProfileRow)
      setFullName(data?.full_name?.trim() ?? "")
      setPhone(data?.phone?.trim() ?? "")
      setLoadState("ready")
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [router, supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userId) return

    setSaveSuccess(false)
    setSaveError(null)

    const fullNameTrimmed = fullName.trim()
    const phoneTrimmed = phone.trim()

    const parsed = profileUpdateSchema.safeParse({
      full_name: fullNameTrimmed === "" ? null : fullNameTrimmed,
      phone: phoneTrimmed === "" ? null : phoneTrimmed,
    })

    if (!parsed.success) {
      setSaveError("invalid")
      return
    }

    setSaving(true)

    const patch: TablesUpdate<"profiles"> = {
      full_name: parsed.data.full_name ?? null,
      phone: parsed.data.phone ?? null,
    }

    const { error } = await supabase.from("profiles").update(patch).eq("id", userId)

    setSaving(false)

    if (error) {
      setSaveError("update")
      return
    }

    setSaveSuccess(true)
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            full_name: patch.full_name ?? null,
            phone: patch.phone ?? null,
          }
        : prev,
    )
    router.refresh()
  }

  const displayName =
    profile?.full_name?.trim() || profile?.email?.trim() || sessionEmail || "Member"
  const displayEmail = profile?.email?.trim() || sessionEmail || ""

  return (
    <>
      <NavClient user={navUser} />
      <DashboardShell
        title="Account"
        subtitle="Profile and sign-in preferences"
        illustration="/illustrations/filing.svg"
      >
        {loadState === "loading" ? (
          <div className="rounded-2xl border border-border bg-secondary/50 px-6 py-16 text-center">
            <p className="text-muted-foreground text-sm">Loading your account…</p>
          </div>
        ) : loadState === "error" ? (
          <div className="rounded-2xl border border-[#F5C6C6] bg-[#FDECEA] p-6">
            <p className="text-sm text-[#991818]">Could not load your profile. Please refresh.</p>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-10">
            {/* Profile summary */}
            <section className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
              <div className="border-b border-border bg-secondary/40 px-6 py-5 md:px-8">
                <p className="text-[#18A056] mb-1 text-xs font-bold uppercase tracking-widest">
                  Profile
                </p>
                <h2 className="text-foreground text-lg font-semibold tracking-tight">
                  Your identity on MyPlanningGuide
                </h2>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start">
                  <div
                    className="bg-brand-dark flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl shadow-md"
                    aria-hidden
                  >
                    <span className="text-3xl font-bold text-white">
                      {avatarInitial(profile?.full_name ?? null, profile?.email ?? null)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-foreground truncate text-xl font-bold tracking-tight">
                      {displayName}
                    </p>
                    <p className="text-muted-foreground truncate text-sm">{displayEmail || "—"}</p>
                    <p className="text-muted-brand pt-2 text-xs">
                      Member since{" "}
                      <span className="text-muted-foreground font-medium">
                        {formatMemberSince(profile?.created_at ?? null)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center md:hidden">
                  <img
                    src="/illustrations/building.svg"
                    alt=""
                    className="h-auto w-36 opacity-85"
                    width={144}
                    height={120}
                  />
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="border border-[#C8D4CA] text-[#4A5C50] hover:bg-[#F0F4F1] inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:w-auto"
                  >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                    Sign out
                  </button>
                </div>
              </div>
            </section>

            {/* Editable profile */}
            <section className="rounded-2xl border border-border bg-background p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <p className="text-[#18A056] mb-2 text-xs font-bold uppercase tracking-widest">
                  Details
                </p>
                <h2 className="text-foreground text-lg font-semibold tracking-tight">
                  Contact information
                </h2>
                <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                  Update how we address you and reach you for report notifications. Changes apply
                  immediately to your dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="full_name" className="text-foreground text-sm font-medium">
                    Full name
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClassName}
                    placeholder="Your name"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-foreground text-sm font-medium">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClassName}
                    placeholder="Optional"
                  />
                </div>

                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-foreground text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={displayEmail}
                      readOnly
                      disabled
                      className={cn(
                        inputClassName,
                        "cursor-not-allowed bg-secondary opacity-70",
                      )}
                    />
                  </div>
                  <p className="text-muted-brand mt-3 text-xs leading-relaxed">
                    Email is tied to your sign-in and cannot be changed here. To use a different
                    address, add it in your identity provider or contact support and we can help
                    migrate your account.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>

                  {saveSuccess ? (
                    <p className="text-sm text-[#0F7040]" role="status">
                      Profile updated
                    </p>
                  ) : null}

                  {saveError === "update" ? (
                    <p className="text-sm text-[#991818]">Something went wrong. Please try again.</p>
                  ) : null}

                  {saveError === "invalid" ? (
                    <p className="text-sm text-[#991818]">Please check your input and try again.</p>
                  ) : null}
                </div>
              </form>
            </section>

            {/* Danger zone */}
            <section className="rounded-2xl border border-[#F5C6C6] bg-[#FDECEA]/35 p-6 md:p-8">
              <p className="text-danger mb-2 text-xs font-bold uppercase tracking-widest">
                Danger zone
              </p>
              <h2 className="text-foreground text-lg font-semibold tracking-tight">
                Delete account
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                Permanently remove your profile, saved reports, and billing associations. This
                action cannot be undone.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="rounded-lg border border-[#E8B4B4] bg-background px-4 py-2.5 text-sm font-semibold text-[#991818] opacity-60 shadow-sm"
                  disabled
                  aria-disabled
                >
                  Delete account
                </button>
                <p className="text-muted-brand mt-3 text-xs">Account deletion is not available yet.</p>
              </div>
            </section>
          </div>
        )}
      </DashboardShell>
      <Footer />
    </>
  )
}

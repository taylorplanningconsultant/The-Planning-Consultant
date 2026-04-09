"use client"

import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Check, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, Suspense, useState } from "react"

type AuthView = "signin" | "signup" | "forgot"

function redirectAfterLogin(
  next: string,
  router: { push: (href: string) => void },
) {
  if (next.startsWith("/") && !next.startsWith("//")) {
    router.push(next)
    return
  }
  try {
    const u = new URL(next)
    if (u.origin === window.location.origin) {
      router.push(u.pathname + u.search + u.hash)
      return
    }
  } catch {
    // ignore invalid URL
  }
  router.push("/dashboard")
}

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"

const primaryCtaClassName =
  "inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan")
  const rawNext = searchParams.get("next")
  const nextFromUrl = rawNext === "/pricing" ? "/dashboard/billing" : rawNext
  const next = nextFromUrl ?? (plan ? "/dashboard/billing" : "/dashboard")
  const supabase = createClient()

  const initialView: AuthView =
    searchParams.get("view") === "signup" ? "signup" : "signin"
  const [view, setView] = useState<AuthView>(initialView)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message || "Unable to sign in. Please try again.")
      return
    }

    redirectAfterLogin(next, router)
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match")
      return
    }

    setIsSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          phone: phone || null,
        },
      },
    })

    setIsSubmitting(false)
    console.log("signup result", {
      session: data.session,
      user: data.user?.email,
      confirmed: data.user?.email_confirmed_at,
    })

    if (data.user && data.user.identities?.length === 0) {
      setErrorMessage("An account with this email already exists. Please sign in instead.")
      setView("signin")
      return
    }

    if (error) {
      setErrorMessage(error.message || "Unable to create your account. Please try again.")
      return
    }

    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          terms_accepted_at: new Date().toISOString(),
        })
        .eq("id", data.user.id)
    }

    if (data.session === null) {
      setSuccessMessage("Check your email to confirm your account before signing in.")
      return
    }

    redirectAfterLogin(next, router)
  }

  async function handleMagicLinkSignIn() {
    setErrorMessage("")
    setSuccessMessage("")

    if (!email.trim()) {
      setErrorMessage("Enter your email first.")
      return
    }

    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback?next=/dashboard",
      },
    })
    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message || "Unable to send magic link. Please try again.")
      return
    }

    setSuccessMessage("Magic link sent — check your email")
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")
    setIsSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: window.location.origin + "/auth/reset-password",
    })
    if (error) {
      setErrorMessage(error.message)
    } else {
      setResetSent(true)
    }
    setIsSubmitting(false)
  }

  async function handleGoogleSignIn() {
    setErrorMessage("")
    setSuccessMessage("")
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin +
          "/auth/callback?next=" +
          encodeURIComponent(next),
      },
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message || "Unable to continue with Google. Please try again.")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        <section className="relative hidden bg-brand-dark dot-bg dot-bg-on-dark text-white md:block">
          <Link
            href="/"
            className="absolute left-8 top-8 inline-flex items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="relative mx-auto flex h-full w-full max-w-xl flex-col justify-center px-10 py-16 lg:px-14">
            <h1 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
              Your planning journey starts here
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">
              Instant constraint checks, AI-powered reports, and everything you need before you
              apply.
            </p>
            <Image
              src="/illustrations/report.svg"
              alt="Planning report illustration"
              width={320}
              height={280}
              className="mt-8 h-auto w-full max-w-xs opacity-90"
            />

            <ul className="mt-10 space-y-4">
              <li className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3.5 w-3.5 text-accent" />
                </span>
                <span>Free constraint check for any UK postcode</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3.5 w-3.5 text-accent" />
                </span>
                <span>AI planning report tailored to your project</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3.5 w-3.5 text-accent" />
                </span>
                <span>Saved reports and planning history</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-background">
          <div className="flex min-h-screen items-center justify-center px-8">
            <div className="w-full max-w-[400px]">
              <div className="mb-8 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M3 8L8 3L13 8"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 13V8.5L8 5.5L11 8.5V13"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-lg font-bold text-foreground">The Planning Consultant</span>
              </div>

              {view === "forgot" ? (
                <>
                  <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
                    Reset your password
                  </h1>
                  {resetSent ? (
                    <div className="mb-6 flex flex-col gap-4">
                      <p className="text-xs font-medium text-[#0F7040]" role="status">
                        Check your email for a reset link.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setView("signin")
                          setResetSent(false)
                          setResetEmail("")
                          setErrorMessage("")
                          setSuccessMessage("")
                        }}
                        className={primaryCtaClassName}
                      >
                        Back to sign in
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="mb-6 text-sm text-muted-foreground">
                        We&apos;ll send a reset link to your email.
                      </p>
                      <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                            Email
                          </label>
                          <input
                            id="reset-email"
                            type="email"
                            autoComplete="email"
                            required
                            value={resetEmail}
                            onChange={(event) => setResetEmail(event.target.value)}
                            className={inputClassName}
                            placeholder="you@example.com"
                          />
                        </div>

                        <button
                          type="submit"
                          className={`${primaryCtaClassName} mt-2`}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Sending..." : "Send reset link"}
                        </button>
                      </form>

                      <p className="mt-4 text-center text-sm text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => {
                            setView("signin")
                            setErrorMessage("")
                            setSuccessMessage("")
                          }}
                          className="font-medium text-primary transition-opacity hover:opacity-90"
                        >
                          Back to sign in
                        </button>
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
                    {view === "signin" ? "Sign in" : "Create account"}
                  </h1>
                  <p className="mb-6 text-sm text-muted-foreground">
                    {view === "signin"
                      ? "Welcome back. Enter your details below."
                      : "Create your free account in seconds."}
                  </p>

                  <div className="mb-6 flex rounded-lg bg-secondary p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setView("signin")
                        setErrorMessage("")
                        setSuccessMessage("")
                      }}
                      className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                        view === "signin"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setView("signup")
                        setErrorMessage("")
                        setSuccessMessage("")
                      }}
                      className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                        view === "signup"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Create account
                    </button>
                  </div>

                  <div className="mb-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </button>

                    {view === "signin" ? (
                      <button
                        type="button"
                        onClick={handleMagicLinkSignIn}
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Mail className="h-4 w-4" />
                        Sign in with email link
                      </button>
                    ) : null}
                  </div>

                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-brand">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {view === "signin" ? (
                    <form onSubmit={handleSignIn} className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="signin-email" className="text-sm font-medium text-foreground">
                          Email
                        </label>
                        <input
                          id="signin-email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className={inputClassName}
                          placeholder="you@example.com"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label htmlFor="signin-password" className="text-sm font-medium text-foreground">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setView("forgot")
                              setResetSent(false)
                              setErrorMessage("")
                              setSuccessMessage("")
                            }}
                            className="text-sm font-medium text-primary transition-opacity hover:opacity-90"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <input
                          id="signin-password"
                          type="password"
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className={inputClassName}
                          placeholder="Enter your password"
                        />
                      </div>

                      <button type="submit" className={`${primaryCtaClassName} mt-2`} disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Sign in"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignUp} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-name" className="text-sm font-medium text-foreground">
                      Full name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className={inputClassName}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={inputClassName}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-phone" className="text-sm font-medium text-foreground">
                      Phone (optional)
                    </label>
                    <input
                      id="signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+44 7700 900000"
                      className={inputClassName}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={inputClassName}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-confirm-password" className="text-sm font-medium text-foreground">
                      Confirm password
                    </label>
                    <input
                      id="signup-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Confirm your password"
                      className={inputClassName}
                    />
                  </div>

                  <button type="submit" className={`${primaryCtaClassName} mt-2`} disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Create account"}
                  </button>
                  <p className="text-xs text-muted-brand text-center mt-3 leading-relaxed">
                    By creating an account you agree to our{" "}
                    <Link href="/terms" className="underline hover:text-foreground">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                    </form>
                  )}
                </>
              )}

              {errorMessage ? (
                <p className="mt-2 text-xs font-medium text-danger" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <p className="mt-2 text-xs font-medium text-[#0F7040]" role="status">
                  {successMessage}
                </p>
              ) : null}

              {view === "signin" || view === "signup" ? (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {view === "signin" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setView("signup")
                          setErrorMessage("")
                          setSuccessMessage("")
                        }}
                        className="font-medium text-primary transition-opacity hover:opacity-90"
                      >
                        Create one
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setView("signin")
                          setErrorMessage("")
                          setSuccessMessage("")
                        }}
                        className="font-medium text-primary transition-opacity hover:opacity-90"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}

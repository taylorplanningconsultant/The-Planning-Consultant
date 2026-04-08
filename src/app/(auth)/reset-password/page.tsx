import { ArrowLeft, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { ResetPasswordForm } from "./ResetPasswordForm"

export default function ResetPasswordPage() {
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
              Set your new password securely
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">
              You are one step away from getting back into your dashboard.
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
                <span>Secure password reset with your email link</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3.5 w-3.5 text-accent" />
                </span>
                <span>Continue straight to your dashboard after update</span>
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
                <span className="text-lg font-bold text-foreground">MyPlanningGuide</span>
              </div>

              <ResetPasswordForm />

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Remembered your password?{" "}
                <Link href="/login" className="font-medium text-primary transition-opacity hover:opacity-90">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

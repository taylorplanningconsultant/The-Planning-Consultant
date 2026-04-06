import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy",
}

export default function CookiesPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <header className="bg-brand-dark dot-bg dot-bg-on-dark pt-24 pb-10">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Cookie Policy
            </h1>
            <p className="mt-3 text-base text-white/70">Last updated: April 2026</p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-12 px-6 py-12 md:px-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              What are cookies
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Cookies are small text files that websites save on your device when
              you visit. They help the site remember who you are, keep you signed
              in securely, and (if you agree) tell us how people use the service
              so we can improve it.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Essential cookies (always active)
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Authentication session cookie</li>
              <li>Security tokens</li>
              <li>
                Cannot be disabled — required for the service to function
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Analytics cookies (with consent)
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Usage analytics to improve the service</li>
              <li>No advertising or tracking cookies</li>
              <li>
                Only active if you accept via our cookie banner
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              How to manage cookies
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Use our cookie banner to accept or decline</li>
              <li>Use your browser settings to clear cookies</li>
              <li>
                Declining analytics won&apos;t affect your ability to use the
                service
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Contact
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              <a
                className="text-primary underline underline-offset-4 hover:opacity-90"
                href="mailto:hello@theplanningconsultant.com"
              >
                hello@theplanningconsultant.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

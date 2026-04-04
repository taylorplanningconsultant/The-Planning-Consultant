import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | The Planning Consultant",
  description:
    "How The Planning Consultant LTD collects, uses, and protects your data when you use MYplanningconsultant and MYplanningguide.",
}

export default function PrivacyPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <header className="bg-brand-dark dot-bg pt-24 pb-10">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-base text-white/70">Last updated: April 2026</p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-12 px-6 py-12 md:px-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Who we are
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              This privacy policy applies to services operated for{" "}
              <span className="font-medium text-foreground">
                TheplanningConsultant.com
              </span>
              .
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Company:</span> The
              Planning Consultant LTD
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Products:</span>{" "}
              MYplanningconsultant and MYplanningguide
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Contact:</span>{" "}
              <a
                className="text-primary underline underline-offset-4 hover:opacity-90"
                href="mailto:hello@theplanningconsultant.com"
              >
                hello@theplanningconsultant.com
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              What data we collect
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We may collect the following types of information:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Email address (when unlocking reports)</li>
              <li>Phone number (optional, when creating an account)</li>
              <li>
                Payment information (processed by Stripe; we never store card
                details)
              </li>
              <li>Planning search data (postcodes, addresses)</li>
              <li>Usage data (pages visited, features used)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              How we use your data
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We use your information to:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Provide planning constraint reports</li>
              <li>Send your report results</li>
              <li>Improve our service</li>
              <li>
                With your consent, connect you with local planning professionals
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Data sharing
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We may share data with the following categories of processors and
              partners, only as needed to run the service:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Stripe (payment processing)</li>
              <li>Supabase (secure data storage)</li>
              <li>
                Anthropic (AI report generation — no personal data is sent; only
                planning data)
              </li>
            </ul>
            <p className="text-base leading-relaxed text-muted-foreground">
              We never sell your data to third parties. With your explicit
              consent, we may share your contact details with RTPI-accredited
              planning professionals in your area.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Your rights under GDPR
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Depending on your location and applicable law, you may have rights
              including:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Right to access your data</li>
              <li>Right to deletion</li>
              <li>Right to correction</li>
              <li>Right to withdraw consent</li>
            </ul>
            <p className="text-base leading-relaxed text-muted-foreground">
              To exercise these rights, contact us at{" "}
              <a
                className="text-primary underline underline-offset-4 hover:opacity-90"
                href="mailto:hello@theplanningconsultant.com"
              >
                hello@theplanningconsultant.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Cookies
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Essential cookies only for authentication</li>
              <li>Analytics cookies, where used, only with your consent</li>
              <li>No advertising cookies</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Data retention
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Report data retained for 2 years</li>
              <li>Account data retained while your account is active</li>
              <li>
                Payment records retained for 7 years (legal requirement)
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Contact us
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              <a
                className="text-primary underline underline-offset-4 hover:opacity-90"
                href="mailto:hello@theplanningconsultant.com"
              >
                hello@theplanningconsultant.com
              </a>
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              The Planning Consultant LTD, Wigan, UK
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

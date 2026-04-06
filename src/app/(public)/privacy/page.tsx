import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <header className="bg-brand-dark dot-bg dot-bg-on-dark pt-24 pb-10">
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
              <span className="font-medium text-foreground">
                Eden Technologies Ltd
              </span>
              , trading as{" "}
              <span className="font-medium text-foreground">
                The Planning Consultant
              </span>
              .
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
            <p className="text-base leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                ICO registration:
              </span>{" "}
              To be added when registered.
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
              <li>Email address (when unlocking free report)</li>
              <li>Name and phone number (optional, on account creation)</li>
              <li>
                Payment information (processed by Stripe — we never store card
                details)
              </li>
              <li>Planning search data (postcodes, constraint results)</li>
              <li>AI report and statement content you generate</li>
              <li>Usage data (pages visited, credits used)</li>
              <li>Device and browser information (analytics)</li>
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
              <li>Provide constraint checks and generate reports</li>
              <li>Process payments via Stripe</li>
              <li>Send transactional emails about your reports</li>
              <li>Send planning guidance emails (with consent)</li>
              <li>Improve our AI models and service quality</li>
              <li>
                With explicit consent: to connect you with local planning
                professionals
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Legal basis for processing (GDPR)
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Contract:</span>{" "}
                processing necessary to deliver the service you paid for
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Legitimate interests:
                </span>{" "}
                fraud prevention, service improvement
              </li>
              <li>
                <span className="font-medium text-foreground">Consent:</span>{" "}
                marketing emails, lead marketplace
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
              <li>
                <span className="font-medium text-foreground">Stripe:</span>{" "}
                payment processing
              </li>
              <li>
                <span className="font-medium text-foreground">Supabase:</span>{" "}
                secure encrypted data storage
              </li>
              <li>
                <span className="font-medium text-foreground">Anthropic:</span>{" "}
                AI generation (planning data only — no personal data sent)
              </li>
              <li>
                <span className="font-medium text-foreground">Resend:</span>{" "}
                transactional email delivery
              </li>
            </ul>
            <p className="text-base leading-relaxed text-muted-foreground">
              We never sell your personal data.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Lead marketplace:
              </span>{" "}
              only with explicit opt-in consent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Your rights under UK GDPR
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Right to access your data</li>
              <li>Right to erasure (delete your account)</li>
              <li>Right to rectification</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent</li>
              <li>Right to object to processing</li>
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
            <p className="text-base leading-relaxed text-muted-foreground">
              You have the right to complain to the ICO:{" "}
              <a
                className="text-primary underline underline-offset-4 hover:opacity-90"
                href="https://ico.org.uk"
                rel="noopener noreferrer"
                target="_blank"
              >
                ico.org.uk
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Cookies
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Essential:</span>{" "}
                authentication and security
              </li>
              <li>
                <span className="font-medium text-foreground">Analytics:</span>{" "}
                with your consent via cookie banner
              </li>
              <li>No advertising or tracking cookies</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Data retention
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Report and statement data:
                </span>{" "}
                2 years
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Account data:
                </span>{" "}
                retained while account active, deleted within 30 days of account
                deletion
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Payment records:
                </span>{" "}
                7 years (legal requirement)
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Free check data (no account):
                </span>{" "}
                90 days
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Credit system and billing
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Credit balances are stored securely</li>
              <li>Subscription credits allocated monthly</li>
              <li>Top-up credits expire after 12 months</li>
              <li>No refunds on used credits</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Children
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Our service is not intended for under 18s. We do not knowingly
              collect data from children.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Changes to this policy
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We will notify you of material changes by email. Continued use
              constitutes acceptance.
            </p>
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
              Eden Technologies Ltd, Golborne, UK
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

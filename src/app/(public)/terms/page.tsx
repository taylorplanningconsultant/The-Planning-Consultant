import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | The Planning Consultant",
  description:
    "Terms of service for MYplanningconsultant and MYplanningguide, operated by The Planning Consultant LTD.",
}

export default function TermsPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <header className="bg-brand-dark dot-bg pt-24 pb-10">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-base text-white/70">Last updated: April 2026</p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-12 px-6 py-12 md:px-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Acceptance of terms
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              By using MYplanningconsultant or MYplanningguide you agree to these
              terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              What we provide
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Planning constraint information service</li>
              <li>AI-generated planning assessments</li>
              <li>PDF reports for guidance purposes only</li>
              <li>Not a substitute for professional planning advice</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Important limitations
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Our reports are for guidance only</li>
              <li>We do not guarantee planning permission outcomes</li>
              <li>
                Always consult an RTPI-accredited planning consultant before
                submitting applications
              </li>
              <li>
                Data is sourced from government APIs and may not reflect very
                recent changes
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Payment terms
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>
                One-off report payments are non-refundable once the AI report has
                been generated
              </li>
              <li>Subscription plans can be cancelled anytime</li>
              <li>No refunds on partial subscription periods</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Acceptable use
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Personal and commercial use permitted</li>
              <li>No automated scraping or bulk downloading</li>
              <li>No reselling of reports without permission</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Intellectual property
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Report content is licensed to you personally</li>
              <li>
                MYplanningconsultant and MYplanningguide branding and platform
                belong to The Planning Consultant LTD
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Liability
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>
                We are not liable for planning decisions made based on our
                reports
              </li>
              <li>Maximum liability limited to the amount paid</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Governing law
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>English law applies</li>
              <li>Disputes resolved in English courts</li>
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

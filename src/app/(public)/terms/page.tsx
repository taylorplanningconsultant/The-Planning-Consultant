import { Footer } from "@/components/layout/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
}

export default function TermsPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <header className="bg-brand-dark dot-bg dot-bg-on-dark pt-24 pb-10">
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
              By using{" "}
              <span className="font-medium text-foreground">
                The Planning Consultant
              </span>{" "}
              you agree to these terms. If you do not agree, do not use the
              service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              What we provide
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Planning constraint checking tool</li>
              <li>AI-generated planning reports (guidance only)</li>
              <li>AI-generated planning statement drafts</li>
              <li>These are DRAFT documents for guidance only</li>
              <li>NOT a substitute for professional advice</li>
              <li>NOT legal advice</li>
              <li>NOT a guarantee of planning outcomes</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Important disclaimer
            </h2>
            <div className="rounded-2xl border-2 border-primary bg-brand-light p-6 shadow-sm md:p-8">
              <p className="text-base font-semibold leading-relaxed text-brand-dark">
                THE PLANNING CONSULTANT IS A GUIDANCE TOOL ONLY. Our reports and
                statements are AI-generated drafts based on publicly available
                planning data. They do not constitute professional planning
                advice, legal advice, or architectural advice. Planning decisions
                are made by Local Planning Authorities and we have no influence
                over outcomes. Always consult an RTPI-accredited planning
                consultant before submitting any planning application. Eden
                Technologies Ltd accepts no liability for any planning
                decisions, costs, or losses arising from use of this service.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Credit system
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Credits are purchased via subscription or top-up</li>
              <li>1 AI Report = 1 credit</li>
              <li>1 Planning Statement = 3 credits</li>
              <li>Subscription credits allocated monthly</li>
              <li>
                Subscription credits roll over up to 2x monthly allowance
              </li>
              <li>Top-up credits expire after 12 months</li>
              <li>Top-up credits available to subscribers only</li>
              <li>Credits have no cash value and cannot be refunded</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Refund policy
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Constraint checks: free, no refund needed</li>
              <li>AI Reports: no refund once generated</li>
              <li>Planning Statements: no refund once generated</li>
              <li>
                Subscriptions: cancel anytime, no partial refunds, access
                continues until period end
              </li>
              <li>
                Exception: if generation fails completely (empty output)
                contact us for a full refund
              </li>
              <li>Top-up credits: no refund once purchased</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              No free trial
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>We do not offer free trials</li>
              <li>The free constraint check is our free tier</li>
              <li>Paid features require payment or credits</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Acceptable use
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>Personal and commercial use permitted</li>
              <li>No automated scraping or bulk API calls</li>
              <li>No reselling reports without written permission</li>
              <li>No submitting false information</li>
              <li>
                No attempting to circumvent rate limits or payment requirements
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Intellectual property
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>
                Report content is licensed to you for personal and commercial use
              </li>
              <li>
                The Planning Consultant brand and platform belongs to Eden
                Technologies Ltd
              </li>
              <li>You retain ownership of information you provide</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Limitation of liability
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
              <li>
                Maximum liability limited to amount paid in the 3 months
                preceding any claim
              </li>
              <li>Not liable for planning decisions or outcomes</li>
              <li>Not liable for third party professional advice</li>
              <li>Not liable for changes to planning policy</li>
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
              Changes to terms
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We will notify you of material changes by email. Continued use
              constitutes acceptance.
            </p>
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
              Eden Technologies Ltd, Golborne, UK
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

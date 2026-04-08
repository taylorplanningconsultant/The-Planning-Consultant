import { Footer } from "@/components/layout/Footer"
import { Nav } from "@/components/layout/Nav"

import { ForgotPasswordForm } from "./ForgotPasswordForm"

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-sm md:p-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}

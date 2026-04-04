import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import Link from "next/link";

const primaryCtaClassName =
  "inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <img
            src="/illustrations/house_searching.svg"
            alt=""
            className="mx-auto mb-8 h-auto w-48 opacity-70"
          />
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">
            404 — Page not found
          </p>
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            We couldn&apos;t find that page
          </h1>
          <p className="mx-auto mb-8 max-w-md text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Try checking a planning constraint instead.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/" className={primaryCtaClassName}>
              Go home
            </Link>
            <Link
              href="/check"
              className="rounded-lg border border-border px-6 py-3 font-medium text-foreground hover:bg-secondary"
            >
              Run a check
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

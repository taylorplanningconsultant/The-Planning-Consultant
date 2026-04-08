import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-foreground px-7 pb-9 pt-[60px]">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-7 grid grid-cols-1 gap-12 border-b border-white/[0.08] pb-11 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="mb-2.5 text-[17px] font-bold tracking-tight text-white">
              The Planning Consultant
            </p>
            <p className="mb-[22px] max-w-[240px] text-[13px] leading-relaxed text-white/[0.38]">
              AI-powered planning guidance for homeowners, architects, and
              developers across the UK.
            </p>
            <div className="flex gap-3.5">
              <a
                href="#"
                className="text-[12.5px] text-white/[0.3] transition-colors hover:text-white/70"
              >
                Twitter / X
              </a>
              <a
                href="#"
                className="text-[12.5px] text-white/[0.3] transition-colors hover:text-white/70"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <div>
            <p className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/[0.28]">
              Product
            </p>
            <ul className="flex list-none flex-col gap-2.5">
              <li>
                <Link
                  href="/check"
                  className="text-[13.5px] font-normal text-white/50 no-underline transition-colors hover:text-white/90"
                >
                  Constraint checker
                </Link>
              </li>
              <li>
                <Link
                  href="/statement"
                  className="text-[13.5px] font-normal text-white/50 no-underline transition-colors hover:text-white/90"
                >
                  Statement generator
                </Link>
              </li>
              <li>
                <Link
                  href="/#professional-pricing"
                  className="text-[13.5px] font-normal text-white/50 no-underline transition-colors hover:text-white/90"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-[13.5px] font-normal text-white/50 no-underline transition-colors hover:text-white/90"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/[0.28]">
              Resources
            </p>
            <ul className="flex list-none flex-col gap-2.5">
              <li>
                <Link
                  href="/check"
                  className="text-[13.5px] font-normal text-white/50 no-underline transition-colors hover:text-white/90"
                >
                  Constraint checker
                </Link>
              </li>
              <li>
                <Link
                  href="/statement"
                  className="text-[13.5px] font-normal text-white/50 no-underline transition-colors hover:text-white/90"
                >
                  Statement generator
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-[13.5px] font-normal text-white/50 no-underline transition-colors hover:text-white/90"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/[0.28]">
              Company
            </p>
            <ul className="flex list-none flex-col gap-2.5">
              <li>
                <Link
                  href="/#professional-pricing"
                  className="text-[13.5px] font-normal text-white/50 no-underline transition-colors hover:text-white/90"
                >
                  For professionals
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-[12px] text-white/25">
            © 2026 The Planning Consultant.
            <br />
            All rights reserved.
          </span>
          <div className="flex gap-[22px]">
            <Link
              href="/privacy"
              className="text-[12px] text-white/25 no-underline transition-colors hover:text-white/60"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[12px] text-white/25 no-underline transition-colors hover:text-white/60"
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              className="text-[12px] text-white/25 no-underline transition-colors hover:text-white/60"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

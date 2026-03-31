"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";

const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/check", label: "Constraint checker" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#guides", label: "Guides" },
  { href: "/#professionals", label: "For professionals" },
] as const;

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-[58px] w-full border-b border-border transition-all duration-200",
        isScrolled
          ? "bg-background/95 backdrop-blur-lg"
          : "bg-background/85 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-[1180px] items-center justify-between px-7">
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline"
        >
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[7px] bg-brand-dark">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
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
          <span className="text-base font-bold tracking-tight text-foreground">
            MyPlanningGuide
          </span>
        </Link>

        <ul className="hidden list-none items-center gap-7 md:flex">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm font-normal text-muted-foreground transition-colors hover:text-foreground no-underline"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-md px-3.5 py-1.5 text-sm font-normal text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/check"
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-br from-primary to-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Check my postcode
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden
            >
              <path
                d="M2.5 6H9.5M7 3L9.5 6L7 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}

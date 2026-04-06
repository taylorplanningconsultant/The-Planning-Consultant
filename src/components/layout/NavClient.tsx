"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { cn } from "@/utils/cn";

const navLinks = [
  { href: "/check", label: "Constraint checker" },
  { href: "/statement", label: "Planning statement" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#guides", label: "Guides" },
  { href: "/#professionals", label: "For professionals" },
] as const;

const signInButtonClassName =
  "whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-normal text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

type NavClientProps = {
  user: User | null;
};

export function NavClient({ user }: NavClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-[58px] w-full border-b border-border transition-all duration-200",
        isScrolled
          ? "bg-background/95 backdrop-blur-lg"
          : "bg-background/85 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-full min-w-0 w-full max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-6 md:px-7">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5 no-underline"
          onClick={() => setMenuOpen(false)}
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
          <span className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
            The Planning Consultant
          </span>
        </Link>

        <ul className="hidden list-none items-center gap-6 lg:gap-7 md:flex">
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

        <div className="hidden items-center gap-2 sm:gap-2.5 md:flex">
          {user ? (
            <Link href="/dashboard" className={signInButtonClassName}>
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className={signInButtonClassName}>
              Sign in
            </Link>
          )}
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

        <div className="flex items-center gap-1.5 md:hidden">
          <Link
            href="/check"
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-br from-primary to-accent px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Check
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
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-secondary"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M4 6h12M4 10h12M4 14h12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[58px] z-40 bg-foreground/20 backdrop-blur-[2px] md:hidden"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id={menuId}
            className="absolute left-0 right-0 top-full z-50 max-h-[min(70vh,calc(100dvh-58px))] overflow-y-auto border-b border-border bg-background shadow-lg md:hidden"
          >
            <ul className="flex list-none flex-col gap-0 px-4 py-3">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-foreground no-underline transition-colors hover:bg-secondary"
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-4 py-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="mb-3 block w-full rounded-lg border border-border py-3 text-center text-base font-medium text-muted-foreground no-underline transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="mb-3 block w-full rounded-lg border border-border py-3 text-center text-base font-medium text-muted-foreground no-underline transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}
              <Link
                href="/check"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-accent py-3 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                onClick={() => setMenuOpen(false)}
              >
                Check my postcode
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M2.5 7H11.5M8 4L11.5 7L8 10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </nav>
  );
}

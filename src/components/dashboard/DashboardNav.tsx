"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/utils/cn";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/account", label: "Account" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      className="bg-background border-b border-border"
      aria-label="Dashboard"
    >
      <div className="max-w-5xl mx-auto px-6 md:px-8 flex items-center gap-1 overflow-x-auto">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "py-3 px-4 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "text-foreground border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

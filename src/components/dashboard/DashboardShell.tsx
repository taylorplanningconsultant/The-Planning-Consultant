"use client";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const coreNavLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/statements", label: "Statements", icon: ScrollText },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
] as const;

const accountNav = {
  href: "/dashboard/account",
  labelDesktop: "Account",
  labelMobile: "Profile",
  iconDesktop: Settings,
  iconMobile: UserCircle,
} as const;

export type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  illustration?: string;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function DashboardShell({
  children,
  title,
  subtitle,
  illustration,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled || !session?.user) return;

      const u = session.user;
      const meta = u.user_metadata as { full_name?: string } | undefined;
      const name = meta?.full_name?.trim();
      setUserEmail(u.email ?? null);
      setUserName(name && name.length > 0 ? name : null);
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const displayLine =
    userName && userEmail
      ? { primary: userName, secondary: userEmail }
      : userEmail
        ? { primary: userEmail, secondary: null }
        : { primary: "Signed in", secondary: null };

  const AccountIconDesktop = accountNav.iconDesktop;
  const AccountIconMobile = accountNav.iconMobile;

  const sidebarNavLinkClass = (active: boolean) =>
    cn(
      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
        : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
    );

  return (
    <div>
      <header className="bg-brand-dark dot-bg dot-bg-on-dark pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">
                Dashboard
              </p>
              <h1 className="text-2xl font-bold text-white md:text-3xl">{title}</h1>
              {subtitle ? (
                <p className="mt-1 text-sm text-white/60">{subtitle}</p>
              ) : null}
            </div>
            {illustration ? (
              <div className="hidden justify-end md:flex">
                <img
                  src={illustration}
                  alt=""
                  className="h-auto w-40 opacity-80"
                  width={160}
                  height={160}
                />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 pb-28 md:pb-8 md:py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <aside className="hidden md:col-span-1 md:block">
            <div className="md:sticky md:top-24">
              <div className="flex flex-col rounded-2xl border border-border bg-background shadow-sm">
                <div className="p-2">
                  <p className="text-muted-brand px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider">
                    Workspace
                  </p>
                  <nav className="flex flex-col gap-0.5" aria-label="Dashboard sections">
                    {coreNavLinks.map((link) => {
                      const active = isActive(pathname, link.href);
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={sidebarNavLinkClass(active)}
                        >
                          {active ? (
                            <span
                              className="bg-accent absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full"
                              aria-hidden
                            />
                          ) : null}
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              active ? "text-primary" : "text-muted-brand group-hover:text-muted-foreground",
                            )}
                            aria-hidden
                          />
                          <span className="truncate">{link.label}</span>
                        </Link>
                      );
                    })}

                    <Link
                      href={accountNav.href}
                      className={sidebarNavLinkClass(isActive(pathname, accountNav.href))}
                    >
                      {isActive(pathname, accountNav.href) ? (
                        <span
                          className="bg-accent absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full"
                          aria-hidden
                        />
                      ) : null}
                      <AccountIconDesktop
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive(pathname, accountNav.href)
                            ? "text-primary"
                            : "text-muted-brand group-hover:text-muted-foreground",
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{accountNav.labelDesktop}</span>
                    </Link>
                  </nav>
                </div>

                <div className="border-t border-border px-3 pb-3 pt-1">
                  <Link
                    href="/check"
                    className="bg-gradient-to-br from-primary to-accent block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    Run new check
                  </Link>
                </div>

                <div className="border-t border-border bg-secondary/40 px-3 py-4">
                  <div className="mb-3 min-w-0 rounded-lg border border-border bg-background px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-foreground" title={displayLine.primary}>
                      {displayLine.primary}
                    </p>
                    {displayLine.secondary ? (
                      <p
                        className="text-muted-brand mt-0.5 truncate text-xs"
                        title={displayLine.secondary}
                      >
                        {displayLine.secondary}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div className="md:col-span-3">{children}</div>
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
        aria-label="Dashboard sections"
      >
        <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom,0)] pt-1">
          {coreNavLinks.map((link) => {
            const active = isActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 transition-colors",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
                <span className="max-w-full truncate px-0.5 text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
          <Link
            href={accountNav.href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 transition-colors",
              isActive(pathname, accountNav.href) ? "text-accent" : "text-muted-foreground",
            )}
          >
            <AccountIconMobile className="h-[22px] w-[22px] shrink-0" aria-hidden />
            <span className="max-w-full truncate px-0.5 text-[10px] font-medium">
              {accountNav.labelMobile}
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

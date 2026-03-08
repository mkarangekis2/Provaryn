"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Sparkles, Activity } from "lucide-react";
import { primaryNav, secondaryNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useSessionUser } from "@/lib/auth/use-session-user";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useSessionUser();

  const roleAwareSecondaryNav = useMemo(() => {
    const roles = user?.roles ?? [];
    const canCoach = roles.some((role) => role === "coach" || role === "program_admin" || role === "system_admin");
    const canAdmin = roles.some((role) => role === "program_admin" || role === "system_admin");

    const items = secondaryNav.filter((item) => (item.href === "/coach" ? canCoach : true));
    if (canAdmin) {
      items.push({ label: "Program Admin", href: "/admin" });
      items.push({ label: "Cohorts", href: "/admin/cohorts" });
    }
    return items;
  }, [user]);

  return (
    <div className="min-h-screen grid md:grid-cols-[270px_1fr]">
      <aside className="hidden md:flex flex-col border-r border-border bg-panel/80 backdrop-blur p-5 gap-8">
        <Link href="/home" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-gradient border border-border grid place-items-center"><ShieldCheck className="h-5 w-5 text-accent" /></div>
          <div>
            <p className="font-display text-lg">Valor Claims OS</p>
            <p className="text-xs text-muted">Readiness Intelligence</p>
          </div>
        </Link>

        <nav className="space-y-2">
          <p className="kicker mb-3">Primary</p>
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className={cn("flex items-center rounded-xl px-3 py-2.5 text-sm transition-colors", pathname === item.href ? "bg-accent text-black font-semibold" : "hover:bg-panel2 text-muted hover:text-text")}>
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="space-y-2">
          <p className="kicker mb-3">Secondary</p>
          {roleAwareSecondaryNav.map((item) => (
            <Link key={item.href} href={item.href} className={cn("flex items-center rounded-xl px-3 py-2.5 text-sm transition-colors", pathname === item.href ? "bg-panel2 text-text" : "hover:bg-panel2 text-muted hover:text-text")}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto card p-4">
          <p className="kicker">Transition Mode</p>
          <p className="mt-2 font-semibold">245 days until ETS</p>
          <div className="mt-3 h-2 rounded-full bg-panel2 overflow-hidden"><div className="h-full w-2/3 bg-accent" /></div>
          <p className="text-xs text-muted mt-2">Action completion 67%</p>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-bg/70 backdrop-blur px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-accent" />
            <p className="text-sm text-muted">Claim protection intelligence platform</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-ai/20 text-ai px-3 py-1"><Sparkles className="h-3 w-3" /> AI Active</span>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

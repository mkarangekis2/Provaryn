"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Sparkles, Activity, LogOut } from "lucide-react";
import { primaryNav, secondaryNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSessionUser } from "@/lib/auth/use-session-user";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type TransitionTask = { completed: boolean };
type TransitionPlan = { active: boolean; targetDate?: string; tasks: TransitionTask[] } | null;
type JourneyStage = "intake" | "baseline" | "action_queue" | "weekly_cadence" | "transition" | "claim_builder";
type JourneyStatus = {
  stage: JourneyStage;
  stageLabel: string;
  nextActions: Array<{ title: string; route: string }>;
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useSessionUser();
  const [loggingOut, setLoggingOut] = useState(false);
  const [transitionPlan, setTransitionPlan] = useState<TransitionPlan>(null);
  const [journey, setJourney] = useState<JourneyStatus | null>(null);

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

  const stageGatedPrimaryNav = useMemo(() => {
    const stage = journey?.stage ?? "intake";
    const allowedByStage: Record<JourneyStage, string[]> = {
      intake: ["/home"],
      baseline: ["/home", "/check-in"],
      action_queue: ["/home", "/action-queue", "/check-in", "/vault", "/conditions"],
      weekly_cadence: ["/home", "/action-queue", "/check-in", "/vault", "/conditions", "/claim-intelligence"],
      transition: ["/home", "/action-queue", "/check-in", "/vault", "/conditions", "/claim-intelligence", "/transition"],
      claim_builder: ["/home", "/action-queue", "/check-in", "/vault", "/conditions", "/claim-intelligence", "/transition", "/claim-builder"]
    };
    const allowed = allowedByStage[stage] ?? allowedByStage.intake;
    return primaryNav.filter((item) => allowed.includes(item.href));
  }, [journey?.stage]);

  useEffect(() => {
    async function loadTransitionPlan(userId: string) {
      const response = await fetch(`/api/transition/plan?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
      if (!response.ok) {
        setTransitionPlan(null);
        return;
      }
      const payload = (await response.json()) as { ok: boolean; plan: TransitionPlan };
      setTransitionPlan(payload.ok ? payload.plan : null);
    }

    if (user?.userId) {
      void loadTransitionPlan(user.userId);
    } else {
      setTransitionPlan(null);
    }
  }, [user?.userId]);

  useEffect(() => {
    async function loadJourney(userId: string) {
      const response = await fetch(`/api/journey/status?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
      if (!response.ok) {
        setJourney(null);
        return;
      }
      const payload = (await response.json()) as { ok: boolean; journey?: JourneyStatus };
      if (payload.ok && payload.journey) {
        setJourney(payload.journey);
      } else {
        setJourney(null);
      }
    }
    if (user?.userId) {
      void loadJourney(user.userId);
    } else {
      setJourney(null);
    }
  }, [user?.userId]);

  const transitionDaysLabel = useMemo(() => {
    const targetDate = transitionPlan?.targetDate;
    if (!targetDate) return "ETS date not set";
    const target = new Date(`${targetDate}T00:00:00`);
    if (Number.isNaN(target.getTime())) return "ETS date unavailable";
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.ceil((target.getTime() - now.getTime()) / msPerDay);
    if (days < 0) return `ETS passed ${Math.abs(days)}d ago`;
    return `${days} days until ETS`;
  }, [transitionPlan?.targetDate]);

  const transitionCompletion = useMemo(() => {
    const tasks = transitionPlan?.tasks ?? [];
    if (!tasks.length) return 0;
    const done = tasks.filter((task) => task.completed).length;
    return Math.round((done / tasks.length) * 100);
  }, [transitionPlan]);

  async function logout() {
    setLoggingOut(true);
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      window.location.assign("/login");
    } finally {
      setLoggingOut(false);
    }
  }

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
          {stageGatedPrimaryNav.map((item) => (
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
          <p className="kicker">Mission Stage</p>
          <p className="mt-2 font-semibold">{journey?.stageLabel ?? "Intake"}</p>
          <p className="text-xs text-muted mt-2">{journey?.nextActions?.[0]?.title ?? "Complete onboarding intake."}</p>
        </div>

        <div className="card p-4">
          <p className="kicker">Transition Mode</p>
          <p className="mt-2 font-semibold">{transitionPlan?.active ? transitionDaysLabel : "Not activated yet"}</p>
          <div className="mt-3 h-2 rounded-full bg-panel2 overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${transitionCompletion}%` }} />
          </div>
          <p className="text-xs text-muted mt-2">
            Action completion {transitionCompletion}%{transitionPlan ? ` (${transitionPlan.tasks.length} tasks)` : ""}
          </p>
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
            <Button size="sm" variant="ghost" onClick={() => void logout()} disabled={loggingOut}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              {loggingOut ? "Signing out..." : "Log Out"}
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

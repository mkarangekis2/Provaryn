"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";

export function OnboardingWelcomePanel() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Welcome</p>
        <h1 className="text-3xl font-display mt-2">Build Your Service Record</h1>
        <p className="text-sm text-muted mt-3">Complete the onboarding sequence to initialize career graph, exposure mapping, and condition intelligence.</p>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-xl">Onboarding Sequence</h2>
        <ol className="mt-4 space-y-2 text-sm text-muted list-decimal pl-5">
          <li>Service profile and rank/MOS identity.</li>
          <li>Timeline reconstruction with deployments, units, schools, and exposures.</li>
          <li>Exposure review and health baseline capture.</li>
          <li>Initial records import and reconstruction summary.</li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/onboarding/service-profile" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Service Profile</Link>
          <Link href="/onboarding/timeline" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Timeline</Link>
          <Link href="/onboarding/exposure-review" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Exposure Review</Link>
          <Link href="/onboarding/health-baseline" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Health Baseline</Link>
          <Link href="/onboarding/records" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Records</Link>
          <Link href="/onboarding/reconstruction" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Reconstruction</Link>
        </div>
      </Card>
    </div>
  );
}

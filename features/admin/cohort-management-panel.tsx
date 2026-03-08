"use client";

import { Card } from "@/components/ui/card";

export function CohortManagementPanel() {
  return (
    <Card className="p-6">
      <h1 className="text-3xl font-display">Program & Cohort Management</h1>
      <p className="text-sm text-muted mt-3">Invite management, permission scopes, and curriculum hooks are scaffolded for organization workflows.</p>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Invite tokens: pending implementation for organization directories.</li>
        <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Cohort tags: ready for DB-backed segmentation when org tables are connected.</li>
        <li className="rounded-lg border border-border bg-panel2/50 px-3 py-2">Progress tracking hooks: compatible with readiness and transition metrics APIs.</li>
      </ul>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Prefs = {
  weeklyCheckInReminder: boolean;
  transitionTaskReminder: boolean;
  evidenceGapReminder: boolean;
  coachUpdates: boolean;
  productAnnouncements: boolean;
  cadence: "daily" | "weekly" | "biweekly";
};

export function NotificationsPanel() {
  const [userId, setUserId] = useState("");
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const res = await fetch(`/api/settings/notifications?userId=${encodeURIComponent(id)}`);
    const payload = (await res.json()) as { preferences: Prefs };
    setPrefs(payload.preferences);
  }

  async function save() {
    if (!prefs) return;
    await fetch("/api/settings/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...prefs })
    });
  }

  if (!prefs) return <Card className="p-6">Loading preferences...</Card>;

  return (
    <Card className="p-6">
      <h1 className="text-3xl font-display">Notification Preferences</h1>
      <div className="mt-4 space-y-2 text-sm">
        {([
          ["weeklyCheckInReminder", "Weekly check-in reminder"],
          ["transitionTaskReminder", "Transition task reminder"],
          ["evidenceGapReminder", "Evidence gap reminder"],
          ["coachUpdates", "Coach updates"],
          ["productAnnouncements", "Product announcements"]
        ] as const).map(([key, label]) => (
          <label key={key} className="rounded-xl border border-border bg-panel2/50 px-4 py-3 flex items-center justify-between">
            <span>{label}</span>
            <input type="checkbox" checked={prefs[key]} onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })} />
          </label>
        ))}
        <select className="rounded-xl bg-panel2 border border-border px-3 py-2" value={prefs.cadence} onChange={(e) => setPrefs({ ...prefs, cadence: e.target.value as Prefs["cadence"] })}>
          <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option>
        </select>
      </div>
      <Button className="mt-4" onClick={save}>Save Preferences</Button>
    </Card>
  );
}

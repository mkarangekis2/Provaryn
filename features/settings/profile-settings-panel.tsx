"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Profile = {
  branch: string;
  component: string;
  rank: string;
  mos: string;
  yearsServed: number;
  currentStatus: string;
  etsDate?: string;
  dateJoined?: string;
};

export function ProfileSettingsPanel() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState("Loading profile...");

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const res = await fetch(`/api/settings/profile?userId=${encodeURIComponent(id)}`);
    const payload = (await res.json()) as { profile: Profile };
    setProfile(payload.profile);
    setStatus("Profile loaded.");
  }

  async function save() {
    if (!profile) return;
    setStatus("Saving profile...");
    await fetch("/api/settings/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...profile })
    });
    setStatus("Profile saved.");
  }

  if (!profile) return <Card className="p-6">Loading profile...</Card>;

  return (
    <Card className="p-6 space-y-4">
      <h1 className="text-3xl font-display">Profile Settings</h1>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" type="date" value={profile.dateJoined ?? ""} onChange={(e) => setProfile({ ...profile, dateJoined: e.target.value })} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" value={profile.branch} onChange={(e) => setProfile({ ...profile, branch: e.target.value })} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" value={profile.component} onChange={(e) => setProfile({ ...profile, component: e.target.value })} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" value={profile.rank} onChange={(e) => setProfile({ ...profile, rank: e.target.value })} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" value={profile.mos} onChange={(e) => setProfile({ ...profile, mos: e.target.value })} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" type="number" value={profile.yearsServed} onChange={(e) => setProfile({ ...profile, yearsServed: Number(e.target.value) })} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" value={profile.currentStatus} onChange={(e) => setProfile({ ...profile, currentStatus: e.target.value })} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2 md:col-span-2" type="date" value={profile.etsDate ?? ""} onChange={(e) => setProfile({ ...profile, etsDate: e.target.value })} />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save}>Save Profile</Button>
        <span className="text-sm text-muted">{status}</span>
      </div>
    </Card>
  );
}

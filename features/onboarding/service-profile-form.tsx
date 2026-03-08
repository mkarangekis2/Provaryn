"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

const schema = z.object({
  branch: z.string().min(1),
  component: z.string().min(1),
  rank: z.string().min(1),
  mos: z.string().min(1),
  yearsServed: z.coerce.number().int().min(0).max(60),
  currentStatus: z.string().min(1),
  etsDate: z.string().optional()
});

type FormData = z.infer<typeof schema>;

export function ServiceProfileForm() {
  const [userId, setUserId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      branch: "Army",
      component: "Active",
      rank: "E-5",
      mos: "11B",
      yearsServed: 6,
      currentStatus: "Serving"
    }
  });

  useEffect(() => {
    setUserId(getOrCreateClientUserId());
  }, []);

  async function onSubmit(values: FormData) {
    setStatus("Saving profile...");
    const response = await fetch("/api/intake/service-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...values })
    });
    if (!response.ok) {
      setStatus("Failed to save profile.");
      return;
    }
    setStatus("Service profile saved.");
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-2xl font-display">Service Profile Setup</h2>
      <p className="text-sm text-muted">User Scope ID: {userId || "initializing..."}</p>
      <form className="grid md:grid-cols-2 gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Branch" {...form.register("branch")} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Component" {...form.register("component")} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Rank" {...form.register("rank")} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="MOS/AFSC/Rate" {...form.register("mos")} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" type="number" placeholder="Years Served" {...form.register("yearsServed")} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Current Status" {...form.register("currentStatus")} />
        <input className="rounded-xl bg-panel2 border border-border px-3 py-2 md:col-span-2" type="date" {...form.register("etsDate")} />
        <div className="md:col-span-2 flex items-center gap-3">
          <Button type="submit">Save Service Profile</Button>
          <span className="text-sm text-muted">{status}</span>
        </div>
      </form>
    </Card>
  );
}

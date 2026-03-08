"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

const schema = z.object({
  entryType: z.string().min(1),
  title: z.string().min(3),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional()
});

type FormData = z.infer<typeof schema>;

type TimelineEntry = FormData & { createdAt: string };

export function TimelineBuilder() {
  const [userId, setUserId] = useState<string>("");
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [status, setStatus] = useState<string>("");
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { entryType: "deployment" }
  });

  useEffect(() => setUserId(getOrCreateClientUserId()), []);

  async function onSubmit(values: FormData) {
    setStatus("Saving timeline entry...");
    const response = await fetch("/api/intake/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...values, metadata: { location: values.location } })
    });

    if (!response.ok) {
      setStatus("Failed to save entry.");
      return;
    }

    setEntries((prev) => [{ ...values, createdAt: new Date().toISOString() }, ...prev]);
    form.reset({ entryType: values.entryType });
    setStatus("Timeline entry saved.");
  }

  const total = useMemo(() => entries.length, [entries]);

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h2 className="text-2xl font-display">Career Timeline Builder</h2>
        <p className="text-sm text-muted mt-1">Add deployments, units, schools, qualifications, and exposure contexts.</p>
        <form className="grid md:grid-cols-2 gap-4 mt-5" onSubmit={form.handleSubmit(onSubmit)}>
          <select className="rounded-xl bg-panel2 border border-border px-3 py-2" {...form.register("entryType")}>
            <option value="deployment">Deployment</option>
            <option value="unit">Unit</option>
            <option value="school">School</option>
            <option value="qualification">Qualification</option>
            <option value="exposure">Exposure</option>
          </select>
          <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Title" {...form.register("title")} />
          <input className="rounded-xl bg-panel2 border border-border px-3 py-2" type="date" {...form.register("startDate")} />
          <input className="rounded-xl bg-panel2 border border-border px-3 py-2" type="date" {...form.register("endDate")} />
          <input className="rounded-xl bg-panel2 border border-border px-3 py-2 md:col-span-2" placeholder="Location / Context" {...form.register("location")} />
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit">Add Entry</Button>
            <span className="text-sm text-muted">{status}</span>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <p className="kicker">Timeline Coverage</p>
        <p className="metric-value mt-2">{total}</p>
        <p className="text-sm text-muted">entries captured in this session</p>
        <div className="mt-4 space-y-2">
          {entries.slice(0, 6).map((entry, idx) => (
            <div key={`${entry.title}-${idx}`} className="rounded-xl border border-border bg-panel2/60 px-3 py-2 text-sm">
              <span className="text-muted uppercase text-xs">{entry.entryType}</span>
              <p className="font-semibold">{entry.title}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

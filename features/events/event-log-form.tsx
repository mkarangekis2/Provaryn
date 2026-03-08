"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

const schema = z.object({
  eventType: z.string().min(1),
  occurredAt: z.string().optional(),
  location: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().min(5)
});

type FormData = z.infer<typeof schema>;

export function EventLogForm() {
  const [userId, setUserId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [recent, setRecent] = useState<FormData[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { eventType: "injury" }
  });

  useEffect(() => setUserId(getOrCreateClientUserId()), []);

  async function onSubmit(values: FormData) {
    setStatus("Logging event...");
    const response = await fetch("/api/intake/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...values })
    });

    if (!response.ok) {
      setStatus("Failed to log event.");
      return;
    }

    setRecent((prev) => [values, ...prev].slice(0, 5));
    setStatus("Event saved.");
    form.reset({ eventType: values.eventType });
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h2 className="text-2xl font-display">Event Logging</h2>
        <form className="grid md:grid-cols-2 gap-4 mt-5" onSubmit={form.handleSubmit(onSubmit)}>
          <select className="rounded-xl bg-panel2 border border-border px-3 py-2" {...form.register("eventType")}>
            <option value="injury">Injury</option>
            <option value="blast_exposure">Blast Exposure</option>
            <option value="appointment">Appointment</option>
            <option value="diagnosis_update">Diagnosis Update</option>
            <option value="medication_change">Medication Change</option>
            <option value="performance_impact">Performance Impact</option>
          </select>
          <input className="rounded-xl bg-panel2 border border-border px-3 py-2" type="datetime-local" {...form.register("occurredAt")} />
          <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Location" {...form.register("location")} />
          <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Unit" {...form.register("unit")} />
          <textarea className="rounded-xl bg-panel2 border border-border px-3 py-2 md:col-span-2 min-h-24" placeholder="Describe context, symptoms, and operational impact" {...form.register("description")} />
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit">Log Event</Button>
            <span className="text-sm text-muted">{status}</span>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-xl">Recent Logged Events</h3>
        <div className="space-y-2 mt-4">
          {recent.length === 0 ? <p className="text-sm text-muted">No events logged in this session yet.</p> : null}
          {recent.map((event, i) => (
            <div key={`${event.description}-${i}`} className="rounded-xl border border-border bg-panel2/50 px-3 py-2">
              <p className="text-xs text-muted uppercase">{event.eventType}</p>
              <p className="text-sm">{event.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

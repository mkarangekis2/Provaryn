"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const categories = ["Musculoskeletal pain","Sleep","Headaches","Hearing","Mood/Stress","Breathing","GI","Skin","Other"];

export default function CheckInPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display">Weekly Check-In</h1>
      <Card className="p-6 space-y-4">
        {categories.map((category) => (
          <div key={category} className="grid md:grid-cols-6 gap-3 items-center rounded-xl border border-border p-3">
            <p className="md:col-span-2 text-sm">{category}</p>
            <input className="rounded-lg bg-panel2 border border-border px-2 py-1 text-sm" placeholder="Severity 0-10" />
            <input className="rounded-lg bg-panel2 border border-border px-2 py-1 text-sm" placeholder="Frequency/week" />
            <input className="rounded-lg bg-panel2 border border-border px-2 py-1 text-sm" placeholder="Impact" />
            <select className="rounded-lg bg-panel2 border border-border px-2 py-1 text-sm"><option>Care sought?</option><option>Yes</option><option>No</option></select>
          </div>
        ))}
        <Button onClick={() => setSubmitted(true)} className="mt-2">Save Weekly Check-In</Button>
      </Card>
      {submitted ? <Card className="p-4 text-sm text-success">Check-in captured. Trend analysis and new condition signals will update shortly.</Card> : null}
    </div>
  );
}

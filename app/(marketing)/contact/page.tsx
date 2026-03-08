import Link from "next/link";
import { Card } from "@/components/ui/card";

const channels = [
  { title: "Enterprise Demo", detail: "Coach/program deployment walkthrough with architecture review.", action: "Schedule Demo" },
  { title: "Integration Support", detail: "Supabase, SSO, analytics, and migration planning support.", action: "Request Integration Call" },
  { title: "Partnerships", detail: "Military transition organizations and veteran support ecosystem partnerships.", action: "Open Partnership Thread" }
];

export default function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
      <section className="space-y-4">
        <p className="kicker">Contact</p>
        <h1 className="text-4xl md:text-5xl font-display">Demo, Program Rollout, and Integration Support</h1>
        <p className="text-muted max-w-3xl">Use this route to coordinate deployment and onboarding for coaches, transition teams, and partner organizations.</p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <Card key={channel.title} className="p-6">
            <h2 className="text-xl font-display">{channel.title}</h2>
            <p className="text-sm text-muted mt-3">{channel.detail}</p>
            <button type="button" className="mt-5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black">{channel.action}</button>
          </Card>
        ))}
      </section>

      <Card className="p-6 md:p-8">
        <h2 className="text-2xl font-display">Need immediate access?</h2>
        <p className="text-muted mt-2">Individual users can begin today and add coach/program permissions later from settings.</p>
        <Link href="/signup" className="mt-5 inline-flex rounded-xl border border-border px-4 py-2 text-sm">Create Account</Link>
      </Card>
    </div>
  );
}

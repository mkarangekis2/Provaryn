import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Free Tier",
    price: "$0",
    note: "Career tracking + evidence foundation",
    cta: "Start Free",
    href: "/signup",
    tone: "border-border",
    items: [
      "Service profile and timeline tracking",
      "Weekly check-ins and symptom logs",
      "Event logging and baseline vault uploads",
      "Core readiness dashboard and activity history"
    ]
  },
  {
    name: "Career Reconstruction Unlock",
    price: "$2.99",
    note: "One-time report activation",
    cta: "Unlock Report",
    href: "/onboarding/reconstruction",
    tone: "border-ai/50",
    items: [
      "AI reconstructed service-exposure timeline",
      "Expanded evidence gap scan",
      "Condition opportunity summary",
      "Transition risk spotlight"
    ]
  },
  {
    name: "AI Claim Intelligence",
    price: "Premium",
    note: "Subscription",
    cta: "Upgrade",
    href: "/settings/billing",
    tone: "border-accent/40",
    items: [
      "Condition detection + secondary mapping",
      "Claim strategy and sequencing recommendations",
      "Rating estimator and confidence explainability",
      "Transition action prioritization"
    ]
  },
  {
    name: "Claim Builder Package",
    price: "One-Time",
    note: "Full filing workspace",
    cta: "Start Builder",
    href: "/claim-builder",
    tone: "border-success/40",
    items: [
      "Narrative generation and versioning",
      "Evidence bundle QA by condition",
      "Packet assembly and form prep",
      "Submission guidance + post-filing checkpoints"
    ]
  }
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
      <section className="space-y-4">
        <p className="kicker">Pricing</p>
        <h1 className="text-4xl md:text-5xl font-display">Built to Start Free, Scale When You Need More Intelligence</h1>
        <p className="text-muted max-w-3xl">Monetization is tied to real value milestones: reconstruction insight, premium intelligence, and claim assembly execution.</p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <Card key={plan.name} className={`p-6 ${plan.tone}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{plan.note}</p>
                <h2 className="text-2xl font-display mt-1">{plan.name}</h2>
              </div>
              {plan.name.includes("Intelligence") ? <Sparkles className="h-5 w-5 text-ai" /> : null}
            </div>
            <p className="text-3xl font-display mt-4">{plan.price}</p>
            <ul className="mt-5 space-y-2 text-sm text-muted">
              {plan.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href={plan.href} className="mt-6 inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black">{plan.cta}</Link>
          </Card>
        ))}
      </section>
    </div>
  );
}

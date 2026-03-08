"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/analytics/events";
import { useSessionUser } from "@/lib/auth/use-session-user";

type Entitlements = { reconstructionUnlocked: boolean; premiumActive: boolean; claimBuilderUnlocked: boolean };
type Event = { id: string; eventType: string; active: boolean; createdAt: string; source: string };
type Product = "reconstruction_unlock" | "premium_subscription" | "claim_builder_package";

export function BillingPanel() {
  const { user } = useSessionUser();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    void load(user.userId);
  }, [user?.userId]);

  async function load(id: string) {
    const res = await fetch(`/api/settings/billing?userId=${encodeURIComponent(id)}`);
    const payload = (await res.json()) as { entitlements: Entitlements; events: Event[] };
    setEntitlements(payload.entitlements);
    setEvents(payload.events);
  }

  async function trigger(eventType: "reconstruction_unlock" | "premium_subscription" | "claim_builder_package") {
    if (!user?.userId) return;
    await fetch("/api/settings/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, eventType, active: true })
    });
    await load(user.userId);
  }

  async function startCheckout(product: Product) {
    if (!user?.userId) return;
    setCheckoutError(null);
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, product })
    });
    const payload = (await response.json()) as { ok: boolean; url?: string; error?: string };
    if (!payload.ok || !payload.url) {
      setCheckoutError(payload.error ?? "Unable to create checkout session.");
      return;
    }
    trackEvent("upgrade_purchased", { userId: user.userId, product, intent: "checkout_started" });
    window.location.assign(payload.url);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6"><h1 className="text-3xl font-display">Billing & Subscription</h1></Card>
      <Card className="p-6 flex flex-wrap gap-2">
        <Badge tone={entitlements?.reconstructionUnlocked ? "success" : "default"}>Reconstruction {entitlements?.reconstructionUnlocked ? "Unlocked" : "Locked"}</Badge>
        <Badge tone={entitlements?.premiumActive ? "success" : "default"}>Premium {entitlements?.premiumActive ? "Active" : "Inactive"}</Badge>
        <Badge tone={entitlements?.claimBuilderUnlocked ? "success" : "default"}>Claim Builder {entitlements?.claimBuilderUnlocked ? "Unlocked" : "Locked"}</Badge>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Secure Checkout</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={!user?.userId} onClick={() => void startCheckout("reconstruction_unlock")}>Purchase $2.99 Reconstruction</Button>
          <Button size="sm" disabled={!user?.userId} onClick={() => void startCheckout("premium_subscription")}>Start Premium Subscription</Button>
          <Button size="sm" disabled={!user?.userId} onClick={() => void startCheckout("claim_builder_package")}>Buy Claim Builder Package</Button>
        </div>
        {checkoutError ? <p className="mt-3 text-sm text-risk">{checkoutError}</p> : null}
      </Card>
      {process.env.NODE_ENV !== "production" ? (
        <Card className="p-6">
          <h2 className="font-display text-xl">Manual Billing Event Trigger (Dev)</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => trigger("reconstruction_unlock")}>Unlock Reconstruction</Button>
            <Button size="sm" onClick={() => trigger("premium_subscription")}>Activate Premium</Button>
            <Button size="sm" onClick={() => trigger("claim_builder_package")}>Unlock Claim Builder</Button>
          </div>
        </Card>
      ) : null}
      <Card className="p-6">
        <h2 className="font-display text-xl">Billing Events</h2>
        <div className="mt-3 space-y-2 text-sm">
          {events.map((e) => <div key={e.id} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{e.eventType} • {e.active ? "active" : "inactive"} • {new Date(e.createdAt).toLocaleString()}</div>)}
        </div>
      </Card>
    </div>
  );
}

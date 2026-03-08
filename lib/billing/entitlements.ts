import type { Entitlement } from "@/types/domain";

export function resolveEntitlements(events: Array<{ type: string; active: boolean }>): Entitlement {
  return {
    reconstructionUnlocked: events.some((e) => e.type === "reconstruction_unlock" && e.active),
    premiumActive: events.some((e) => e.type === "premium_subscription" && e.active),
    claimBuilderUnlocked: events.some((e) => e.type === "claim_builder_package" && e.active)
  };
}

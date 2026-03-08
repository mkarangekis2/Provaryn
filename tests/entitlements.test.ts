import { describe, it, expect } from "vitest";
import { resolveEntitlements } from "@/lib/billing/entitlements";

describe("resolveEntitlements", () => {
  it("maps billing events to entitlements", () => {
    const entitlements = resolveEntitlements([
      { type: "reconstruction_unlock", active: true },
      { type: "premium_subscription", active: false },
      { type: "claim_builder_package", active: true }
    ]);

    expect(entitlements.reconstructionUnlocked).toBe(true);
    expect(entitlements.premiumActive).toBe(false);
    expect(entitlements.claimBuilderUnlocked).toBe(true);
  });
});

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrCreateClientUserId } from "@/lib/client-user";

type ClaimPackage = {
  selectedConditions: Array<{ conditionId: string; included: boolean }>;
  forms: {
    profileReviewed: boolean;
    serviceHistoryReviewed: boolean;
    evidenceMappingReviewed: boolean;
    narrativeReviewed: boolean;
  };
};

export function FormsAssemblyPanel() {
  const [userId, setUserId] = useState("");
  const [claimPackage, setClaimPackage] = useState<ClaimPackage | null>(null);

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void load(id);
  }, []);

  async function load(id: string) {
    const res = await fetch(`/api/claim-builder/package?userId=${encodeURIComponent(id)}`);
    const payload = (await res.json()) as { claimPackage: ClaimPackage | null };
    setClaimPackage(payload.claimPackage);
  }

  async function toggle(key: keyof ClaimPackage["forms"]) {
    if (!claimPackage) return;
    const nextForms = { ...claimPackage.forms, [key]: !claimPackage.forms[key] };
    const res = await fetch("/api/claim-builder/package", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, selectedConditions: claimPackage.selectedConditions, forms: nextForms })
    });
    const payload = (await res.json()) as { claimPackage: ClaimPackage };
    setClaimPackage(payload.claimPackage);
  }

  const items: Array<{ key: keyof ClaimPackage["forms"]; label: string }> = [
    { key: "profileReviewed", label: "Profile data reviewed" },
    { key: "serviceHistoryReviewed", label: "Service history reviewed" },
    { key: "evidenceMappingReviewed", label: "Evidence mapping reviewed" },
    { key: "narrativeReviewed", label: "Narratives reviewed" }
  ];

  return (
    <Card className="p-6">
      <h1 className="text-3xl font-display">Forms & Packet Assembly</h1>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-xl border border-border bg-panel2/50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm">{item.label}</span>
            <Button size="sm" variant={claimPackage?.forms[item.key] ? "subtle" : "primary"} onClick={() => toggle(item.key)}>
              {claimPackage?.forms[item.key] ? "Marked" : "Mark Complete"}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

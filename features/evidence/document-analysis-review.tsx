"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Extraction = {
  provider?: string;
  facility?: string;
  encounterDate?: string;
  diagnoses: string[];
  symptoms: string[];
  medications: string[];
  limitations: string[];
  conditionTags: string[];
  confidence: number;
};

type DocumentPayload = {
  document: {
    id: string;
    title: string;
    docType: string;
    filename: string;
  };
  extraction?: {
    extracted: Extraction;
    status: string;
  } | null;
};

export function DocumentAnalysisReview({ initialDocumentId }: { initialDocumentId?: string }) {
  const [userId, setUserId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [payload, setPayload] = useState<DocumentPayload | null>(null);
  const [extracted, setExtracted] = useState<Extraction | null>(null);
  const [status, setStatus] = useState("Select a document from Vault.");

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    setDocumentId(initialDocumentId ?? "");
  }, [initialDocumentId]);

  useEffect(() => {
    if (!userId || !documentId) return;
    void loadDocument();
  }, [userId, documentId]);

  async function loadDocument() {
    const response = await fetch(`/api/intake/document/by-id?userId=${encodeURIComponent(userId)}&documentId=${encodeURIComponent(documentId)}`);
    if (!response.ok) {
      setStatus("Document not found. Return to Vault and choose Analyze.");
      return;
    }
    const data = (await response.json()) as DocumentPayload;
    setPayload(data);
    setExtracted(data.extraction?.extracted ?? null);
    setStatus("Document loaded. Run extraction or confirm edited output.");
  }

  async function runExtraction() {
    setStatus("Running extraction...");
    const response = await fetch("/api/intake/document/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, documentId })
    });

    if (!response.ok) {
      setStatus("Extraction failed.");
      return;
    }

    const data = (await response.json()) as { extraction: { extracted: Extraction }; source: string };
    setExtracted(data.extraction.extracted);
    setStatus(`Extraction ready (${data.source}). Review and confirm.`);
  }

  async function confirmExtraction() {
    if (!extracted) return;
    setStatus("Confirming extraction...");

    const response = await fetch("/api/intake/document/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, documentId, extracted })
    });

    if (!response.ok) {
      setStatus("Failed to confirm extraction.");
      return;
    }

    setStatus("Extraction confirmed and locked into evidence workflow.");
  }

  const confidenceTone = useMemo(() => {
    if (!extracted) return "default" as const;
    if (extracted.confidence >= 0.75) return "success" as const;
    if (extracted.confidence >= 0.5) return "warning" as const;
    return "risk" as const;
  }, [extracted]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Document Analysis</p>
        <h1 className="text-3xl font-display mt-2">Extraction Review</h1>
        <p className="text-sm text-muted mt-2">{status}</p>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-xl">Document Context</h2>
        {payload?.document ? (
          <div className="mt-3 rounded-xl border border-border bg-panel2/50 p-4">
            <p className="font-semibold">{payload.document.title}</p>
            <p className="text-xs text-muted">{payload.document.filename} • {payload.document.docType}</p>
          </div>
        ) : (
          <p className="text-sm text-muted mt-3">No document loaded.</p>
        )}
        <div className="mt-4 flex gap-3">
          <Button onClick={runExtraction} disabled={!documentId}>Run Extraction</Button>
          <Button variant="subtle" onClick={confirmExtraction} disabled={!extracted}>Confirm Extraction</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Structured Fields</h2>
          {extracted ? <Badge tone={confidenceTone}>Confidence {Math.round(extracted.confidence * 100)}%</Badge> : null}
        </div>

        {!extracted ? <p className="text-sm text-muted mt-3">Run extraction to populate fields.</p> : null}
        {extracted ? (
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            <input className="rounded-xl bg-panel2 border border-border px-3 py-2" value={extracted.provider ?? ""} onChange={(e) => setExtracted({ ...extracted, provider: e.target.value })} placeholder="Provider" />
            <input className="rounded-xl bg-panel2 border border-border px-3 py-2" value={extracted.facility ?? ""} onChange={(e) => setExtracted({ ...extracted, facility: e.target.value })} placeholder="Facility" />
            <input className="rounded-xl bg-panel2 border border-border px-3 py-2" value={extracted.encounterDate ?? ""} onChange={(e) => setExtracted({ ...extracted, encounterDate: e.target.value })} placeholder="Encounter date" />
            <input className="rounded-xl bg-panel2 border border-border px-3 py-2" value={extracted.confidence} type="number" min={0} max={1} step="0.01" onChange={(e) => setExtracted({ ...extracted, confidence: Number(e.target.value) })} placeholder="Confidence" />
            <textarea className="rounded-xl bg-panel2 border border-border px-3 py-2 min-h-24" value={extracted.diagnoses.join(", ")} onChange={(e) => setExtracted({ ...extracted, diagnoses: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Diagnoses (comma separated)" />
            <textarea className="rounded-xl bg-panel2 border border-border px-3 py-2 min-h-24" value={extracted.symptoms.join(", ")} onChange={(e) => setExtracted({ ...extracted, symptoms: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Symptoms" />
            <textarea className="rounded-xl bg-panel2 border border-border px-3 py-2 min-h-24" value={extracted.medications.join(", ")} onChange={(e) => setExtracted({ ...extracted, medications: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Medications" />
            <textarea className="rounded-xl bg-panel2 border border-border px-3 py-2 min-h-24" value={extracted.limitations.join(", ")} onChange={(e) => setExtracted({ ...extracted, limitations: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Limitations" />
            <textarea className="rounded-xl bg-panel2 border border-border px-3 py-2 min-h-24 md:col-span-2" value={extracted.conditionTags.join(", ")} onChange={(e) => setExtracted({ ...extracted, conditionTags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Condition tags" />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

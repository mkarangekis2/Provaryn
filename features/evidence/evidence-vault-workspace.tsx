"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrCreateClientUserId } from "@/lib/client-user";
import { trackEvent } from "@/lib/analytics/events";

const schema = z.object({
  title: z.string().min(3),
  docType: z.string().min(1),
  filename: z.string().min(1),
  provider: z.string().optional(),
  dateOfService: z.string().optional(),
  conditionTags: z.string().optional(),
  extractedFromText: z.string().optional()
});

type FormData = z.infer<typeof schema>;

type DocumentItem = {
  id: string;
  title: string;
  docType: string;
  filename: string;
  provider?: string;
  dateOfService?: string;
  conditionTags: string[];
  createdAt: string;
};

export function EvidenceVaultWorkspace() {
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { docType: "medical_record" }
  });

  useEffect(() => {
    const id = getOrCreateClientUserId();
    setUserId(id);
    void loadDocuments(id);
  }, []);

  async function loadDocuments(id: string) {
    const response = await fetch(`/api/intake/document?userId=${encodeURIComponent(id)}`);
    if (!response.ok) return;
    const payload = (await response.json()) as { documents: DocumentItem[] };
    setDocuments(payload.documents);
  }

  async function onSubmit(values: FormData) {
    setStatus("Registering document...");

    const response = await fetch("/api/intake/document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        ...values,
        conditionTags: values.conditionTags ? values.conditionTags.split(",").map((tag) => tag.trim()).filter(Boolean) : []
      })
    });

    if (!response.ok) {
      setStatus("Failed to register document.");
      return;
    }

    setStatus("Document registered and ready for extraction review.");
    trackEvent("first_upload_completed", { userId, docType: values.docType });
    form.reset({ docType: values.docType });
    await loadDocuments(userId);
  }

  const docTypeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const document of documents) {
      map.set(document.docType, (map.get(document.docType) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [documents]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="kicker">Secure Evidence Vault</p>
        <h1 className="text-3xl font-display mt-2">Document Intake & Classification</h1>
        <p className="text-sm text-muted mt-2">Register records for structured extraction, condition linking, and claim readiness impact tracking.</p>
      </Card>

      <div className="grid xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-6">
          <h2 className="font-display text-xl">Add Document</h2>
          <form className="grid md:grid-cols-2 gap-3 mt-4" onSubmit={form.handleSubmit(onSubmit)}>
            <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Document title" {...form.register("title")} />
            <select className="rounded-xl bg-panel2 border border-border px-3 py-2" {...form.register("docType")}>
              <option value="medical_record">Medical Record</option>
              <option value="imaging">Imaging</option>
              <option value="orders">Orders</option>
              <option value="profile">Profile</option>
              <option value="visit_note">Visit Note</option>
              <option value="statement">Statement</option>
            </select>
            <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Filename (example.pdf)" {...form.register("filename")} />
            <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Provider (optional)" {...form.register("provider")} />
            <input className="rounded-xl bg-panel2 border border-border px-3 py-2" type="date" {...form.register("dateOfService")} />
            <input className="rounded-xl bg-panel2 border border-border px-3 py-2" placeholder="Condition tags (comma separated)" {...form.register("conditionTags")} />
            <textarea className="rounded-xl bg-panel2 border border-border px-3 py-2 md:col-span-2 min-h-28" placeholder="Paste OCR/raw text for extraction pipeline (optional)." {...form.register("extractedFromText")} />
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit">Register Document</Button>
              <span className="text-sm text-muted">{status}</span>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl">Vault Metrics</h2>
          <p className="text-3xl font-display mt-4">{documents.length}</p>
          <p className="text-sm text-muted">documents captured</p>
          <div className="mt-4 space-y-2">
            {docTypeCounts.map(([docType, count]) => (
              <div key={docType} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span className="text-muted">{docType}</span>
                <Badge>{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Documents</h2>
          <span className="text-xs text-muted">Click analyze to review extraction output</span>
        </div>
        <div className="mt-4 space-y-2">
          {documents.length === 0 ? <p className="text-sm text-muted">No documents added yet.</p> : null}
          {documents.map((document) => (
            <div key={document.id} className="rounded-xl border border-border bg-panel2/50 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{document.title}</p>
                <p className="text-xs text-muted">{document.filename} • {document.docType}</p>
              </div>
              <Link href={`/vault/analysis?documentId=${document.id}`} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Analyze</Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getOrCreateClientUserId } from "@/lib/client-user";

type Doc = { id: string; title: string; docType: string; filename: string };

export function RecordsImportPanel() {
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    const userId = getOrCreateClientUserId();
    void load(userId);
  }, []);

  async function load(userId: string) {
    const res = await fetch(`/api/intake/document?userId=${encodeURIComponent(userId)}`);
    const payload = (await res.json()) as { documents: Doc[] };
    setDocs(payload.documents);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-display">Medical Documentation Import</h1>
        <p className="text-sm text-muted mt-2">Use Evidence Vault intake to register records and run extraction review.</p>
        <Link href="/vault" className="inline-block mt-4 rounded-lg border border-border px-3 py-2 text-sm hover:bg-panel2">Open Evidence Vault</Link>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-xl">Current Imported Docs</h2>
        <div className="mt-3 space-y-2 text-sm text-muted">
          {docs.length === 0 ? <p>No documents imported yet.</p> : null}
          {docs.map((d) => <div key={d.id} className="rounded-lg border border-border bg-panel2/50 px-3 py-2">{d.title} • {d.docType} • {d.filename}</div>)}
        </div>
      </Card>
    </div>
  );
}

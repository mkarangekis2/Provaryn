import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseProfile } from "@/server/persistence/supabase-common";
import type { CheckInInput, DocumentExtractionInput, EventLogInput } from "@/types/intelligence";

export async function listEventLogsSupabase(userId: string): Promise<EventLogInput[]> {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("event_logs")
    .select("event_type, occurred_at, location, unit, description")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (result.error) throw result.error;

  return result.data.map((row) => ({
    userId,
    eventType: row.event_type,
    occurredAt: row.occurred_at ?? undefined,
    location: row.location ?? undefined,
    unit: row.unit ?? undefined,
    description: row.description ?? ""
  }));
}

export async function listCheckInsSupabase(userId: string): Promise<CheckInInput[]> {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();

  const sessions = await supabase
    .from("check_in_sessions")
    .select("id, session_date")
    .eq("user_id", userId)
    .order("session_date", { ascending: false });

  if (sessions.error) throw sessions.error;
  if (sessions.data.length === 0) return [];

  const sessionIds = sessions.data.map((s) => s.id);
  const entries = await supabase
    .from("symptom_entries")
    .select("session_id, category, severity, frequency, impact, care_sought")
    .in("session_id", sessionIds);

  if (entries.error) throw entries.error;

  const entryMap = new Map<string, CheckInInput["entries"]>();
  for (const row of entries.data) {
    const list = entryMap.get(row.session_id) ?? [];
    list.push({
      category: row.category,
      severity: row.severity,
      frequency: row.frequency ?? 0,
      impact: row.impact ?? "",
      careSought: Boolean(row.care_sought)
    });
    entryMap.set(row.session_id, list);
  }

  return sessions.data.map((session) => ({
    userId,
    sessionDate: session.session_date,
    entries: entryMap.get(session.id) ?? []
  }));
}

export async function listDocumentExtractionsSupabase(userId: string): Promise<DocumentExtractionInput[]> {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();

  const docs = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", userId);
  if (docs.error) throw docs.error;
  if (docs.data.length === 0) return [];

  const docIds = docs.data.map((d) => d.id);
  const extractions = await supabase
    .from("document_extractions")
    .select("document_id, extracted, status, created_at")
    .in("document_id", docIds)
    .order("created_at", { ascending: false });

  if (extractions.error) throw extractions.error;

  return extractions.data.map((row) => ({
    documentId: row.document_id,
    userId,
    extracted: row.extracted as DocumentExtractionInput["extracted"],
    status: row.status as "pending_review" | "confirmed",
    updatedAt: row.created_at
  }));
}

export async function getUserSnapshotSupabase(userId: string) {
  const [checkIns, events, extractions] = await Promise.all([
    listCheckInsSupabase(userId),
    listEventLogsSupabase(userId),
    listDocumentExtractionsSupabase(userId)
  ]);

  const supabase = createServiceSupabaseClient();
  const timelineCountRes = await supabase
    .from("service_timeline_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (timelineCountRes.error) throw timelineCountRes.error;

  const documentsCountRes = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (documentsCountRes.error) throw documentsCountRes.error;

  const symptomEntries = checkIns.flatMap((session) => session.entries);
  const highSeverityEntries = symptomEntries.filter((entry) => entry.severity >= 7).length;

  return {
    profile: null,
    counts: {
      checkIns: checkIns.length,
      symptomEntries: symptomEntries.length,
      highSeverityEntries,
      events: events.length,
      timelineEntries: timelineCountRes.count ?? 0,
      documents: documentsCountRes.count ?? 0
    },
    recent: {
      checkIns: checkIns.slice(0, 3),
      events: events.slice(0, 3),
      timeline: [],
      documents: []
    },
    checkIns,
    events,
    extractions
  };
}

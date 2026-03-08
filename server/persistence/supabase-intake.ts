import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseProfile } from "@/server/persistence/supabase-common";

export type IntakeServiceProfileInput = {
  userId: string;
  branch: string;
  component: string;
  rank: string;
  mos: string;
  yearsServed: number;
  currentStatus: string;
  etsDate?: string;
};

export type IntakeTimelineInput = {
  userId: string;
  entryType: string;
  title: string;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
};

export type IntakeEventInput = {
  userId: string;
  eventType: string;
  occurredAt?: string;
  location?: string;
  unit?: string;
  description: string;
};

export type IntakeCheckInInput = {
  userId: string;
  sessionDate: string;
  entries: Array<{
    category: string;
    severity: number;
    frequency: number;
    impact: string;
    careSought: boolean;
  }>;
};

export type IntakeDocumentInput = {
  userId: string;
  title: string;
  docType: string;
  filename: string;
  conditionTags: string[];
  provider?: string;
  dateOfService?: string;
  extractedFromText?: string;
};

export async function upsertServiceProfileSupabase(input: IntakeServiceProfileInput) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();

  const result = await supabase.from("service_profiles").upsert(
    {
      user_id: input.userId,
      branch: input.branch,
      component: input.component,
      rank: input.rank,
      mos: input.mos,
      years_served: input.yearsServed,
      current_status: input.currentStatus,
      ets_date: input.etsDate || null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  ).select("user_id, branch, component, rank, mos, years_served, current_status, ets_date").single();

  if (result.error) throw result.error;

  return {
    userId: result.data.user_id,
    branch: result.data.branch,
    component: result.data.component,
    rank: result.data.rank,
    mos: result.data.mos,
    yearsServed: result.data.years_served,
    currentStatus: result.data.current_status,
    etsDate: result.data.ets_date ?? undefined
  };
}

export async function addTimelineEntrySupabase(input: IntakeTimelineInput) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();

  const result = await supabase.from("service_timeline_entries").insert({
    user_id: input.userId,
    entry_type: input.entryType,
    title: input.title,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    metadata: input.metadata ?? {}
  }).select("user_id, entry_type, title, start_date, end_date, metadata").single();

  if (result.error) throw result.error;

  return {
    userId: result.data.user_id,
    entryType: result.data.entry_type,
    title: result.data.title,
    startDate: result.data.start_date ?? undefined,
    endDate: result.data.end_date ?? undefined,
    metadata: (result.data.metadata as Record<string, unknown>) ?? {}
  };
}

export async function addEventLogSupabase(input: IntakeEventInput) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();

  const result = await supabase.from("event_logs").insert({
    user_id: input.userId,
    event_type: input.eventType,
    occurred_at: input.occurredAt || null,
    location: input.location || null,
    unit: input.unit || null,
    description: input.description
  }).select("user_id, event_type, occurred_at, location, unit, description").single();

  if (result.error) throw result.error;

  return {
    userId: result.data.user_id,
    eventType: result.data.event_type,
    occurredAt: result.data.occurred_at ?? undefined,
    location: result.data.location ?? undefined,
    unit: result.data.unit ?? undefined,
    description: result.data.description
  };
}

export async function addCheckInSupabase(input: IntakeCheckInInput) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();

  const session = await supabase.from("check_in_sessions").insert({
    user_id: input.userId,
    session_date: input.sessionDate
  }).select("id, user_id, session_date").single();

  if (session.error) throw session.error;

  const entryRows = input.entries.map((entry) => ({
    session_id: session.data.id,
    category: entry.category,
    severity: entry.severity,
    frequency: entry.frequency,
    impact: entry.impact,
    care_sought: entry.careSought
  }));

  const entries = await supabase.from("symptom_entries").insert(entryRows).select("category, severity, frequency, impact, care_sought");
  if (entries.error) throw entries.error;

  return {
    userId: session.data.user_id,
    sessionDate: session.data.session_date,
    entries: entries.data.map((entry) => ({
      category: entry.category,
      severity: entry.severity,
      frequency: entry.frequency,
      impact: entry.impact ?? "",
      careSought: Boolean(entry.care_sought)
    }))
  };
}

function mapDocType(input: string): "medical_record" | "imaging" | "orders" | "profile" | "visit_note" | "statement" | "other" {
  if (
    input === "medical_record" ||
    input === "imaging" ||
    input === "orders" ||
    input === "profile" ||
    input === "visit_note" ||
    input === "statement"
  ) return input;
  return "other";
}

export async function addDocumentSupabase(input: IntakeDocumentInput) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();

  const storagePath = `user/${input.userId}/${Date.now()}-${input.filename}`;
  const result = await supabase.from("documents").insert({
    user_id: input.userId,
    storage_path: storagePath,
    filename: input.filename,
    doc_type: mapDocType(input.docType),
    metadata: {
      title: input.title,
      provider: input.provider ?? null,
      dateOfService: input.dateOfService ?? null,
      conditionTags: input.conditionTags,
      extractedFromText: input.extractedFromText ?? null
    }
  }).select("id, user_id, filename, doc_type, uploaded_at, metadata").single();

  if (result.error) throw result.error;

  return {
    id: result.data.id,
    userId: result.data.user_id,
    title: (result.data.metadata as Record<string, unknown>)?.title as string ?? input.title,
    docType: result.data.doc_type,
    filename: result.data.filename,
    provider: (result.data.metadata as Record<string, unknown>)?.provider as string | undefined,
    dateOfService: (result.data.metadata as Record<string, unknown>)?.dateOfService as string | undefined,
    conditionTags: ((result.data.metadata as Record<string, unknown>)?.conditionTags as string[] | undefined) ?? [],
    extractedFromText: (result.data.metadata as Record<string, unknown>)?.extractedFromText as string | undefined,
    createdAt: result.data.uploaded_at
  };
}

export async function listDocumentsSupabase(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase.from("documents").select("id, user_id, filename, doc_type, uploaded_at, metadata").eq("user_id", userId).order("uploaded_at", { ascending: false });
  if (result.error) throw result.error;

  return result.data.map((row) => {
    const metadata = (row.metadata as Record<string, unknown>) ?? {};
    return {
      id: row.id,
      userId: row.user_id,
      title: (metadata.title as string | undefined) ?? row.filename,
      docType: row.doc_type,
      filename: row.filename,
      provider: metadata.provider as string | undefined,
      dateOfService: metadata.dateOfService as string | undefined,
      conditionTags: (metadata.conditionTags as string[] | undefined) ?? [],
      extractedFromText: metadata.extractedFromText as string | undefined,
      createdAt: row.uploaded_at
    };
  });
}

export async function getDocumentSupabase(userId: string, documentId: string) {
  const docs = await listDocumentsSupabase(userId);
  return docs.find((doc) => doc.id === documentId) ?? null;
}

export async function getDocumentExtractionSupabase(documentId: string) {
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("document_extractions")
    .select("id, document_id, extracted, confidence, status, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) throw result.error;
  if (!result.data) return null;

  return {
    documentId: result.data.document_id,
    userId: "",
    extracted: result.data.extracted as {
      provider?: string;
      facility?: string;
      encounterDate?: string;
      diagnoses: string[];
      symptoms: string[];
      medications: string[];
      limitations: string[];
      conditionTags: string[];
      confidence: number;
    },
    status: result.data.status as "pending_review" | "confirmed",
    updatedAt: result.data.created_at
  };
}

export async function upsertDocumentExtractionSupabase(input: {
  documentId: string;
  extracted: {
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
  status: "pending_review" | "confirmed";
}) {
  const supabase = createServiceSupabaseClient();
  const result = await supabase.from("document_extractions").insert({
    document_id: input.documentId,
    extracted: input.extracted,
    confidence: input.extracted.confidence,
    status: input.status
  }).select("document_id, extracted, status, created_at").single();

  if (result.error) throw result.error;
  return {
    documentId: result.data.document_id,
    userId: "",
    extracted: result.data.extracted as {
      provider?: string;
      facility?: string;
      encounterDate?: string;
      diagnoses: string[];
      symptoms: string[];
      medications: string[];
      limitations: string[];
      conditionTags: string[];
      confidence: number;
    },
    status: result.data.status as "pending_review" | "confirmed",
    updatedAt: result.data.created_at
  };
}

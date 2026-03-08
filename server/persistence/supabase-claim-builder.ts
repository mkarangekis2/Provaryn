import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseProfile } from "@/server/persistence/supabase-common";

type SelectedCondition = { conditionId: string; included: boolean };
type Forms = {
  profileReviewed: boolean;
  serviceHistoryReviewed: boolean;
  evidenceMappingReviewed: boolean;
  narrativeReviewed: boolean;
};

export type ClaimPackage = {
  id: string;
  userId: string;
  title: string;
  selectedConditions: SelectedCondition[];
  forms: Forms;
  updatedAt: string;
};

export type ExportJob = {
  id: string;
  userId: string;
  claimPackageId?: string;
  status: "queued" | "processing" | "completed" | "failed";
  outputFormat: "json" | "pdf" | "packet";
  artifact: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
};

const defaultForms: Forms = {
  profileReviewed: false,
  serviceHistoryReviewed: false,
  evidenceMappingReviewed: false,
  narrativeReviewed: false
};

function toClaimPackage(row: {
  id: string;
  user_id: string;
  title: string;
  selected_conditions: unknown;
  forms: unknown;
  updated_at: string;
}): ClaimPackage {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    selectedConditions: (row.selected_conditions as SelectedCondition[] | null) ?? [],
    forms: { ...defaultForms, ...((row.forms as Partial<Forms> | null) ?? {}) },
    updatedAt: row.updated_at
  };
}

export async function getClaimPackageSupabase(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("claim_packages")
    .select("id, user_id, title, selected_conditions, forms, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) throw result.error;
  if (!result.data) return null;
  return toClaimPackage(result.data);
}

export async function upsertClaimPackageSupabase(input: {
  userId: string;
  title: string;
  selectedConditions: SelectedCondition[];
  forms: Forms;
}) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();

  const existing = await getClaimPackageSupabase(input.userId);
  if (existing) {
    const updated = await supabase
      .from("claim_packages")
      .update({
        title: input.title,
        selected_conditions: input.selectedConditions,
        forms: input.forms,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)
      .select("id, user_id, title, selected_conditions, forms, updated_at")
      .single();

    if (updated.error) throw updated.error;
    return toClaimPackage(updated.data);
  }

  const inserted = await supabase
    .from("claim_packages")
    .insert({
      user_id: input.userId,
      title: input.title,
      status: "draft",
      selected_conditions: input.selectedConditions,
      forms: input.forms,
      updated_at: new Date().toISOString()
    })
    .select("id, user_id, title, selected_conditions, forms, updated_at")
    .single();

  if (inserted.error) throw inserted.error;
  return toClaimPackage(inserted.data);
}

export async function listNarrativesSupabase(packageId: string) {
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("generated_narratives")
    .select("id, user_id, package_id, user_condition_id, narrative_type, content, version, created_at, metadata")
    .eq("package_id", packageId)
    .order("created_at", { ascending: false });

  if (result.error) throw result.error;
  return result.data.map((item) => ({
    id: item.id,
    packageId: item.package_id ?? packageId,
    userId: item.user_id,
    conditionId: (item.metadata as Record<string, unknown> | null)?.conditionId as string | undefined,
    narrativeType: item.narrative_type as "condition" | "service_impact" | "event",
    content: item.content,
    version: item.version,
    createdAt: item.created_at
  }));
}

export async function addNarrativeSupabase(input: {
  packageId: string;
  userId: string;
  conditionId?: string;
  narrativeType: "condition" | "service_impact" | "event";
  content: string;
  version: number;
}) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();
  const inserted = await supabase
    .from("generated_narratives")
    .insert({
      package_id: input.packageId,
      user_id: input.userId,
      user_condition_id: null,
      narrative_type: input.narrativeType,
      content: input.content,
      version: input.version,
      metadata: { conditionId: input.conditionId ?? null }
    })
    .select("id, user_id, package_id, narrative_type, content, version, created_at, metadata")
    .single();

  if (inserted.error) throw inserted.error;
  return {
    id: inserted.data.id,
    packageId: inserted.data.package_id ?? input.packageId,
    userId: inserted.data.user_id,
    conditionId: (inserted.data.metadata as Record<string, unknown> | null)?.conditionId as string | undefined,
    narrativeType: inserted.data.narrative_type as "condition" | "service_impact" | "event",
    content: inserted.data.content,
    version: inserted.data.version,
    createdAt: inserted.data.created_at
  };
}

function toExportJob(row: {
  id: string;
  user_id: string;
  claim_package_id: string | null;
  status: string;
  output_format: string;
  artifact: unknown;
  metadata: unknown;
  created_at: string;
  completed_at: string | null;
}): ExportJob {
  return {
    id: row.id,
    userId: row.user_id,
    claimPackageId: row.claim_package_id ?? undefined,
    status: (row.status as ExportJob["status"]) ?? "queued",
    outputFormat: (row.output_format as ExportJob["outputFormat"]) ?? "packet",
    artifact: (row.artifact as Record<string, unknown>) ?? {},
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined
  };
}

export async function createExportJobSupabase(input: {
  userId: string;
  claimPackageId?: string;
  outputFormat: ExportJob["outputFormat"];
  metadata?: Record<string, unknown>;
}) {
  await ensureSupabaseProfile(input.userId);
  const supabase = createServiceSupabaseClient();
  const inserted = await supabase
    .from("export_jobs")
    .insert({
      user_id: input.userId,
      claim_package_id: input.claimPackageId ?? null,
      status: "processing",
      output_format: input.outputFormat,
      metadata: input.metadata ?? {}
    })
    .select("id, user_id, claim_package_id, status, output_format, artifact, metadata, created_at, completed_at")
    .single();

  if (inserted.error) throw inserted.error;
  return toExportJob(inserted.data);
}

export async function completeExportJobSupabase(input: {
  userId: string;
  exportJobId: string;
  status: ExportJob["status"];
  artifact: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceSupabaseClient();
  const updated = await supabase
    .from("export_jobs")
    .update({
      status: input.status,
      artifact: input.artifact,
      metadata: input.metadata ?? {},
      completed_at: new Date().toISOString()
    })
    .eq("id", input.exportJobId)
    .eq("user_id", input.userId)
    .select("id, user_id, claim_package_id, status, output_format, artifact, metadata, created_at, completed_at")
    .single();

  if (updated.error) throw updated.error;
  return toExportJob(updated.data);
}

export async function listExportJobsSupabase(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();
  const result = await supabase
    .from("export_jobs")
    .select("id, user_id, claim_package_id, status, output_format, artifact, metadata, created_at, completed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (result.error) throw result.error;
  return result.data.map((row) => toExportJob(row));
}

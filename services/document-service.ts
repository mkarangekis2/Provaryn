import { createServiceSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function validateUpload(file: { mimeType: string; size: number }) {
  if (!ALLOWED_TYPES.includes(file.mimeType)) throw new Error("Unsupported file type");
  if (file.size > 25 * 1024 * 1024) throw new Error("File exceeds 25MB limit");
}

export async function createSignedDocumentUrl(path: string, expiresInSeconds = 300) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.storage.from("medical-records").createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

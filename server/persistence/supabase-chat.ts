import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseProfile } from "@/server/persistence/supabase-common";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  extractionPreview?: { type: string; payload: Record<string, unknown> };
};

async function getOrCreateConversation(userId: string) {
  await ensureSupabaseProfile(userId);
  const supabase = createServiceSupabaseClient();

  const existing = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;

  const created = await supabase
    .from("conversations")
    .insert({ user_id: userId, title: "Primary assistant conversation" })
    .select("id")
    .single();

  if (created.error) throw created.error;
  return created.data.id;
}

export async function listChatMessagesSupabase(userId: string) {
  const conversationId = await getOrCreateConversation(userId);
  const supabase = createServiceSupabaseClient();

  const messagesResult = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (messagesResult.error) throw messagesResult.error;

  const extractionResult = await supabase
    .from("structured_extractions_from_chat")
    .select("message_id, extraction")
    .in("message_id", messagesResult.data.map((m) => m.id));

  if (extractionResult.error) throw extractionResult.error;
  const extractionMap = new Map<string, { type: string; payload: Record<string, unknown> }>();
  for (const row of extractionResult.data) {
    const extraction = row.extraction as { type?: string; payload?: Record<string, unknown> };
    if (extraction?.type) {
      extractionMap.set(row.message_id, { type: extraction.type, payload: extraction.payload ?? {} });
    }
  }

  return messagesResult.data.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    createdAt: msg.created_at,
    extractionPreview: extractionMap.get(msg.id)
  }));
}

export async function addChatMessageSupabase(input: {
  userId: string;
  role: "user" | "assistant";
  content: string;
  extractionPreview?: { type: string; payload: Record<string, unknown> };
}) {
  const conversationId = await getOrCreateConversation(input.userId);
  const supabase = createServiceSupabaseClient();

  const inserted = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role: input.role, content: input.content })
    .select("id, role, content, created_at")
    .single();

  if (inserted.error) throw inserted.error;

  if (input.extractionPreview) {
    const extractionInsert = await supabase
      .from("structured_extractions_from_chat")
      .insert({
        message_id: inserted.data.id,
        extraction: input.extractionPreview,
        status: "pending_review"
      });
    if (extractionInsert.error) throw extractionInsert.error;
  }

  return {
    id: inserted.data.id,
    role: inserted.data.role as "user" | "assistant",
    content: inserted.data.content,
    createdAt: inserted.data.created_at,
    extractionPreview: input.extractionPreview
  };
}

export async function getChatRateLimitStatusSupabase(userId: string, options?: { maxPerMinute?: number }) {
  const maxPerMinute = options?.maxPerMinute ?? 6;
  const conversationId = await getOrCreateConversation(userId);
  const supabase = createServiceSupabaseClient();

  const since = new Date(Date.now() - 60_000).toISOString();
  const recentRes = await supabase
    .from("messages")
    .select("id, created_at", { count: "exact" })
    .eq("conversation_id", conversationId)
    .eq("role", "user")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(maxPerMinute);

  if (recentRes.error) throw recentRes.error;

  const recentCount = recentRes.count ?? 0;
  if (recentCount < maxPerMinute) {
    return { limited: false as const, retryAfterSec: 0 };
  }

  const latest = recentRes.data?.[0]?.created_at;
  if (!latest) {
    return { limited: true as const, retryAfterSec: 30 };
  }
  const ageMs = Date.now() - new Date(latest).getTime();
  const retryAfterSec = Math.max(1, Math.ceil((60_000 - ageMs) / 1000));
  return { limited: true as const, retryAfterSec };
}

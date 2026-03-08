"use client";

const KEY = "valor_user_id";

function getProjectRefFromSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    const [projectRef] = hostname.split(".");
    return projectRef || null;
  } catch {
    return null;
  }
}

function extractUserIdFromSupabaseSession(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      const candidate = parsed as {
        user?: { id?: string };
        currentSession?: { user?: { id?: string } };
        session?: { user?: { id?: string } };
      };
      return (
        candidate.user?.id ??
        candidate.currentSession?.user?.id ??
        candidate.session?.user?.id ??
        null
      );
    }
  } catch {
    return null;
  }
  return null;
}

function resolveFromSupabaseAuthStorage() {
  const projectRef = getProjectRefFromSupabaseUrl();
  if (!projectRef) return null;
  const storageKey = `sb-${projectRef}-auth-token`;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  return extractUserIdFromSupabaseSession(raw);
}

export function getOrCreateClientUserId() {
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const fromAuth = resolveFromSupabaseAuthStorage();
  if (fromAuth) {
    window.localStorage.setItem(KEY, fromAuth);
    return fromAuth;
  }
  return "";
}

export function setClientUserId(userId: string) {
  window.localStorage.setItem(KEY, userId);
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user?.id) return data.user.id;
  } catch {
    // Continue to bearer fallback.
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const service = createServiceSupabaseClient();
    const { data, error } = await service.auth.getUser(token);
    if (!error && data.user?.id) return data.user.id;
  } catch {
    return null;
  }

  return null;
}

export async function requireAuthorizedUser(
  request: NextRequest,
  providedUserId?: string | null
): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {
  const authenticatedUserId = await getAuthenticatedUserId(request);

  if (!authenticatedUserId) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 })
    };
  }

  if (providedUserId && providedUserId !== authenticatedUserId) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Forbidden user scope" }, { status: 403 })
    };
  }

  return { ok: true, userId: authenticatedUserId };
}

export async function requireAuthorizedQueryUser(
  request: NextRequest,
  queryParam = "userId"
): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {
  const userId = request.nextUrl.searchParams.get(queryParam);
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: `${queryParam} required` }, { status: 400 })
    };
  }

  return requireAuthorizedUser(request, userId);
}

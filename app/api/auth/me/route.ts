import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth/request-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/domain";

type SessionUser = {
  userId: string;
  email?: string;
  roles: AppRole[];
  primaryRole: AppRole;
};

const rolePriority: AppRole[] = ["system_admin", "program_admin", "coach", "user"];

function resolvePrimaryRole(roles: AppRole[]) {
  for (const role of rolePriority) {
    if (roles.includes(role)) return role;
  }
  return "user" as const;
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const supabase = createServiceSupabaseClient();

    const [userResult, rolesResult] = await Promise.all([
      supabase.auth.admin.getUserById(userId),
      supabase.from("roles").select("role").eq("user_id", userId)
    ]);

    if (rolesResult.error) throw rolesResult.error;
    if (userResult.error) throw userResult.error;

    const roles = Array.from(
      new Set((rolesResult.data ?? []).map((row) => row.role as AppRole).filter(Boolean))
    );
    if (roles.length === 0) roles.push("user");

    const payload: SessionUser = {
      userId,
      email: userResult.data.user?.email ?? undefined,
      roles,
      primaryRole: resolvePrimaryRole(roles)
    };

    return NextResponse.json({ ok: true, user: payload });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load session user" },
      { status: 500 }
    );
  }
}


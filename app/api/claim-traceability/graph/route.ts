import { NextRequest, NextResponse } from "next/server";
import { requireAuthorizedQueryUser } from "@/lib/auth/request-user";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = createServiceSupabaseClient();
    const sessionsRes = await supabase.from("check_in_sessions").select("id").eq("user_id", auth.userId).limit(250);
    if (sessionsRes.error) throw sessionsRes.error;
    const sessionIds = (sessionsRes.data ?? []).map((row) => row.id);

    const [checkInsRes, eventsRes, docsRes, conditionsRes, strategyRes, packagesRes] = await Promise.all([
      sessionIds.length > 0
        ? supabase.from("symptom_entries").select("category").in("session_id", sessionIds).limit(600)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("event_logs").select("event_type, description").eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(200),
      supabase.from("documents").select("doc_type, filename").eq("user_id", auth.userId).order("uploaded_at", { ascending: false }).limit(200),
      supabase.from("user_conditions").select("id, label, readiness_score").eq("user_id", auth.userId).order("readiness_score", { ascending: false }).limit(50),
      supabase.from("claim_strategy_snapshots").select("strategy, created_at").eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("claim_packages").select("id, status, title, created_at").eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(20)
    ]);

    if (checkInsRes.error) throw checkInsRes.error;
    if (eventsRes.error) throw eventsRes.error;
    if (docsRes.error) throw docsRes.error;
    if (conditionsRes.error) throw conditionsRes.error;
    if (strategyRes.error) throw strategyRes.error;
    if (packagesRes.error) throw packagesRes.error;

    const symptomCounts = new Map<string, number>();
    for (const row of checkInsRes.data ?? []) {
      const key = (row.category ?? "other").toString();
      symptomCounts.set(key, (symptomCounts.get(key) ?? 0) + 1);
    }

    const symptoms = [...symptomCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category, count]) => ({ category, count }));

    const events = (eventsRes.data ?? []).slice(0, 12).map((row) => ({
      type: row.event_type,
      description: row.description ?? ""
    }));
    const documents = (docsRes.data ?? []).slice(0, 12).map((row) => ({ type: row.doc_type, filename: row.filename }));
    const conditions = (conditionsRes.data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      readiness: row.readiness_score ?? 0
    }));
    const strategy = (strategyRes.data?.strategy as Record<string, unknown> | null) ?? {};
    const packages = (packagesRes.data ?? []).map((row) => ({
      id: row.id,
      status: row.status,
      title: row.title,
      createdAt: row.created_at
    }));

    return NextResponse.json({
      ok: true,
      graph: {
        symptoms,
        events,
        documents,
        conditions,
        strategy: {
          primaryClaims: Array.isArray(strategy.primaryClaims) ? strategy.primaryClaims : [],
          secondaryClaims: Array.isArray(strategy.secondaryClaims) ? strategy.secondaryClaims : [],
          blockers: Array.isArray(strategy.blockers) ? strategy.blockers : []
        },
        packages
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load traceability graph" },
      { status: 500 }
    );
  }
}

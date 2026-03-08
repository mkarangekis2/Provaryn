import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type CheckResult = {
  status: "ok" | "warn" | "fail";
  detail: string;
};

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, CheckResult> = {};

  checks.openai = env.OPENAI_API_KEY
    ? { status: "ok", detail: "OPENAI_API_KEY configured" }
    : { status: "warn", detail: "OPENAI_API_KEY missing" };

  checks.stripe = env.STRIPE_SECRET_KEY
    ? { status: "ok", detail: "STRIPE_SECRET_KEY configured" }
    : { status: "warn", detail: "STRIPE_SECRET_KEY missing" };

  checks.stripeWebhook = env.STRIPE_WEBHOOK_SECRET
    ? { status: "ok", detail: "STRIPE_WEBHOOK_SECRET configured" }
    : { status: "warn", detail: "STRIPE_WEBHOOK_SECRET missing" };

  try {
    const supabase = createServiceSupabaseClient();

    const dbPing = await supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1);
    checks.supabaseDb = dbPing.error
      ? { status: "fail", detail: `DB check failed: ${dbPing.error.message}` }
      : { status: "ok", detail: "DB reachable" };

    const buckets = await supabase.storage.listBuckets();
    checks.supabaseStorage = buckets.error
      ? { status: "fail", detail: `Storage check failed: ${buckets.error.message}` }
      : { status: "ok", detail: `Storage reachable (${buckets.data.length} buckets)` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    checks.supabaseDb = { status: "fail", detail: message };
    checks.supabaseStorage = { status: "fail", detail: message };
  }

  const hasFailure = Object.values(checks).some((check) => check.status === "fail");
  const overall = hasFailure ? "degraded" : "ok";
  const statusCode = hasFailure ? 503 : 200;

  return NextResponse.json(
    {
      ok: !hasFailure,
      status: overall,
      service: "valor-claims-os",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      checks
    },
    { status: statusCode }
  );
}

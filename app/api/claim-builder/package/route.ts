import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClaimPackage, upsertClaimPackage } from "@/server/mock/store";
import { getClaimPackageSupabase, upsertClaimPackageSupabase } from "@/server/persistence/supabase-claim-builder";

const postSchema = z.object({
  userId: z.string().min(5),
  title: z.string().min(3),
  selectedConditions: z.array(z.object({ conditionId: z.string(), included: z.boolean() })).default([])
});

const patchSchema = z.object({
  userId: z.string().min(5),
  selectedConditions: z.array(z.object({ conditionId: z.string(), included: z.boolean() })),
  forms: z.object({
    profileReviewed: z.boolean(),
    serviceHistoryReviewed: z.boolean(),
    evidenceMappingReviewed: z.boolean(),
    narrativeReviewed: z.boolean()
  }).optional()
});

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
  try {
    const claimPackage = await getClaimPackageSupabase(userId);
    return NextResponse.json({ ok: true, claimPackage });
  } catch {
    return NextResponse.json({ ok: true, claimPackage: getClaimPackage(userId) });
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  let claimPackage: ReturnType<typeof upsertClaimPackage>;
  try {
    const existing = await getClaimPackageSupabase(body.userId);
    claimPackage = await upsertClaimPackageSupabase({
      userId: body.userId,
      title: body.title,
      selectedConditions: body.selectedConditions,
      forms: existing?.forms ?? {
        profileReviewed: false,
        serviceHistoryReviewed: false,
        evidenceMappingReviewed: false,
        narrativeReviewed: false
      }
    });
  } catch {
    const existing = getClaimPackage(body.userId);
    claimPackage = upsertClaimPackage({
      id: existing?.id ?? randomUUID(),
      userId: body.userId,
      title: body.title,
      selectedConditions: body.selectedConditions,
      forms: existing?.forms ?? {
        profileReviewed: false,
        serviceHistoryReviewed: false,
        evidenceMappingReviewed: false,
        narrativeReviewed: false
      },
      updatedAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true, claimPackage });
}

export async function PATCH(request: NextRequest) {
  const body = patchSchema.parse(await request.json());
  let updated: ReturnType<typeof upsertClaimPackage>;
  try {
    const existing = await getClaimPackageSupabase(body.userId);
    if (!existing) return NextResponse.json({ ok: false, error: "Claim package not found" }, { status: 404 });
    updated = await upsertClaimPackageSupabase({
      userId: body.userId,
      title: existing.title,
      selectedConditions: body.selectedConditions,
      forms: body.forms ?? existing.forms
    });
  } catch {
    const existing = getClaimPackage(body.userId);
    if (!existing) return NextResponse.json({ ok: false, error: "Claim package not found" }, { status: 404 });
    updated = upsertClaimPackage({
      ...existing,
      selectedConditions: body.selectedConditions,
      forms: body.forms ?? existing.forms,
      updatedAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ ok: true, claimPackage: updated });
}

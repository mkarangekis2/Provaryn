import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClaimPackage, upsertClaimPackage } from "@/server/mock/store";
import { getClaimPackageSupabase, upsertClaimPackageSupabase } from "@/server/persistence/supabase-claim-builder";
import { requireAuthorizedQueryUser, requireAuthorizedUser } from "@/lib/auth/request-user";

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
  const auth = await requireAuthorizedQueryUser(request);
  if (!auth.ok) return auth.response;
  try {
    const claimPackage = await getClaimPackageSupabase(auth.userId);
    return NextResponse.json({ ok: true, claimPackage });
  } catch {
    return NextResponse.json({ ok: true, claimPackage: getClaimPackage(auth.userId) });
  }
}

export async function POST(request: NextRequest) {
  const body = postSchema.parse(await request.json());
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  let claimPackage: ReturnType<typeof upsertClaimPackage>;
  try {
    const existing = await getClaimPackageSupabase(userId);
    claimPackage = await upsertClaimPackageSupabase({
      userId,
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
    const existing = getClaimPackage(userId);
    claimPackage = upsertClaimPackage({
      id: existing?.id ?? randomUUID(),
      userId,
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
  const auth = await requireAuthorizedUser(request, body.userId);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;
  let updated: ReturnType<typeof upsertClaimPackage>;
  try {
    const existing = await getClaimPackageSupabase(userId);
    if (!existing) return NextResponse.json({ ok: false, error: "Claim package not found" }, { status: 404 });
    updated = await upsertClaimPackageSupabase({
      userId,
      title: existing.title,
      selectedConditions: body.selectedConditions,
      forms: body.forms ?? existing.forms
    });
  } catch {
    const existing = getClaimPackage(userId);
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

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildUserIntelligenceAsync } from "@/services/intelligence/user-intelligence-service";
import { requireAuthorizedUser } from "@/lib/auth/request-user";
import { getUSStateName, isUSStateCode, usStates } from "@/lib/us-states";

const schema = z.object({ userId: z.string().min(5), state: z.string().optional() });

const federalBenefits = [
  { title: "VA Healthcare Enrollment Guidance", category: "Healthcare", state: "ALL", minReadiness: 0 },
  { title: "GI Bill and Education Benefit Guidance", category: "Education", state: "ALL", minReadiness: 0 },
  { title: "Federal Home Loan (VA Loan) Readiness Guidance", category: "Housing", state: "ALL", minReadiness: 0 },
  { title: "Dependent and Survivor Benefits Pathway", category: "Family", state: "ALL", minReadiness: 25 },
  { title: "Vocational Rehabilitation & Employment Guidance", category: "Employment", state: "ALL", minReadiness: 35 }
] as const;

const stateBenefitTemplates = [
  { title: "Veteran Property Tax Relief", category: "Tax", minReadiness: 0 },
  { title: "State Tuition Assistance / Waiver Programs", category: "Education", minReadiness: 0 },
  { title: "State Veteran Employment Preference Programs", category: "Employment", minReadiness: 20 },
  { title: "State Veterans Home and Long-Term Care Access", category: "Healthcare", minReadiness: 25 },
  { title: "State Recreation / Licensing Discount Programs", category: "Discount", minReadiness: 0 }
] as const;

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({
    userId: request.nextUrl.searchParams.get("userId"),
    state: request.nextUrl.searchParams.get("state") ?? undefined
  });

  if (!parsed.success) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
  const auth = await requireAuthorizedUser(request, parsed.data.userId);
  if (!auth.ok) return auth.response;

  try {
    const intel = await buildUserIntelligenceAsync(auth.userId);
    const requestedState = (parsed.data.state ?? "ALL").toUpperCase();
    const state = requestedState === "ALL" || isUSStateCode(requestedState) ? requestedState : "ALL";

    const stateSpecific =
      state === "ALL"
        ? usStates.flatMap((entry) =>
            stateBenefitTemplates.map((template) => ({
              title: `${entry.name}: ${template.title}`,
              category: template.category,
              state: entry.code,
              minReadiness: template.minReadiness
            }))
          )
        : stateBenefitTemplates.map((template) => ({
            title: `${getUSStateName(state)}: ${template.title}`,
            category: template.category,
            state,
            minReadiness: template.minReadiness
          }));

    const allBenefits = [...federalBenefits, ...stateSpecific];

    const matches = allBenefits
      .filter((benefit) => intel.score.overall >= benefit.minReadiness)
      .map((benefit) => ({
        ...benefit,
        eligibilityConfidence: Math.min(0.96, 0.42 + intel.score.overall / 180)
      }));

    return NextResponse.json({ ok: true, matches, state });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load benefit matches" },
      { status: 500 }
    );
  }
}

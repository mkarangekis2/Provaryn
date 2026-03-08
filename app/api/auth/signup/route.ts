import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  referralCode: z.string().optional(),
  consentSensitiveProcessing: z.boolean()
});

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());

  if (!body.consentSensitiveProcessing) {
    return NextResponse.json({ ok: false, error: "Consent is required." }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const created = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        referral_code: body.referralCode || null,
        consent_sensitive_processing: true
      }
    });

    if (created.error) throw created.error;
    if (!created.data.user?.id) {
      return NextResponse.json({ ok: false, error: "Unable to create account." }, { status: 500 });
    }

    const userId = created.data.user.id;

    const [profileInsert, roleInsert] = await Promise.all([
      supabase.from("profiles").upsert(
        {
          id: userId,
          email: body.email,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      ),
      supabase.from("roles").upsert(
        {
          user_id: userId,
          role: "user"
        },
        { onConflict: "user_id,role" }
      )
    ]);

    if (profileInsert.error) throw profileInsert.error;
    if (roleInsert.error) throw roleInsert.error;

    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email: created.data.user.email ?? body.email
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create account" },
      { status: 500 }
    );
  }
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/events";
import { setClientUserId } from "@/lib/client-user";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      setError("Consent is required to create an account.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    trackEvent("signup_started", { emailDomain: email.split("@")[1] ?? "unknown" });

    try {
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          referralCode: referralCode || undefined,
          consentSensitiveProcessing: true
        })
      });
      const signupPayload = (await signupResponse.json()) as {
        ok: boolean;
        error?: string;
        user?: { id: string; email: string };
      };

      if (!signupResponse.ok || !signupPayload.ok || !signupPayload.user?.id) {
        throw new Error(signupPayload.error ?? "Unable to create account.");
      }

      const supabase = createBrowserSupabaseClient();
      const signIn = await supabase.auth.signInWithPassword({ email, password });
      if (signIn.error) throw signIn.error;

      setClientUserId(signupPayload.user.id);
      trackEvent("signup_completed", { userId: signupPayload.user.id, referralCode: referralCode || null });
      setNotice("Account created. Email confirmation is not required. Continue to MFA setup.");
      window.location.assign("/mfa-setup?redirect=/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <input
          className="w-full rounded-xl bg-panel2 border border-border px-3 py-2"
          placeholder="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-xl bg-panel2 border border-border px-3 py-2"
          placeholder="Password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="w-full rounded-xl bg-panel2 border border-border px-3 py-2"
          placeholder="Referral code (optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />
        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          I consent to secure processing of sensitive personal and health-adjacent records.
        </label>
        <button disabled={loading} type="submit" className="w-full rounded-xl bg-accent text-black py-2.5 font-semibold disabled:opacity-60">
          {loading ? "Creating account..." : "Create Account & Continue"}
        </button>
        {error ? <p className="text-sm text-risk">{error}</p> : null}
        {notice ? <p className="text-sm text-success">{notice}</p> : null}
      </form>
      <p className="mt-4 text-sm text-muted">Already have an account? <Link className="text-accent" href="/login">Log in</Link></p>
    </>
  );
}

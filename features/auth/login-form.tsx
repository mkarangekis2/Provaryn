"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { setClientUserId } from "@/lib/client-user";

export function LoginForm({ redirectTo = "/home" }: { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (data.user?.id) {
        setClientUserId(data.user.id);
      }
      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!assurance.data || assurance.data.currentLevel !== "aal2") {
        window.location.assign(`/mfa-setup?redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }
      const statusRes = await fetch(`/api/onboarding/status?userId=${encodeURIComponent(data.user?.id ?? "")}`);
      const statusPayload = (await statusRes.json()) as { ok: boolean; hasServiceProfile?: boolean };
      const target = statusPayload.ok && !statusPayload.hasServiceProfile
        ? "/onboarding"
        : redirectTo;
      window.location.assign(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button disabled={loading} type="submit" className="w-full rounded-xl bg-accent text-black py-2.5 font-semibold disabled:opacity-60">
          {loading ? "Signing in..." : "Continue"}
        </button>
        {error ? <p className="text-sm text-risk">{error}</p> : null}
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link className="text-muted hover:text-text" href="/password-reset">Forgot password</Link>
        <Link className="text-muted hover:text-text" href="/mfa-setup">Setup MFA</Link>
      </div>
    </>
  );
}

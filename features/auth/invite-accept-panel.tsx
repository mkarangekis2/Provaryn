"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { setClientUserId } from "@/lib/client-user";

export function InviteAcceptPanel({ tokenHash, email }: { tokenHash: string | null; email: string | null }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSubmit = useMemo(() => Boolean(tokenHash) && password.length >= 8, [tokenHash, password.length]);

  async function acceptInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tokenHash) {
      setError("Invite token missing.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const verifyResult = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "invite",
        email: email ?? undefined
      });
      if (verifyResult.error) throw verifyResult.error;

      const updateResult = await supabase.auth.updateUser({ password });
      if (updateResult.error) throw updateResult.error;
      if (updateResult.data.user?.id) {
        setClientUserId(updateResult.data.user.id);
      }

      setNotice("Invitation accepted. Redirecting to onboarding...");
      window.setTimeout(() => window.location.assign("/onboarding"), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept invitation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="kicker">Invitation</p>
      <h1 className="text-3xl font-display mt-2">Accept Invite</h1>
      <p className="text-muted mt-3">Set a secure password to activate your coach/program invitation.</p>
      <form className="mt-6 space-y-4" onSubmit={acceptInvite}>
        <input
          className="w-full rounded-xl bg-panel2 border border-border px-3 py-2"
          placeholder="New password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button disabled={!canSubmit || loading} type="submit" className="w-full rounded-xl bg-accent text-black py-2.5 font-semibold disabled:opacity-60">
          {loading ? "Accepting..." : "Accept Invitation"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-risk">{error}</p> : null}
      {notice ? <p className="mt-3 text-sm text-success">{notice}</p> : null}
      {!tokenHash ? <p className="mt-3 text-sm text-warning">This invite link is incomplete. Request a new invite.</p> : null}
    </div>
  );
}

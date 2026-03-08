"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}/login`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      setNotice("Password reset email sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
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
      <button disabled={loading} type="submit" className="w-full rounded-xl bg-accent text-black py-2.5 font-semibold disabled:opacity-60">
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
      {error ? <p className="text-sm text-risk">{error}</p> : null}
      {notice ? <p className="text-sm text-success">{notice}</p> : null}
    </form>
  );
}

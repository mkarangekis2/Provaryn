"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type MfaStage = "idle" | "enrolled";

export function MfaSetupPanel() {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<MfaStage>("idle");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const qrSrc = useMemo(() => {
    if (!qrSvg) return null;
    return qrSvg.startsWith("data:image") ? qrSvg : `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`;
  }, [qrSvg]);

  async function enroll() {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Provaryn Authenticator"
      });

      if (enrollError) throw enrollError;
      setFactorId(data.id);
      setQrSvg(data.totp.qr_code);
      setStage("enrolled");
      setNotice("Scan the QR code in your authenticator app, then enter the 6-digit code.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to enroll MFA.");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!factorId) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verified = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode.trim()
      });

      if (verified.error) throw verified.error;
      setNotice("MFA is active for this account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify MFA code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="kicker">Security Center</p>
      <h1 className="text-3xl font-display mt-2">MFA Setup</h1>
      <p className="text-muted mt-3">Use authenticator-based MFA for stronger account protection before linking coach/program access.</p>

      <div className="mt-6 rounded-xl border border-border bg-panel2 p-4 text-sm text-muted space-y-4">
        {stage === "idle" ? (
          <button disabled={loading} type="button" onClick={enroll} className="rounded-xl bg-accent px-4 py-2 text-black font-semibold disabled:opacity-60">
            {loading ? "Preparing..." : "Generate Authenticator QR"}
          </button>
        ) : null}

        {stage === "enrolled" && qrSrc ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-white p-3 inline-block">
              <img src={qrSrc} alt="MFA QR code" className="h-44 w-44" />
            </div>
            <div className="space-y-2">
              <input
                className="w-full rounded-xl bg-panel border border-border px-3 py-2 text-text"
                placeholder="6-digit code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
              />
              <button disabled={loading || verifyCode.trim().length < 6} type="button" onClick={verify} className="rounded-xl bg-accent px-4 py-2 text-black font-semibold disabled:opacity-60">
                {loading ? "Verifying..." : "Verify MFA"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-risk">{error}</p> : null}
        {notice ? <p className="text-success">{notice}</p> : null}
      </div>
    </div>
  );
}

export default function MfaSetupPage() {
  return (
    <div>
      <p className="kicker">Security Center</p>
      <h1 className="text-3xl font-display mt-2">MFA Setup</h1>
      <p className="text-muted mt-3">Use authenticator-based MFA for stronger account protection before linking coach/program access.</p>
      <div className="mt-6 rounded-xl border border-border bg-panel2 p-4 text-sm text-muted">MFA enrollment flow is wired for Supabase factor APIs.</div>
    </div>
  );
}
import { Card } from "@/components/ui/card";

const controls = [
  "Row-level security across user, coach, and organization scoped records",
  "Consent-driven sharing controls with revocation and export workflows",
  "Signed document access and private storage buckets for uploads and generated exports",
  "Sensitive action audit logging for permissions, billing, and security changes",
  "MFA enrollment support and login alert settings",
  "AI recommendation transparency with confidence and data lineage summaries"
];

export default function SecurityPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
      <section className="space-y-4">
        <p className="kicker">Security & Privacy</p>
        <h1 className="text-4xl md:text-5xl font-display">Trust Architecture for Sensitive Service and Health Data</h1>
        <p className="text-muted max-w-3xl">The platform is designed around least-privilege access, auditable operations, and user-controlled sharing.</p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {controls.map((control) => (
          <Card key={control} className="p-6">
            <p className="text-sm text-muted">{control}</p>
          </Card>
        ))}
      </section>

      <Card className="p-6 md:p-8">
        <h2 className="text-2xl font-display">Security Center In-App</h2>
        <p className="text-muted mt-3">Users can manage MFA state, login alerts, and review audit events from settings without external support tickets.</p>
      </Card>
    </div>
  );
}

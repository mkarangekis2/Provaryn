import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";

export function FeaturePage({
  title,
  subtitle,
  description,
  metrics,
  highlights
}: {
  title: string;
  subtitle: string;
  description: string;
  metrics: Array<{ label: string; value: string; tone?: "default" | "success" | "warning" | "risk" | "ai" }>;
  highlights: string[];
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title={title} subtitle={subtitle} />
      <Card className="p-6 md:p-8">
        <p className="text-muted max-w-3xl">{description}</p>
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          {metrics.map((metric) => (
            <Card key={metric.label} className="p-4 bg-panel2/70">
              <p className="text-xs text-muted">{metric.label}</p>
              <p className="text-2xl font-display mt-2">{metric.value}</p>
              <Badge className="mt-3" tone={metric.tone ?? "default"}>Operational</Badge>
            </Card>
          ))}
        </div>
      </Card>
      <Card className="p-6 md:p-8">
        <h3 className="font-display text-xl">Next Best Actions</h3>
        <ul className="mt-4 space-y-3">
          {highlights.map((item) => (
            <li key={item} className="rounded-xl border border-border bg-panel2/50 px-4 py-3 text-sm text-muted">{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
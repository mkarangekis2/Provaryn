import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionHeader({ title, subtitle, action, className }: { title: string; subtitle?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <p className="kicker">{subtitle ? "Operational Insight" : ""}</p>
        <h2 className="text-2xl font-display">{title}</h2>
        {subtitle ? <p className="text-muted mt-1">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

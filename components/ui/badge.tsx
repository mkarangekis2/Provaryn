import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({ className, tone = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "success" | "warning" | "risk" | "ai" }) {
  const toneClass = {
    default: "bg-panel2 text-text",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    risk: "bg-risk/20 text-risk",
    ai: "bg-ai/20 text-ai"
  }[tone];

  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneClass, className)} {...props} />;
}

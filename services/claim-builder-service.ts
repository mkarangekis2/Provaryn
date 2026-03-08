import { randomUUID } from "node:crypto";

export function generateNarrative(input: {
  conditionLabel?: string;
  narrativeType: "condition" | "service_impact" | "event";
  keySignals: string[];
}) {
  const intro =
    input.narrativeType === "service_impact"
      ? "Throughout military service, these health effects progressively impacted duty performance and daily function."
      : input.narrativeType === "event"
      ? "This narrative documents a service-related event and its persistent effects."
      : `This statement describes the service-connected pattern for ${input.conditionLabel ?? "the condition"}.`;

  const body =
    input.keySignals.length > 0
      ? `Key supporting factors include: ${input.keySignals.slice(0, 6).join("; ")}.`
      : "Symptoms and service context have been documented through recurring check-ins, event logs, and supporting records.";

  const close = "I request this evidence be considered in full as part of the VA claim evaluation.";

  return {
    id: randomUUID(),
    content: `${intro}\n\n${body}\n\n${close}`
  };
}

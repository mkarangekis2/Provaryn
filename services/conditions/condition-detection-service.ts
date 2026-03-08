import type { CheckInInput, DocumentExtractionInput, EventLogInput } from "@/types/intelligence";

export type DetectedCondition = {
  id: string;
  label: string;
  category: string;
  confidence: number;
  readiness: number;
  serviceConnection: number;
  diagnosisStatus: "confirmed" | "suspected" | "missing";
  evidenceSignals: string[];
  urgency: "low" | "medium" | "high";
};

function conditionId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function detectConditions(input: {
  checkIns: CheckInInput[];
  events: EventLogInput[];
  extractions: DocumentExtractionInput[];
}): DetectedCondition[] {
  const signals = new Map<string, { points: number; tags: Set<string>; diagnosisHits: number; serviceHits: number }>();

  const track = (label: string, points: number, tag: string, diagnosisHit = false, serviceHit = false) => {
    const current = signals.get(label) ?? { points: 0, tags: new Set<string>(), diagnosisHits: 0, serviceHits: 0 };
    current.points += points;
    current.tags.add(tag);
    if (diagnosisHit) current.diagnosisHits += 1;
    if (serviceHit) current.serviceHits += 1;
    signals.set(label, current);
  };

  for (const session of input.checkIns) {
    for (const entry of session.entries) {
      if (entry.category === "musculoskeletal" && entry.severity >= 4) track("Lumbar Strain", 8, "Recurring musculoskeletal check-ins", false, true);
      if (entry.category === "headaches" && entry.frequency >= 2) track("Headache Condition", 6, "Weekly headache logs", false, true);
      if (entry.category === "hearing" && entry.severity >= 3) track("Tinnitus", 6, "Hearing symptom pattern", false, true);
      if (entry.category === "mood_stress" && entry.severity >= 4) track("Stress-Related Disorder", 7, "Mood/stress trend", false, true);
      if (entry.category === "sleep" && entry.frequency >= 3) track("Sleep Disturbance", 5, "Sleep disruption pattern", false, false);
    }
  }

  for (const event of input.events) {
    const text = `${event.eventType} ${event.description}`.toLowerCase();
    if (text.includes("blast")) {
      track("Headache Condition", 7, "Blast-related event", false, true);
      track("Tinnitus", 7, "Blast/noise exposure event", false, true);
    }
    if (text.includes("injury") || text.includes("back")) track("Lumbar Strain", 6, "Injury event support", false, true);
    if (text.includes("diagnosis")) track("Lumbar Strain", 4, "Diagnosis update event", true, true);
  }

  for (const extraction of input.extractions) {
    const data = extraction.extracted;
    const allText = `${data.diagnoses.join(" ")} ${data.symptoms.join(" ")} ${data.conditionTags.join(" ")}`.toLowerCase();

    if (allText.includes("lumbar") || allText.includes("back")) track("Lumbar Strain", 12, "Documented lumbar/back evidence", true, true);
    if (allText.includes("tinnitus") || allText.includes("ringing")) track("Tinnitus", 12, "Documented hearing evidence", true, true);
    if (allText.includes("headache") || allText.includes("migraine")) track("Headache Condition", 10, "Documented headache evidence", true, true);
    if (allText.includes("stress") || allText.includes("anxiety") || allText.includes("ptsd")) track("Stress-Related Disorder", 10, "Documented mental health evidence", true, true);
  }

  return Array.from(signals.entries())
    .map(([label, value]) => {
      const confidence = Math.min(0.98, 0.3 + value.points / 100);
      const readiness = Math.min(100, Math.round(value.points * 1.8));
      const serviceConnection = Math.min(100, Math.round((value.serviceHits * 18) + value.points * 0.5));
      const diagnosisStatus = value.diagnosisHits > 1 ? "confirmed" : value.diagnosisHits === 1 ? "suspected" : "missing";
      const urgency = readiness < 45 ? "high" : readiness < 70 ? "medium" : "low";

      return {
        id: conditionId(label),
        label,
        category: label.includes("Stress") ? "mental_health" : label.includes("Tinnitus") ? "hearing" : label.includes("Headache") ? "neurological" : "musculoskeletal",
        confidence,
        readiness,
        serviceConnection,
        diagnosisStatus,
        evidenceSignals: Array.from(value.tags),
        urgency
      } satisfies DetectedCondition;
    })
    .sort((a, b) => b.readiness - a.readiness);
}

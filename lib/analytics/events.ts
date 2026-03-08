export type AnalyticsEventName =
  | "signup_started"
  | "signup_completed"
  | "onboarding_completed"
  | "reconstruction_unlocked"
  | "first_checkin_completed"
  | "first_upload_completed"
  | "first_condition_detected"
  | "transition_mode_entered"
  | "claim_builder_started"
  | "claim_package_generated"
  | "upgrade_purchased"
  | "coach_relationship_created";

export function trackEvent(name: AnalyticsEventName, payload: Record<string, unknown>) {
  const body = JSON.stringify({ name, payload, userId: payload.userId });
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/event", blob);
      return;
    }
    if (typeof fetch !== "undefined") {
      void fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
    }
  } catch {
    console.info("analytics_event_fallback", { name, payload, at: new Date().toISOString() });
  }
}

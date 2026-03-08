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
  console.info("analytics_event", { name, payload, at: new Date().toISOString() });
}

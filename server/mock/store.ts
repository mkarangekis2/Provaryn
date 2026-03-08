export type ServiceProfileInput = {
  userId: string;
  branch: string;
  component: string;
  rank: string;
  mos: string;
  yearsServed: number;
  currentStatus: string;
  etsDate?: string;
};

export type TimelineEntryInput = {
  userId: string;
  entryType: string;
  title: string;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
};

export type EventLogInput = {
  userId: string;
  eventType: string;
  occurredAt?: string;
  location?: string;
  unit?: string;
  description: string;
};

export type CheckInInput = {
  userId: string;
  sessionDate: string;
  entries: Array<{
    category: string;
    severity: number;
    frequency: number;
    impact: string;
    careSought: boolean;
  }>;
};

export type DocumentInput = {
  id: string;
  userId: string;
  title: string;
  docType: string;
  filename: string;
  conditionTags: string[];
  provider?: string;
  dateOfService?: string;
  extractedFromText?: string;
  createdAt: string;
};

export type DocumentExtractionInput = {
  documentId: string;
  userId: string;
  extracted: {
    provider?: string;
    facility?: string;
    encounterDate?: string;
    diagnoses: string[];
    symptoms: string[];
    medications: string[];
    limitations: string[];
    conditionTags: string[];
    confidence: number;
  };
  status: "pending_review" | "confirmed";
  updatedAt: string;
};

export type TransitionTask = {
  id: string;
  title: string;
  rationale: string;
  urgency: number;
  completed: boolean;
  relatedConditions: string[];
};

export type TransitionPlan = {
  userId: string;
  active: boolean;
  targetDate?: string;
  triggeredReason: string;
  tasks: TransitionTask[];
  updatedAt: string;
};

export type ClaimPackage = {
  id: string;
  userId: string;
  title: string;
  selectedConditions: Array<{ conditionId: string; included: boolean }>;
  forms: {
    profileReviewed: boolean;
    serviceHistoryReviewed: boolean;
    evidenceMappingReviewed: boolean;
    narrativeReviewed: boolean;
  };
  updatedAt: string;
};

export type GeneratedNarrative = {
  id: string;
  packageId: string;
  userId: string;
  conditionId?: string;
  narrativeType: "condition" | "service_impact" | "event";
  content: string;
  version: number;
  createdAt: string;
};

export type ClaimStatusRecord = {
  userId: string;
  stage: "preparing" | "submitted" | "evidence_gathering" | "review" | "decision" | "appeal";
  updatedAt: string;
  notes?: string;
};

export type PermissionCenter = {
  userId: string;
  shareReadinessWithCoach: boolean;
  shareDocumentsWithCoach: boolean;
  organizationAccessEnabled: boolean;
  exportRequested: boolean;
  updatedAt: string;
};

export type SecurityCenter = {
  userId: string;
  mfaEnabled: boolean;
  loginAlertsEnabled: boolean;
  trustedDeviceCount: number;
  recentEvents: Array<{ id: string; label: string; at: string }>;
  updatedAt: string;
};

export type AuditEntry = {
  id: string;
  userId: string;
  action: string;
  category: "security" | "permissions" | "billing" | "data" | "ai" | "system";
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type BillingEvent = {
  id: string;
  userId: string;
  eventType: "reconstruction_unlock" | "premium_subscription" | "claim_builder_package";
  active: boolean;
  source: "manual" | "stripe";
  createdAt: string;
};

export type NotificationPreferences = {
  userId: string;
  weeklyCheckInReminder: boolean;
  transitionTaskReminder: boolean;
  evidenceGapReminder: boolean;
  coachUpdates: boolean;
  productAnnouncements: boolean;
  cadence: "daily" | "weekly" | "biweekly";
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  extractionPreview?: { type: string; payload: Record<string, unknown> };
};

export type AnalyticsEvent = {
  id: string;
  userId?: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

type StoreShape = {
  serviceProfiles: Map<string, ServiceProfileInput>;
  timelineEntries: Map<string, TimelineEntryInput[]>;
  eventLogs: Map<string, EventLogInput[]>;
  checkIns: Map<string, CheckInInput[]>;
  documents: Map<string, DocumentInput[]>;
  documentExtractions: Map<string, DocumentExtractionInput>;
  transitionPlans: Map<string, TransitionPlan>;
  claimPackages: Map<string, ClaimPackage>;
  narratives: Map<string, GeneratedNarrative[]>;
  claimStatuses: Map<string, ClaimStatusRecord>;
  permissions: Map<string, PermissionCenter>;
  security: Map<string, SecurityCenter>;
  auditLogs: Map<string, AuditEntry[]>;
  billingEvents: Map<string, BillingEvent[]>;
  notificationPrefs: Map<string, NotificationPreferences>;
  chatMessages: Map<string, ChatMessage[]>;
  analyticsEvents: AnalyticsEvent[];
};

const globalStore = globalThis as unknown as { __valorStore?: StoreShape };

function initStore(): StoreShape {
  return {
    serviceProfiles: new Map(),
    timelineEntries: new Map(),
    eventLogs: new Map(),
    checkIns: new Map(),
    documents: new Map(),
    documentExtractions: new Map(),
    transitionPlans: new Map(),
    claimPackages: new Map(),
    narratives: new Map(),
    claimStatuses: new Map(),
    permissions: new Map(),
    security: new Map(),
    auditLogs: new Map(),
    billingEvents: new Map(),
    notificationPrefs: new Map(),
    chatMessages: new Map(),
    analyticsEvents: []
  };
}

export function getStore() {
  if (!globalStore.__valorStore) {
    globalStore.__valorStore = initStore();
  }
  return globalStore.__valorStore;
}

export function upsertServiceProfile(input: ServiceProfileInput) {
  const store = getStore();
  store.serviceProfiles.set(input.userId, input);
  return input;
}

export function getServiceProfile(userId: string) {
  return getStore().serviceProfiles.get(userId) ?? null;
}

export function addTimelineEntry(input: TimelineEntryInput) {
  const store = getStore();
  const entries = store.timelineEntries.get(input.userId) ?? [];
  entries.unshift(input);
  store.timelineEntries.set(input.userId, entries);
  return input;
}

export function addEventLog(input: EventLogInput) {
  const store = getStore();
  const entries = store.eventLogs.get(input.userId) ?? [];
  entries.unshift(input);
  store.eventLogs.set(input.userId, entries);
  return input;
}

export function listEventLogs(userId: string) {
  return getStore().eventLogs.get(userId) ?? [];
}

export function addCheckIn(input: CheckInInput) {
  const store = getStore();
  const entries = store.checkIns.get(input.userId) ?? [];
  entries.unshift(input);
  store.checkIns.set(input.userId, entries);
  return input;
}

export function listCheckIns(userId: string) {
  return getStore().checkIns.get(userId) ?? [];
}

export function addDocument(input: DocumentInput) {
  const store = getStore();
  const documents = store.documents.get(input.userId) ?? [];
  documents.unshift(input);
  store.documents.set(input.userId, documents);
  return input;
}

export function listDocuments(userId: string) {
  return getStore().documents.get(userId) ?? [];
}

export function getDocument(userId: string, documentId: string) {
  return listDocuments(userId).find((doc) => doc.id === documentId) ?? null;
}

export function upsertDocumentExtraction(input: DocumentExtractionInput) {
  const store = getStore();
  store.documentExtractions.set(input.documentId, input);
  return input;
}

export function getDocumentExtraction(documentId: string) {
  return getStore().documentExtractions.get(documentId) ?? null;
}

export function listDocumentExtractions(userId: string) {
  return Array.from(getStore().documentExtractions.values()).filter((item) => item.userId === userId);
}

export function upsertTransitionPlan(plan: TransitionPlan) {
  getStore().transitionPlans.set(plan.userId, plan);
  return plan;
}

export function getTransitionPlan(userId: string) {
  return getStore().transitionPlans.get(userId) ?? null;
}

export function updateTransitionTask(userId: string, taskId: string, completed: boolean) {
  const plan = getTransitionPlan(userId);
  if (!plan) return null;
  plan.tasks = plan.tasks.map((task) => (task.id === taskId ? { ...task, completed } : task));
  plan.updatedAt = new Date().toISOString();
  getStore().transitionPlans.set(userId, plan);
  return plan;
}

export function upsertClaimPackage(input: ClaimPackage) {
  getStore().claimPackages.set(input.userId, input);
  return input;
}

export function getClaimPackage(userId: string) {
  return getStore().claimPackages.get(userId) ?? null;
}

export function upsertNarrative(input: GeneratedNarrative) {
  const narratives = getStore().narratives.get(input.packageId) ?? [];
  narratives.unshift(input);
  getStore().narratives.set(input.packageId, narratives);
  return input;
}

export function listNarratives(packageId: string) {
  return getStore().narratives.get(packageId) ?? [];
}

export function upsertClaimStatus(input: ClaimStatusRecord) {
  getStore().claimStatuses.set(input.userId, input);
  return input;
}

export function getClaimStatus(userId: string) {
  return getStore().claimStatuses.get(userId) ?? null;
}

export function upsertPermissionCenter(input: PermissionCenter) {
  getStore().permissions.set(input.userId, input);
  return input;
}

export function getPermissionCenter(userId: string) {
  return getStore().permissions.get(userId) ?? null;
}

export function upsertSecurityCenter(input: SecurityCenter) {
  getStore().security.set(input.userId, input);
  return input;
}

export function getSecurityCenter(userId: string) {
  return getStore().security.get(userId) ?? null;
}

export function addAuditEntry(userId: string, entry: Omit<AuditEntry, "userId">) {
  const logs = getStore().auditLogs.get(userId) ?? [];
  logs.unshift({ ...entry, userId });
  getStore().auditLogs.set(userId, logs);
  return logs[0];
}

export function listAuditEntries(userId: string) {
  return getStore().auditLogs.get(userId) ?? [];
}

export function addBillingEvent(input: BillingEvent) {
  const events = getStore().billingEvents.get(input.userId) ?? [];
  events.unshift(input);
  getStore().billingEvents.set(input.userId, events);
  return input;
}

export function listBillingEvents(userId: string) {
  return getStore().billingEvents.get(userId) ?? [];
}

export function upsertNotificationPreferences(input: NotificationPreferences) {
  getStore().notificationPrefs.set(input.userId, input);
  return input;
}

export function getNotificationPreferences(userId: string) {
  return getStore().notificationPrefs.get(userId) ?? null;
}

export function addChatMessage(userId: string, message: ChatMessage) {
  const messages = getStore().chatMessages.get(userId) ?? [];
  messages.push(message);
  getStore().chatMessages.set(userId, messages);
  return message;
}

export function listChatMessages(userId: string) {
  return getStore().chatMessages.get(userId) ?? [];
}

export function addAnalyticsEvent(event: AnalyticsEvent) {
  const store = getStore();
  store.analyticsEvents.unshift(event);
  return event;
}

export function listAnalyticsEvents() {
  return getStore().analyticsEvents;
}

export function getUserSnapshot(userId: string) {
  const store = getStore();
  const checkIns = store.checkIns.get(userId) ?? [];
  const events = store.eventLogs.get(userId) ?? [];
  const timeline = store.timelineEntries.get(userId) ?? [];
  const profile = store.serviceProfiles.get(userId) ?? null;
  const documents = store.documents.get(userId) ?? [];

  const symptomLogCount = checkIns.reduce((sum, session) => sum + session.entries.length, 0);
  const highSeverityCount = checkIns.reduce(
    (sum, session) => sum + session.entries.filter((entry) => entry.severity >= 7).length,
    0
  );

  return {
    profile,
    counts: {
      checkIns: checkIns.length,
      symptomEntries: symptomLogCount,
      highSeverityEntries: highSeverityCount,
      events: events.length,
      timelineEntries: timeline.length,
      documents: documents.length
    },
    recent: {
      checkIns: checkIns.slice(0, 3),
      events: events.slice(0, 3),
      timeline: timeline.slice(0, 3),
      documents: documents.slice(0, 3)
    }
  };
}

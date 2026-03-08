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


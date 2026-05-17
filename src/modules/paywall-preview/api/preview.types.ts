export type PreviewStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "requires_review"
  | "error";

export type PreviewState =
  | "loading"
  | "not_started"
  | "in_progress"
  | "blocked"
  | "requires_review"
  | "error"
  | "unlocked";

export type AlertLevel = "low" | "medium" | "high" | "unknown";

export type PreviewCtaTarget = "checkout" | "analysis" | "review";

export interface PreviewSummary {
  title: string;
  limitedText: string;
  mainFindingTeaser?: string;
  alertLevel?: AlertLevel;
  completionScore?: number;
  confidenceScore?: number;
  requiresHumanReview?: boolean;
  hiddenValueHint?: string;
  missingItems?: string[];
}

export interface LockedFeature {
  key: string;
  title: string;
  description?: string;
  isHighlighted?: boolean;
}

export interface PreviewResponse {
  caseId: string;
  previewId: string;
  status: PreviewStatus;
  isUnlocked: boolean;
  summary: PreviewSummary;
  lockedContent: {
    blurredSections: string[];
    features: LockedFeature[];
  };
  cta: {
    label: string;
    target: PreviewCtaTarget;
    checkoutUrl?: string;
    priceLabel?: string;
    disclaimer: string;
  };
  comparison: {
    free: string[];
    paid: string[];
  };
  warnings: Array<{
    code?: string;
    message: string;
  }>;
  blockedReason?: string;
  statusMessage?: string;
}

export type ConversionEventName =
  | "paywall_viewed"
  | "preview_cta_clicked"
  | "checkout_started"
  | "checkout_returned"
  | "unlock_abandoned"
  | "comparison_viewed"
  | "locked_feature_clicked";

export interface ConversionEventPayload {
  caseId?: string;
  eventName: ConversionEventName;
  source: "web" | "mobile_web";
  metadata?: Record<string, unknown>;
}

export interface CheckoutSessionResponse {
  checkoutSessionId: string;
  checkoutUrl: string;
  expiresAt?: string;
  provider: "epayco" | string;
  checkoutType: "onpage" | string;
  testMode: boolean;
  providerSessionToken?: string | null;
}

export interface CreatePreviewPayload {
  forceRefresh?: boolean;
  reason?: string;
}

export interface PreviewErrorState {
  message: string;
  code?: string;
  status?: number;
}

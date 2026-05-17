export type ResultStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "requires_review"
  | "approved"
  | "rejected"
  | "error";

export type FinalViabilityLevel =
  | "high"
  | "medium"
  | "low"
  | "incomplete"
  | "not_applicable";

export type ResultTone = "success" | "warning" | "danger" | "neutral" | "info";

export interface CaseResultResponse {
  caseId: string;
  caseCode: string;
  resultId: string | null;
  version: number | null;
  status: ResultStatus;
  isVisibleToUser: boolean;
  generatedAt: string | null;
  headline: string | null;
  executiveSummary: string | null;
  userExplanation: string | null;
  legalDisclaimer: string | null;
  finalViability: FinalViability | null;
  economicEstimate: EconomicEstimate | null;
  mainInconsistency: MainInconsistency | null;
  cards: ResultCard[];
  inconsistencies: ResultInconsistency[];
  recommendedRoute: RecommendedRoute | null;
  missingDocuments: MissingDocument[];
  warnings: ResultWarning[];
  blockers: ResultBlocker[];
  availableActions: ResultAction[];
}

export interface FinalViability {
  level: FinalViabilityLevel;
  label: string;
  score: number | null;
  color: "green" | "yellow" | "orange" | "red" | "gray";
  rationale: string;
  strengths?: string[];
  weaknesses?: string[];
  missingInformation?: string[];
}

export interface EconomicEstimate {
  currency: "COP";
  hasEconomicEstimate: boolean;
  estimatedClaimableAmount: number | null;
  estimatedRetroactiveAmount: number | null;
  estimatedMonthlyDifference: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  warnings: string[];
  assumptions: string[];
}

export interface MainInconsistency {
  title: string;
  description: string;
  impact?: "high" | "medium" | "low";
  confidenceScore?: number | null;
}

export interface ResultCard {
  key: string;
  title: string;
  value: string | null;
  description?: string | null;
  icon?: string | null;
  tone: ResultTone;
  metadata?: Record<string, unknown>;
}

export type ResultImpact = "high" | "medium" | "low" | "none";

export interface ResultInconsistency {
  id: string;
  inconsistencyType: string;
  title: string;
  description: string;
  evidenceSummary: string | null;
  legalImpact: ResultImpact;
  economicImpact: ResultImpact;
  estimatedAmount: number | null;
  confidenceScore: number | null;
  requiredDocuments: MissingDocument[];
}

export interface RecommendedRoute {
  routeType:
    | "no_action"
    | "collect_more_documents"
    | "administrative_claim"
    | "reliquidation_request"
    | "petition_right"
    | "legal_claim_draft"
    | "professional_review"
    | "low_viability"
    | "incomplete_case";
  title: string;
  description: string;
  nextActionLabel: string | null;
  nextActionType: string | null;
  nextActionUrl: string | null;
  requiresDocuments: boolean;
  requiresProfessionalReview: boolean;
  canGenerateLegalAction: boolean;
  recommendedLegalActionType: string | null;
  rationale: string;
  blockers: ResultBlocker[];
  requiredDocuments: MissingDocument[];
}

export interface MissingDocument {
  id?: string;
  name: string;
  description?: string;
  required: boolean;
  priority: "high" | "medium" | "low";
  uploadUrl?: string | null;
}

export interface ResultWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

export interface ResultBlocker {
  code: string;
  message: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
}

export interface ResultAction {
  type:
    | "generate_report"
    | "generate_executive_summary"
    | "generate_legal_action"
    | "upload_missing_documents"
    | "request_professional_review"
    | "go_to_payment"
    | "retry_analysis";
  label: string;
  enabled: boolean;
  href: string | null;
  disabledReason?: string | null;
}

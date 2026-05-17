export type FullAnalysisStatus =
  | "not_started"
  | "queued"
  | "in_progress"
  | "rules_running"
  | "calculations_running"
  | "scenario_comparison_running"
  | "confidence_evaluation_running"
  | "requires_review"
  | "completed"
  | "blocked"
  | "failed"
  | "cancelled";

export type StepStatus =
  | "pending"
  | "active"
  | "completed"
  | "warning"
  | "error"
  | "blocked";

export type ResultStatus =
  | "well_liquidated"
  | "possible_error"
  | "relevant_error"
  | "insufficient_information";

export type ViabilityLevel = "high" | "medium" | "low" | "insufficient_information";

export type RecommendedRoute =
  | "no_action"
  | "request_documents"
  | "administrative_claim"
  | "reliquidation_request"
  | "petition"
  | "lawsuit_draft"
  | "professional_review";

export type ConfidenceLevel = "high" | "medium" | "low" | "critical";

export type RuleResult =
  | "passed"
  | "failed"
  | "not_applicable"
  | "warning"
  | "inconclusive";

export type CalculationUnit =
  | "COP"
  | "weeks"
  | "days"
  | "months"
  | "percentage";

export type ScenarioType =
  | "recognized_by_entity"
  | "calculated_correct"
  | "alternative"
  | "missing_documents"
  | "user_claimed";

export type InconsistencySeverity = "low" | "medium" | "high" | "critical";

export type SourceRefType =
  | "document"
  | "extracted_fact"
  | "legal_rule"
  | "calculation"
  | "questionnaire_answer";

export type FullAnalysisBlockedReason =
  | "payment_required"
  | "payment_pending"
  | "missing_documents"
  | "validation_incomplete"
  | "consent_required"
  | "case_not_ready"
  | "unknown";

export interface SourceRef {
  type: SourceRefType;
  id: string;
  label: string;
}

export interface AnalysisStep {
  key: string;
  label: string;
  status: StepStatus;
}

export interface FullAnalysisProgress {
  percentage: number;
  currentStep: string;
  steps: AnalysisStep[];
}

export interface ExecutiveResult {
  resultStatus: ResultStatus;
  viabilityLevel: ViabilityLevel;
  recommendedRoute: RecommendedRoute;
  estimatedDifference?: number;
  currency?: "COP";
  mainFinding: string;
}

export interface FullAnalysisConfidenceSummary {
  globalScore: number;
  level: ConfidenceLevel;
  requiresHumanReview: boolean;
  reasons: string[];
}

export interface FullAnalysisWarning {
  code: string;
  message: string;
}

export interface FullAnalysisReadinessItem {
  key: string;
  label: string;
  ready: boolean;
  description?: string;
}

export interface FullAnalysisReviewGuidance {
  title: string;
  message: string;
  reasons: string[];
}

export interface FullAnalysis {
  id: string;
  caseId: string;
  status: FullAnalysisStatus;
  version: number;
  progress: FullAnalysisProgress;
  executiveResult?: ExecutiveResult;
  confidence?: FullAnalysisConfidenceSummary;
  readiness: FullAnalysisReadinessItem[];
  warnings: FullAnalysisWarning[];
  reviewGuidance?: FullAnalysisReviewGuidance;
  blockedReason?: FullAnalysisBlockedReason;
  canStart: boolean;
  canRetry: boolean;
  createdAt?: string;
  completedAt?: string;
}

export interface LegalRuleResult {
  id: string;
  ruleCode: string;
  ruleName: string;
  category: string;
  result: RuleResult;
  explanation: string;
  sourceRefs: SourceRef[];
  confidence: number;
  requiresReview: boolean;
  version?: string;
  warnings: FullAnalysisWarning[];
}

export interface CalculationResult {
  id: string;
  calculationCode: string;
  name: string;
  type: string;
  inputValues: Record<string, unknown>;
  formulaExpression?: string;
  resultValue?: number;
  resultUnit?: CalculationUnit;
  resultDetail?: Record<string, unknown>;
  sourceRefs: SourceRef[];
  confidence: number;
  warnings: FullAnalysisWarning[];
}

export interface Scenario {
  id: string;
  scenarioType: ScenarioType;
  name: string;
  description?: string;
  amountEstimated?: number;
  weeksEstimated?: number;
  retroactiveEstimated?: number;
  differenceVsRecognized?: number;
  confidence: number;
  warnings: FullAnalysisWarning[];
}

export interface AnalysisInconsistency {
  id: string;
  type: string;
  severity: InconsistencySeverity;
  title: string;
  description: string;
  evidenceRefs: SourceRef[];
  legalImpact?: string;
  economicImpactEstimated?: number;
  missingDocuments: string[];
  recommendedAction?: string;
  confidence: number;
  relatedRuleId?: string;
  relatedCalculationId?: string;
}

export interface ConfidenceBreakdownItem {
  key: string;
  label: string;
  score: number;
  level: ConfidenceLevel;
  reasons: string[];
}

export interface ConfidenceResponse {
  globalScore: number;
  level: ConfidenceLevel;
  requiresHumanReview: boolean;
  reasons: string[];
  breakdown: ConfidenceBreakdownItem[];
  warnings: FullAnalysisWarning[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface RulesQuery {
  filter?: "all" | "applied" | "warnings" | "not_applicable" | "inconclusive" | "requires_review";
}

export interface CalculationsQuery {
  type?: string;
}

export interface StartFullAnalysisPayload {
  reason?: string;
}

export interface RetryFullAnalysisPayload {
  reason?: string;
}

export interface FullAnalysisStartResponse {
  analysis: FullAnalysis;
}

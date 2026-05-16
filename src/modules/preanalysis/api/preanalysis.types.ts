export type PreAnalysisStatus =
  | "not_started"
  | "queued"
  | "in_progress"
  | "completed"
  | "blocked"
  | "requires_review"
  | "error";

export type TrafficLight = "green" | "yellow" | "red" | "gray";
export type ViabilityLevel = "high" | "medium" | "low" | "insufficient";
export type IssueSeverity = "low" | "medium" | "high";
export type MissingDocumentPriority = "required" | "recommended" | "optional";

export type MissingDocumentStatus =
  | "pending"
  | "uploaded"
  | "waived"
  | "not_applicable";

export type PreAnalysisCtaType =
  | "unlock_full_analysis"
  | "upload_missing_docs"
  | "wait_review";

export type BlockedReason =
  | "missing_consent"
  | "missing_main_document"
  | "document_rejected"
  | "extraction_not_ready"
  | "questionnaire_required"
  | "case_not_found"
  | "permission_denied"
  | "unknown";

export interface PreIssueDto {
  id: string;
  type: string;
  severity: IssueSeverity;
  title: string;
  publicSummary: string;
  lockedDetailAvailable: boolean;
  confidence?: number;
}

export interface MissingDocumentDto {
  id: string;
  documentType: string;
  title: string;
  priority: MissingDocumentPriority;
  reason?: string;
  status: MissingDocumentStatus;
}

export interface PreAnalysisCtaDto {
  type: PreAnalysisCtaType;
  label: string;
  description?: string;
}

export interface PreAnalysisWarningDto {
  code: string;
  message: string;
}

export interface PreAnalysisResultDto {
  id: string;
  caseId: string;
  status: PreAnalysisStatus;
  trafficLight?: TrafficLight;
  viabilityLevel?: ViabilityLevel;
  completionScore?: number;
  confidence?: number;
  progress?: number;
  currentStep?: string;
  preliminaryCaseType?: string;
  limitedSummary?: string;
  valueDetected?: {
    title: string;
    summary: string;
  };
  issues: PreIssueDto[];
  missingDocuments: MissingDocumentDto[];
  cta?: PreAnalysisCtaDto;
  warnings: PreAnalysisWarningDto[];
  blockedReason?: BlockedReason;
  canRetry?: boolean;
  createdAt?: string;
  completedAt?: string;
}

export interface PreAnalysisStatusDto {
  id?: string;
  caseId: string;
  status: PreAnalysisStatus;
  trafficLight?: TrafficLight;
  viabilityLevel?: ViabilityLevel;
  progress?: number;
  currentStep?: string;
  blockedReason?: BlockedReason;
  updatedAt?: string;
}

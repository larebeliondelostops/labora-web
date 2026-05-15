export type ExtractionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "requires_review"
  | "error";

export type ExtractionConfirmationStatus =
  | "draft"
  | "ai_extracted"
  | "user_reviewing"
  | "user_confirmed"
  | "confirmed_with_pending_fields"
  | "admin_review_required"
  | "admin_approved"
  | "rejected"
  | "superseded";

export type FieldStatus =
  | "extracted"
  | "normalized"
  | "low_confidence"
  | "corrected_by_user"
  | "corrected_by_admin"
  | "pending_user_confirmation"
  | "confirmed"
  | "ignored"
  | "conflict";

export type EmployerType = "private" | "public" | "teacher" | "unknown";
export type LaborPeriodType = "worked" | "contributed" | "reported" | "gap" | "unknown";
export type RegimeHint = "general" | "public" | "teacher" | "special" | "unknown";
export type ExtractionIssueSeverity = "info" | "warning" | "critical";
export type ExtractionIssueStatus = "open" | "resolved" | "dismissed" | "pending";

export type ExtractionTab =
  | "summary"
  | "pdf-data"
  | "timeline"
  | "employers"
  | "weeks"
  | "salaries"
  | "gaps"
  | "corrections"
  | "confirm";

export type ExtractionSummary = {
  employersCount: number;
  laborPeriodsCount: number;
  contributionWeeksTotal: number;
  salaryBasesCount: number;
  gapsCount: number;
  noveltiesCount: number;
};

export type SourceBBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DocumentReference = {
  documentId: string;
  documentName?: string;
  page?: number;
  bbox?: SourceBBox;
  sourceText?: string;
  fieldId?: string;
};

export type Employer = {
  id: string;
  name: string;
  rawName?: string;
  nit?: string;
  employerType?: EmployerType;
  confidence?: number;
  status: FieldStatus;
};

export type LaborPeriod = {
  id: string;
  employerId?: string;
  employerName?: string;
  startDate: string;
  endDate?: string | null;
  periodType: LaborPeriodType;
  regimeHint?: RegimeHint;
  weeksDetected?: number;
  daysDetected?: number;
  salaryBaseDetected?: number;
  novelty?: string;
  confidence?: number;
  status: FieldStatus;
  source?: DocumentReference;
};

export type ContributionWeek = {
  id: string;
  year: number;
  month?: number;
  employerId?: string;
  employerName?: string;
  weeks: number;
  confidence?: number;
  status: FieldStatus;
  source?: DocumentReference;
};

export type SalaryBase = {
  id: string;
  year: number;
  month?: number;
  employerId?: string;
  employerName?: string;
  originalValue?: number | null;
  normalizedValue?: number | null;
  confidence?: number;
  status: FieldStatus;
  source?: DocumentReference;
};

export type ContributionGap = {
  id: string;
  startDate?: string | null;
  endDate?: string | null;
  days?: number;
  weeks?: number;
  reason?: string;
  confidence?: number;
  status: FieldStatus;
  source?: DocumentReference;
};

export type LaborNovelty = {
  id: string;
  type: string;
  title: string;
  description?: string;
  severity: ExtractionIssueSeverity;
  status: ExtractionIssueStatus;
  source?: DocumentReference;
};

export type ExtractionIssue = {
  id: string;
  type: string;
  severity: ExtractionIssueSeverity;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  fieldKey?: string;
  status: ExtractionIssueStatus;
  suggestedAction?: string;
  source?: DocumentReference;
};

export type CorrectionItem = {
  id: string;
  entityType: string;
  entityId?: string;
  fieldKey: string;
  label?: string;
  previousValue?: unknown;
  newValue?: unknown;
  actorName?: string;
  actorRole?: string;
  reason?: string;
  createdAt: string;
};

export type ExtractionResponse = {
  caseId: string;
  status: ExtractionStatus;
  confirmationStatus: ExtractionConfirmationStatus;
  confidenceAvg: number | null;
  lowConfidenceCount: number;
  summary: ExtractionSummary;
  employers: Employer[];
  laborPeriods: LaborPeriod[];
  contributionWeeks: ContributionWeek[];
  salaryBases: SalaryBase[];
  gaps: ContributionGap[];
  novelties: LaborNovelty[];
  issues: ExtractionIssue[];
  documentReferences: DocumentReference[];
  canConfirm: boolean;
  blockingReasons: string[];
};

export type UpdateExtractionFieldsPayload = {
  updates: Array<{
    fieldId?: string;
    entityType: string;
    entityId?: string;
    fieldKey: string;
    newValue: unknown;
    reason?: string;
  }>;
};

export type CreateEmployerPayload = {
  name: string;
  nit?: string;
  employerType?: EmployerType;
  reason?: string;
};

export type CreateLaborPeriodPayload = {
  employerId?: string;
  startDate: string;
  endDate?: string | null;
  periodType: LaborPeriodType;
  weeksDetected?: number;
  regimeHint?: RegimeHint;
  reason?: string;
};

export type IgnoreEntityPayload = {
  reason: string;
};

export type ConfirmExtractionPayload = {
  acceptLowConfidenceFields: boolean;
  markPendingFields: boolean;
  userStatement: string;
};

export type ConfirmExtractionResponse = {
  status?: ExtractionStatus;
  confirmationStatus?: ExtractionConfirmationStatus;
  nextStep?: "preliminary_analysis" | "preanalysis" | string;
  message?: string;
};

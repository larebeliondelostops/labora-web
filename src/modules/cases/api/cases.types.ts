export type CaseStatus =
  | "draft"
  | "created"
  | "ready_for_documents"
  | "documents_pending"
  | "documents_uploaded"
  | "preanalysis_pending"
  | "preanalysis_ready"
  | "preview_locked"
  | "paid_unlocked"
  | "analysis_in_progress"
  | "completed"
  | "requires_review"
  | "blocked"
  | "closed"
  | "archived"
  | "error";

export type CaseTypeRequested =
  | "labor_history_analysis"
  | "pension_liquidation_review"
  | "pension_reliquidation"
  | "missing_weeks_review"
  | "public_service_time_review"
  | "teacher_magisterio_case"
  | "special_regime_case"
  | "administrative_claim"
  | "lawsuit_draft_preparation"
  | "not_sure";

export type SituationType =
  | "not_pensioned_yet"
  | "pensioned_with_doubts"
  | "request_denied"
  | "recognized_with_possible_error"
  | "reliquidation_needed"
  | "missing_weeks_or_time"
  | "employer_default_or_omission"
  | "regime_transfer_issue"
  | "other"
  | "not_sure";

export type CaseNextAction =
  | "complete_case"
  | "upload_documents"
  | "start_preanalysis"
  | "view_preanalysis"
  | "unlock_full_analysis"
  | "view_report"
  | "request_review"
  | "none";

export type CaseHistorySeverity = "info" | "success" | "warning" | "error";

export type DocumentType = "CC" | "CE" | "PA" | "NIT" | "OTHER";

export interface CaseHolder {
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber?: string;
  documentNumberMasked?: string;
  birthDate?: string | null;
  email?: string | null;
  emailMasked?: string | null;
  phone?: string | null;
  phoneMasked?: string | null;
}

export interface LaboraCase {
  id: string;
  caseNumber: string;
  holderType: "self" | "third_party";
  holder: CaseHolder;
  actingAsThirdParty: boolean;
  thirdPartyRelationship?: string | null;
  thirdPartyAuthorizationStatus:
    | "not_required"
    | "pending"
    | "uploaded"
    | "verified"
    | "rejected";
  caseTypeRequested: CaseTypeRequested;
  caseTypeSuggested?: CaseTypeRequested | null;
  caseTypeConfidence?: number | null;
  pensionFundOrEntity?: string | null;
  situationType: SituationType;
  situationDescription?: string | null;
  status: CaseStatus;
  statusReason?: string | null;
  currentStep: string;
  nextBestAction: CaseNextAction;
  allowedActions: string[];
  canEdit?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaseHistoryItem {
  id: string;
  occurredAt: string;
  title: string;
  description?: string | null;
  severity: CaseHistorySeverity;
  icon?: string | null;
}

export interface CaseListResponse {
  items: LaboraCase[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CaseListParams {
  page?: number;
  pageSize?: number;
  status?: CaseStatus | "all";
  caseType?: CaseTypeRequested | "all";
  query?: string;
}

export interface CreateCasePayload {
  holderType: "self" | "third_party";
  holder: {
    firstName: string;
    lastName: string;
    documentType: DocumentType;
    documentNumber: string;
    birthDate?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  actingAsThirdParty: boolean;
  thirdPartyRelationship?: string | null;
  thirdPartyAuthorizationConfirmed?: boolean;
  caseTypeRequested: CaseTypeRequested;
  pensionFundOrEntity?: string | null;
  situationType: SituationType;
  situationDescription?: string | null;
}

export type UpdateCasePayload = Partial<
  Omit<CreateCasePayload, "holder"> & {
    holder: Partial<CreateCasePayload["holder"]>;
  }
>;

export interface CloseCasePayload {
  reason: string;
}

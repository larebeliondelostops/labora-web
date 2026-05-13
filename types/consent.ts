export type ConsentType =
  | "terms_and_conditions"
  | "personal_data_processing"
  | "sensitive_data_processing"
  | "electronic_means"
  | "ai_scope_acknowledgement";

export type ConsentComplianceStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "requires_review"
  | "error";

export interface LegalDocument {
  id: string;
  type: ConsentType;
  title: string;
  version: string;
  hashSha256: string;
  contentMarkdown: string;
  isRequired: boolean;
  effectiveFrom: string;
}

export interface ConsentStatusResponse {
  status: ConsentComplianceStatus;
  canUploadDocuments: boolean;
  requiredConsentTypes: ConsentType[];
  acceptedConsentTypes: ConsentType[];
  missingConsentTypes: ConsentType[];
  lastAcceptedAt?: string;
}

export interface SubmitConsentsRequest {
  items: Array<{
    legalDocumentId: string;
    consentType: ConsentType;
    accepted: true;
  }>;
  source: "web" | "mobile_web";
  locale: "es-CO";
}

export interface SubmitConsentsResponse {
  status?: ConsentComplianceStatus;
  canUploadDocuments?: boolean;
  acceptedAt?: string;
  nextStep?: "case" | "documents" | "dashboard";
}

export interface ConsentHistoryItem {
  id: string;
  consentType: ConsentType;
  documentTitle: string;
  legalDocumentId?: string;
  version: string;
  acceptedAt: string;
  evidenceHash?: string;
  hashSha256?: string;
}

export type DocumentTypeCategory = "principal" | "soporte" | "otro";

export type DocumentStatus =
  | "draft"
  | "uploading"
  | "uploaded"
  | "processing"
  | "validated"
  | "requires_review"
  | "rejected"
  | "replaced"
  | "deleted"
  | "failed";

export type DocumentValidationStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "requires_review"
  | "error";

export type DocumentValidationResult =
  | "accepted"
  | "accepted_with_warnings"
  | "rejected"
  | "requires_review";

export type DocumentClassificationSource = "manual" | "ai" | "system" | "unknown";

export interface DocumentTypeDefinition {
  code: string;
  name: string;
  category: DocumentTypeCategory;
  isRequiredForBasicFlow: boolean;
  isPrimaryCandidate: boolean;
  allowedMimeTypes: string[];
  maxSizeMb: number;
}

export interface DocumentTypeSummary {
  code: string;
  name: string;
}

export interface DocumentItem {
  id: string;
  caseId: string;
  displayName?: string;
  originalFilename: string;
  documentType?: DocumentTypeSummary;
  status: DocumentStatus;
  validationStatus: DocumentValidationStatus;
  validationResult?: DocumentValidationResult;
  pageCount?: number;
  sizeBytes: number;
  isPrimary: boolean;
  isDuplicate: boolean;
  aiConfidence?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDocumentUploadRequest {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  documentTypeCode?: string;
  isPrimary?: boolean;
}

export interface CreateDocumentUploadResponse {
  document: DocumentItem;
  upload?: {
    id: string;
    method: "signed_url" | "multipart";
    uploadUrl?: string;
    headers?: Record<string, string>;
    expiresAt?: string;
  };
}

export interface DocumentWarning {
  code: string;
  message: string;
  page?: number;
}

export interface DocumentValidation {
  result: DocumentValidationResult;
  score: number;
  checks: Record<string, boolean>;
  warnings: DocumentWarning[];
  errors: DocumentWarning[];
}

export interface DocumentDetail extends DocumentItem {
  mimeType: string;
  classificationSource: DocumentClassificationSource;
  validation?: DocumentValidation;
}

export interface DocumentViewUrlResponse {
  url: string;
  expiresInSeconds: number;
}

export interface UpdateDocumentRequest {
  displayName?: string;
  documentTypeCode?: string;
  isPrimary?: boolean;
}

export interface ReplaceDocumentRequest extends CreateDocumentUploadRequest {
  reason?: string;
}

export type DocumentReadinessStatus =
  | "missing_primary_document"
  | "validating"
  | "ready_for_preanalysis"
  | "requires_review"
  | "blocked";

export type DocumentReadinessNextAction =
  | "upload_primary_document"
  | "review_documents"
  | "continue_to_preanalysis";

export interface DocumentReadinessIssue {
  code: string;
  message: string;
}

export interface DocumentReadiness {
  caseId: string;
  readinessStatus: DocumentReadinessStatus;
  hasPrimaryLaborHistory: boolean;
  documentsTotal: number;
  documentsValidated: number;
  documentsWithWarnings: number;
  documentsRejected: number;
  blockingIssues: DocumentReadinessIssue[];
  warnings: DocumentReadinessIssue[];
  nextAction?: DocumentReadinessNextAction;
}

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

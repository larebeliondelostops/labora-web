export type DocumentPrecheckStatus =
  | "not_started"
  | "queued"
  | "in_progress"
  | "completed"
  | "blocked"
  | "requires_review"
  | "error";

export type DocumentPrecheckDecision =
  | "suitable"
  | "suitable_with_observations"
  | "requires_reupload"
  | "requires_human_review"
  | "unsupported"
  | "failed";

export type TrafficLight = "green" | "yellow" | "red" | "gray";

export type IssueSeverity = "info" | "warning" | "critical";

export type SuggestedAction =
  | "continue"
  | "upload_better_scan"
  | "upload_correct_document"
  | "add_supporting_document"
  | "rotate_or_rescan"
  | "contact_support"
  | "wait_and_retry"
  | "human_review";

export interface DocumentIssueDto {
  code: string;
  severity: IssueSeverity;
  pageNumber?: number | null;
  title: string;
  message: string;
  suggestedAction?: SuggestedAction;
  metadata?: Record<string, unknown>;
}

export interface OcrPagePreviewDto {
  pageNumber: number;
  textPreview?: string;
  confidenceScore?: number;
  textDensity?: number;
  isBlurry?: boolean;
  isRotated?: boolean;
  rotationDegrees?: number | null;
  hasTableLikeContent?: boolean;
  issues?: DocumentIssueDto[];
}

export interface OcrPreviewSummaryDto {
  ocrJobId?: string;
  status: string;
  engine?: string;
  pagesTotal?: number;
  pagesProcessed?: number;
  textDetected?: boolean;
  avgTextDensity?: number;
  pages?: OcrPagePreviewDto[];
}

export interface DocumentPrecheckDto {
  precheckId: string;
  caseId: string;
  documentId: string;
  documentName?: string;
  status: DocumentPrecheckStatus;
  decision: DocumentPrecheckDecision | null;
  trafficLight: TrafficLight;
  confidenceScore: number | null;
  summary?: string;
  issues: DocumentIssueDto[];
  ocr?: OcrPreviewSummaryDto;
  createdAt: string;
  updatedAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
}

export interface DocumentPrecheckListResponse {
  caseId?: string;
  items: DocumentPrecheckDto[];
}

export interface StartOcrPreviewOptions {
  maxPages?: number;
  includeTextPreview?: boolean;
  force?: boolean;
}

export interface AdminDocumentPrecheckItem extends DocumentPrecheckDto {
  caseNumber?: string;
  userName?: string;
  reviewerName?: string;
  documentType?: string;
  criticalIssuesCount?: number;
}

export interface AdminDocumentPrecheckListResponse {
  items: AdminDocumentPrecheckItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminPrecheckListParams {
  status?: DocumentPrecheckStatus | "all";
  trafficLight?: TrafficLight | "all";
  query?: string;
  reviewer?: string;
  documentType?: string;
  onlyCritical?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminPrecheckDecisionPayload {
  action:
    | "approve"
    | "reject"
    | "request_reupload"
    | "mark_human_review";
  comment?: string;
}

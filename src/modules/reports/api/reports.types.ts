export type ReportStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "requires_review"
  | "error"
  | "draft"
  | "queued"
  | "generating"
  | "ready"
  | "approved"
  | "rejected"
  | "failed";

export type ReportType =
  | "executive"
  | "technical"
  | "calculation"
  | "inconsistency_matrix"
  | "full";

export type ExportFormat = "pdf" | "docx";

export interface ReportsListResponse {
  items: ReportSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ReportSummary {
  id: string;
  caseId: string;
  title: string;
  reportType: ReportType;
  status: ReportStatus;
  currentVersionId?: string;
  versionNumber?: number;
  requiresHumanReview?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequest {
  reportType: ReportType;
  templateKey?: string;
  forceRegenerate?: boolean;
  includeSections?: string[];
  outputMode?: "sync" | "async";
}

export interface CreateReportResponse {
  reportId: string;
  caseId: string;
  status: ReportStatus;
  jobId?: string;
  message?: string;
}

export interface EvidenceRef {
  type: "analysis_result" | "calculation_result" | "document" | "extraction" | "rule";
  id: string;
  label: string;
  page?: number;
  field?: string;
}

export interface ReportSection {
  id: string;
  sectionKey: string;
  title: string;
  contentMarkdown: string;
  contentJson?: unknown;
  orderIndex: number;
  confidence?: number;
  sourceRefs?: EvidenceRef[];
}

export interface ExportFile {
  id: string;
  reportId: string;
  versionId: string;
  format: ExportFormat;
  status: "queued" | "generating" | "ready" | "failed";
  fileName?: string;
  downloadUrl?: string;
  createdAt?: string;
  expiresAt?: string;
}

export interface ReportDetailResponse {
  id: string;
  caseId: string;
  title: string;
  reportType: ReportType | string;
  status: ReportStatus;
  currentVersion: {
    id: string;
    versionNumber: number;
    createdAt: string;
  };
  sections: ReportSection[];
  availableExports: ExportFile[];
  requiresHumanReview?: boolean;
  reviewReason?: string;
  aiConfidence?: number;
  traceability?: {
    contentHash?: string;
    sourceHash?: string;
    generatedAt?: string;
  };
}

export interface ExportReportRequest {
  format: ExportFormat;
  versionId: string;
  includeTraceabilityStamp: boolean;
  includeEvidenceIndex: boolean;
}

export interface ExportReportResponse {
  exportFileId: string;
  reportId: string;
  versionId: string;
  format: ExportFormat;
  status: "queued" | "generating" | "ready" | "failed";
}

export interface DownloadExportResponse {
  downloadUrl: string;
  expiresAt: string;
}

export interface ReportVersionsResponse {
  items: ReportVersionSummary[];
}

export interface ReportVersionSummary {
  id: string;
  versionNumber: number;
  status: "current" | "superseded" | "archived";
  changeSummary?: string;
  createdAt: string;
  createdByRole?: string;
}

export interface AdminReviewDecisionResponse {
  reportId: string;
  status: ReportStatus;
  message?: string;
}

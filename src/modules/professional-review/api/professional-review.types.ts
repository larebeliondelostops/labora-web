export type ProfessionalReviewStatus =
  | "not_started"
  | "payment_pending"
  | "requested"
  | "queued"
  | "assigned"
  | "in_review"
  | "changes_requested"
  | "client_action_required"
  | "ready_for_approval"
  | "approved"
  | "completed"
  | "rejected"
  | "cancelled"
  | "blocked"
  | "error";

export type ReviewPriority = "low" | "normal" | "high" | "urgent";

export type ReviewType =
  | "report_review"
  | "legal_draft_review"
  | "lawsuit_draft_review"
  | "claim_review"
  | "petition_review"
  | "calculation_review"
  | "full_case_review";

export type ReviewTargetType =
  | "report"
  | "legal_draft"
  | "generated_file"
  | "case_result"
  | "calculation";

export type ReviewActorRole = "client" | "lawyer" | "admin" | "system";

export type ReviewCommentVisibility =
  | "internal"
  | "client_visible"
  | "lawyer_only"
  | "admin_only";

export type ReviewCommentType =
  | "general"
  | "legal_observation"
  | "correction_request"
  | "missing_document"
  | "risk_alert"
  | "approval_note";

export type ReviewedFileStatus =
  | "draft"
  | "ready_for_approval"
  | "approved"
  | "published"
  | "rejected"
  | "archived";

export type ReviewAvailableAction =
  | "comment"
  | "upload_reviewed_file"
  | "approve"
  | "reject"
  | "block"
  | "cancel"
  | "reopen"
  | "request_client_action"
  | "generate_ai_summary"
  | "download_original"
  | "download_final"
  | string;

export interface ReviewLawyer {
  id: string;
  name: string;
}

export interface ReviewComment {
  id: string;
  authorName: string;
  authorRole: ReviewActorRole;
  visibility: ReviewCommentVisibility;
  commentType: ReviewCommentType;
  body: string;
  targetSection?: string;
  targetFileId?: string;
  targetVersionId?: string;
  resolved: boolean;
  createdAt: string;
}

export interface ReviewedFile {
  id: string;
  fileType: string;
  versionNumber: number;
  status: ReviewedFileStatus;
  fileName?: string;
  mimeType: string;
  fileSize: number;
  downloadUrl?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface RequestedDocument {
  id: string;
  documentType: string;
  required: boolean;
  description: string;
  status: "pending" | "uploaded" | "accepted" | "rejected";
  allowedMimeTypes?: string[];
  maxSizeMb?: number;
  uploadedFileName?: string;
}

export interface ReviewAuditEvent {
  id: string;
  title: string;
  description?: string;
  actorName?: string;
  actorRole?: ReviewActorRole;
  eventType?: string;
  occurredAt: string;
}

export interface ProfessionalReviewListItem {
  id: string;
  caseId: string;
  caseNumber: string;
  clientName?: string;
  reviewType: ReviewType;
  targetType: ReviewTargetType;
  targetId: string;
  targetLabel?: string;
  status: ProfessionalReviewStatus;
  priority: ReviewPriority;
  riskLevel?: string;
  requiresPayment: boolean;
  paymentOrderId?: string;
  assignedLawyer?: ReviewLawyer;
  requestedAt: string;
  dueAt?: string;
  updatedAt: string;
  lastActivityAt?: string;
  availableActions: ReviewAvailableAction[];
}

export interface ProfessionalReviewDetail extends ProfessionalReviewListItem {
  summaryForReviewer?: string;
  clientNotes?: string;
  nextAction?: string;
  comments: ReviewComment[];
  requestedDocuments: RequestedDocument[];
  reviewedFiles: ReviewedFile[];
  auditEvents: ReviewAuditEvent[];
  aiSummary?: {
    status: "not_generated" | "generating" | "generated" | "low_confidence" | "error";
    body?: string;
    confidence?: number;
    generatedAt?: string;
  };
  originalFile?: {
    id: string;
    fileName: string;
    mimeType?: string;
    fileSize?: number;
    downloadUrl?: string;
  };
}

export interface ReviewPagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface ProfessionalReviewsResponse {
  items: ProfessionalReviewListItem[];
  pagination: ReviewPagination;
}

export interface ReviewFilters {
  status?: string;
  priority?: ReviewPriority | "all";
  reviewType?: ReviewType | "all";
  assignedToMe?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface RequestProfessionalReviewForm {
  targetType: ReviewTargetType;
  targetId: string;
  reviewType: ReviewType;
  priority: Exclude<ReviewPriority, "urgent">;
  clientNotes?: string;
  acceptedScope: boolean;
}

export interface RequestProfessionalReviewBody {
  targetType: ReviewTargetType;
  targetId: string;
  reviewType: ReviewType;
  priority: Exclude<ReviewPriority, "urgent">;
  clientNotes?: string;
}

export interface RequestProfessionalReviewResponse {
  id: string;
  caseId: string;
  status: ProfessionalReviewStatus;
  requiresPayment: boolean;
  paymentOrderId?: string;
  nextAction: "pay_review_order" | "wait_assignment" | "view_status";
}

export interface CreateReviewCommentBody {
  visibility: ReviewCommentVisibility;
  commentType: ReviewCommentType;
  body: string;
  targetSection?: string;
  targetFileId?: string;
  targetVersionId?: string;
}

export interface RequestClientActionBody {
  reason: string;
  message: string;
  requestedDocuments: Array<{
    documentType: string;
    description: string;
    required: boolean;
  }>;
  dueAt?: string;
  severity: "low" | "normal" | "high";
}

export interface UploadReviewedFileBody {
  fileType: string;
  file: File;
  versionNote?: string;
  readyForApproval: boolean;
}

export interface UploadRequestedDocumentBody {
  requestedDocumentId?: string;
  documentType: string;
  file: File;
}

export interface ApproveReviewBody {
  reviewedFileId: string;
  approvalNote?: string;
  publishToClient: boolean;
  confirmationAccepted: boolean;
}

export interface RejectReviewBody {
  reason: string;
  note?: string;
}

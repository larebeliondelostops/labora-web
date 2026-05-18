export type DeliveryPackageStatus =
  | "not_started"
  | "generating"
  | "ready"
  | "partially_ready"
  | "blocked"
  | "requires_review"
  | "completed"
  | "closed"
  | "error";

export type DownloadFileStatus =
  | "pending"
  | "available"
  | "locked"
  | "requires_review"
  | "expired"
  | "deleted"
  | "error";

export type ShareLinkStatus =
  | "active"
  | "expired"
  | "revoked"
  | "max_views_reached"
  | "disabled";

export type DownloadFileCategory =
  | "executive_report"
  | "technical_report"
  | "inconsistency_matrix"
  | "calculation_sheet"
  | "legal_claim"
  | "petition"
  | "lawsuit_draft"
  | "attachments_index"
  | "traceability_log"
  | "supporting_document"
  | "other";

export type SharePermission =
  | "view"
  | "download"
  | "comment"
  | "upload_supporting_files";

export type DeliveryActorRole =
  | "user"
  | "admin"
  | "lawyer"
  | "reviewer"
  | "system";

export interface DeliveryPackage {
  id: string;
  caseId: string;
  status: DeliveryPackageStatus;
  version: number;
  title: string;
  description?: string | null;
  completedAt?: string | null;
  closedAt?: string | null;
  aiSummary?: string | null;
  aiConfidence?: number | null;
}

export interface DownloadFile {
  id: string;
  fileName: string;
  category: DownloadFileCategory;
  mimeType: string;
  sizeBytes: number;
  status: DownloadFileStatus;
  isUnlocked: boolean;
  requiresReview: boolean;
  downloadCount: number;
  generatedAt?: string | null;
  lastDownloadedAt?: string | null;
}

export interface ShareLink {
  id: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  status: ShareLinkStatus;
  permissions: SharePermission[];
  fileIds: string[];
  expiresAt: string;
  viewCount: number;
  maxViews?: number | null;
  createdAt?: string | null;
}

export interface DeliveryTimelineEvent {
  id: string;
  eventType: string;
  actorRole: DeliveryActorRole;
  createdAt: string;
  label?: string;
  description?: string;
}

export interface DeliveryAvailableActions {
  canDownload: boolean;
  canCreateShareLink: boolean;
  canComplementCase: boolean;
  canCloseCase: boolean;
  closeBlockedReason?: string | null;
}

export interface DeliveryResponse {
  caseId: string;
  package: DeliveryPackage | null;
  files: DownloadFile[];
  shareLinks: ShareLink[];
  timeline: DeliveryTimelineEvent[];
  availableActions: DeliveryAvailableActions;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface CreateShareLinkPayload {
  recipientName?: string;
  recipientEmail: string;
  permissions: SharePermission[];
  fileIds: string[];
  expiresAt: string;
  maxViews?: number | null;
}

export interface CreateShareLinkResponse {
  shareLink: ShareLink;
  url: string;
  token?: string;
}

export interface SharedDeliveryResponse {
  token: string;
  status: ShareLinkStatus | "valid" | "error";
  publicCaseNumber: string;
  recipientName?: string | null;
  expiresAt: string;
  permissions: SharePermission[];
  files: DownloadFile[];
  message?: string | null;
}

export interface ComplementDeliveryPayload {
  reason:
    | "new_supporting_documents"
    | "correct_information"
    | "update_analysis"
    | "other";
  message: string;
  documentTypes: string[];
}

export interface ComplementDeliveryResponse {
  requestId: string;
  status: "received" | "queued" | "requires_documents" | "error";
  message?: string;
  nextHref?: string;
}

export interface CloseCasePayload {
  reason: string;
  notes?: string;
  confirmations: {
    downloadedDocuments: boolean;
    understandsHistoryIsKept: boolean;
    understandsFutureChangesNeedRequest: boolean;
  };
}

export interface CloseCaseResponse {
  caseId: string;
  status: "closed" | "blocked" | "error";
  closedAt?: string;
  message?: string;
  blockedReason?: string;
}

export interface PaginatedDeliveryEvents {
  items: DeliveryTimelineEvent[];
  nextCursor?: string | null;
}

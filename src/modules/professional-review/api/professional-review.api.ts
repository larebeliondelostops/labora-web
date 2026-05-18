import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  ApproveReviewBody,
  CreateReviewCommentBody,
  ProfessionalReviewDetail,
  ProfessionalReviewListItem,
  ProfessionalReviewsResponse,
  RequestClientActionBody,
  RequestProfessionalReviewBody,
  RequestProfessionalReviewResponse,
  RequestedDocument,
  ReviewActorRole,
  ReviewAuditEvent,
  ReviewComment,
  ReviewCommentType,
  ReviewCommentVisibility,
  ReviewFilters,
  ReviewLawyer,
  ReviewPriority,
  ReviewTargetType,
  ReviewType,
  ReviewedFile,
  ReviewedFileStatus,
  ProfessionalReviewStatus,
  UploadRequestedDocumentBody,
  UploadReviewedFileBody,
} from "@/src/modules/professional-review/api/professional-review.types";

type RawRecord = Record<string, unknown>;

const statuses: ProfessionalReviewStatus[] = [
  "not_started",
  "payment_pending",
  "requested",
  "queued",
  "assigned",
  "in_review",
  "changes_requested",
  "client_action_required",
  "ready_for_approval",
  "approved",
  "completed",
  "rejected",
  "cancelled",
  "blocked",
  "error",
];

const priorities: ReviewPriority[] = ["low", "normal", "high", "urgent"];

const reviewTypes: ReviewType[] = [
  "report_review",
  "legal_draft_review",
  "lawsuit_draft_review",
  "claim_review",
  "petition_review",
  "calculation_review",
  "full_case_review",
];

const targetTypes: ReviewTargetType[] = [
  "report",
  "legal_draft",
  "generated_file",
  "case_result",
  "calculation",
];

const actorRoles: ReviewActorRole[] = ["client", "lawyer", "admin", "system"];
const commentVisibilities: ReviewCommentVisibility[] = [
  "internal",
  "client_visible",
  "lawyer_only",
  "admin_only",
];
const commentTypes: ReviewCommentType[] = [
  "general",
  "legal_observation",
  "correction_request",
  "missing_document",
  "risk_alert",
  "approval_note",
];
const fileStatuses: ReviewedFileStatus[] = [
  "draft",
  "ready_for_approval",
  "approved",
  "published",
  "rejected",
  "archived",
];

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function pickString(source: RawRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = asString(source[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function pickArray(source: RawRecord, ...keys: string[]): unknown[] {
  for (const key of keys) {
    const value = source[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function normalizeStatus(value: unknown): ProfessionalReviewStatus {
  const status = asString(value);

  if (status && statuses.includes(status as ProfessionalReviewStatus)) {
    return status as ProfessionalReviewStatus;
  }

  if (status === "waiting_payment") {
    return "payment_pending";
  }

  if (status === "done" || status === "final_available") {
    return "completed";
  }

  return "not_started";
}

function normalizePriority(value: unknown): ReviewPriority {
  const priority = asString(value);
  return priority && priorities.includes(priority as ReviewPriority)
    ? (priority as ReviewPriority)
    : "normal";
}

function normalizeReviewType(value: unknown): ReviewType {
  const reviewType = asString(value);
  return reviewType && reviewTypes.includes(reviewType as ReviewType)
    ? (reviewType as ReviewType)
    : "full_case_review";
}

function normalizeTargetType(value: unknown): ReviewTargetType {
  const targetType = asString(value);
  return targetType && targetTypes.includes(targetType as ReviewTargetType)
    ? (targetType as ReviewTargetType)
    : "case_result";
}

function normalizeActorRole(value: unknown): ReviewActorRole {
  const role = asString(value);
  return role && actorRoles.includes(role as ReviewActorRole)
    ? (role as ReviewActorRole)
    : "system";
}

function normalizeCommentVisibility(value: unknown): ReviewCommentVisibility {
  const visibility = asString(value);
  return visibility && commentVisibilities.includes(visibility as ReviewCommentVisibility)
    ? (visibility as ReviewCommentVisibility)
    : "internal";
}

function normalizeCommentType(value: unknown): ReviewCommentType {
  const commentType = asString(value);
  return commentType && commentTypes.includes(commentType as ReviewCommentType)
    ? (commentType as ReviewCommentType)
    : "general";
}

function normalizeFileStatus(value: unknown): ReviewedFileStatus {
  const status = asString(value);
  return status && fileStatuses.includes(status as ReviewedFileStatus)
    ? (status as ReviewedFileStatus)
    : "draft";
}

function normalizeActions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const action = asString(item);
    return action ? [action] : [];
  });
}

function normalizeLawyer(raw: unknown): ReviewLawyer | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const id = pickString(raw, "id", "lawyerId", "lawyer_id", "userId", "user_id");
  const name = pickString(raw, "name", "fullName", "full_name", "displayName");

  if (!id && !name) {
    return undefined;
  }

  return {
    id: id || name || "assigned-lawyer",
    name: name || "Abogado asignado",
  };
}

function normalizeComment(raw: unknown): ReviewComment | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = pickString(raw, "id", "commentId", "comment_id");

  if (!id) {
    return null;
  }

  return {
    id,
    authorName:
      pickString(raw, "authorName", "author_name", "author", "createdBy") ||
      "Labora",
    authorRole: normalizeActorRole(raw.authorRole ?? raw.author_role),
    visibility: normalizeCommentVisibility(raw.visibility),
    commentType: normalizeCommentType(raw.commentType ?? raw.comment_type),
    body: pickString(raw, "body", "comment", "message", "text") || "",
    targetSection: pickString(raw, "targetSection", "target_section"),
    targetFileId: pickString(raw, "targetFileId", "target_file_id"),
    targetVersionId: pickString(raw, "targetVersionId", "target_version_id"),
    resolved: asBoolean(raw.resolved) ?? false,
    createdAt:
      pickString(raw, "createdAt", "created_at", "occurredAt", "occurred_at") ||
      new Date().toISOString(),
  };
}

function normalizeComments(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const comment = normalizeComment(item);
    return comment ? [comment] : [];
  });
}

function normalizeReviewedFile(raw: unknown): ReviewedFile | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = pickString(raw, "id", "fileId", "file_id");

  if (!id) {
    return null;
  }

  return {
    id,
    fileType: pickString(raw, "fileType", "file_type", "type") || "reviewed_document",
    versionNumber: asNumber(raw.versionNumber ?? raw.version_number ?? raw.version) ?? 1,
    status: normalizeFileStatus(raw.status),
    fileName: pickString(raw, "fileName", "file_name", "name"),
    mimeType: pickString(raw, "mimeType", "mime_type") || "application/octet-stream",
    fileSize: asNumber(raw.fileSize ?? raw.file_size ?? raw.size) ?? 0,
    downloadUrl: pickString(raw, "downloadUrl", "download_url", "url"),
    createdBy: pickString(raw, "createdBy", "created_by", "authorName") || "Labora",
    approvedBy: pickString(raw, "approvedBy", "approved_by"),
    approvedAt: pickString(raw, "approvedAt", "approved_at"),
    createdAt: pickString(raw, "createdAt", "created_at") || new Date().toISOString(),
  };
}

function normalizeReviewedFiles(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const file = normalizeReviewedFile(item);
    return file ? [file] : [];
  });
}

function normalizeRequestedDocument(raw: unknown): RequestedDocument | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    pickString(raw, "id", "requestedDocumentId", "requested_document_id") ||
    pickString(raw, "documentType", "document_type");

  if (!id) {
    return null;
  }

  const status = pickString(raw, "status");

  return {
    id,
    documentType: pickString(raw, "documentType", "document_type", "type") || "support",
    required: asBoolean(raw.required) ?? true,
    description:
      pickString(raw, "description", "label", "name") || "Documento solicitado",
    status:
      status === "uploaded" || status === "accepted" || status === "rejected"
        ? status
        : "pending",
    allowedMimeTypes: pickArray(raw, "allowedMimeTypes", "allowed_mime_types")
      .map(asString)
      .filter(Boolean) as string[],
    maxSizeMb: asNumber(raw.maxSizeMb ?? raw.max_size_mb),
    uploadedFileName: pickString(raw, "uploadedFileName", "uploaded_file_name"),
  };
}

function normalizeRequestedDocuments(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const document = normalizeRequestedDocument(item);
    return document ? [document] : [];
  });
}

function normalizeAuditEvent(raw: unknown): ReviewAuditEvent | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    pickString(raw, "id", "eventId", "event_id") ||
    `${pickString(raw, "eventType", "event_type") || "event"}-${pickString(
      raw,
      "occurredAt",
      "occurred_at",
      "createdAt",
      "created_at",
    ) || Date.now()}`;

  return {
    id,
    title:
      pickString(raw, "title", "label") ||
      pickString(raw, "eventType", "event_type") ||
      "Evento de revision",
    description: pickString(raw, "description", "message", "body"),
    actorName: pickString(raw, "actorName", "actor_name", "actor"),
    actorRole: normalizeActorRole(raw.actorRole ?? raw.actor_role),
    eventType: pickString(raw, "eventType", "event_type"),
    occurredAt:
      pickString(raw, "occurredAt", "occurred_at", "createdAt", "created_at") ||
      new Date().toISOString(),
  };
}

function normalizeAuditEvents(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const event = normalizeAuditEvent(item);
    return event ? [event] : [];
  });
}

function normalizeAiSummary(raw: unknown): ProfessionalReviewDetail["aiSummary"] {
  if (!isRecord(raw)) {
    return undefined;
  }

  const status = pickString(raw, "status");

  return {
    status:
      status === "generating" ||
      status === "generated" ||
      status === "low_confidence" ||
      status === "error"
        ? status
        : "not_generated",
    body: pickString(raw, "body", "summary", "text"),
    confidence: asNumber(raw.confidence),
    generatedAt: pickString(raw, "generatedAt", "generated_at"),
  };
}

function normalizeOriginalFile(raw: unknown): ProfessionalReviewDetail["originalFile"] {
  if (!isRecord(raw)) {
    return undefined;
  }

  const id = pickString(raw, "id", "fileId", "file_id");
  const fileName = pickString(raw, "fileName", "file_name", "name");

  if (!id && !fileName) {
    return undefined;
  }

  return {
    id: id || "original",
    fileName: fileName || "Documento original",
    mimeType: pickString(raw, "mimeType", "mime_type"),
    fileSize: asNumber(raw.fileSize ?? raw.file_size ?? raw.size),
    downloadUrl: pickString(raw, "downloadUrl", "download_url", "url"),
  };
}

function normalizeListItem(raw: unknown): ProfessionalReviewListItem | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = pickString(raw, "id", "reviewId", "review_id");

  if (!id) {
    return null;
  }

  const createdAt =
    pickString(raw, "requestedAt", "requested_at", "createdAt", "created_at") ||
    new Date().toISOString();

  return {
    id,
    caseId: pickString(raw, "caseId", "case_id") || "",
    caseNumber:
      pickString(raw, "caseNumber", "case_number", "caseCode", "case_code") ||
      "Sin numero",
    clientName: pickString(raw, "clientName", "client_name", "holderName"),
    reviewType: normalizeReviewType(raw.reviewType ?? raw.review_type),
    targetType: normalizeTargetType(raw.targetType ?? raw.target_type),
    targetId: pickString(raw, "targetId", "target_id") || "",
    targetLabel: pickString(raw, "targetLabel", "target_label", "documentName"),
    status: normalizeStatus(raw.status),
    priority: normalizePriority(raw.priority),
    riskLevel: pickString(raw, "riskLevel", "risk_level"),
    requiresPayment:
      asBoolean(raw.requiresPayment) ?? asBoolean(raw.requires_payment) ?? false,
    paymentOrderId: pickString(raw, "paymentOrderId", "payment_order_id"),
    assignedLawyer: normalizeLawyer(raw.assignedLawyer ?? raw.assigned_lawyer),
    requestedAt: createdAt,
    dueAt: pickString(raw, "dueAt", "due_at", "deadline"),
    updatedAt: pickString(raw, "updatedAt", "updated_at") || createdAt,
    lastActivityAt: pickString(raw, "lastActivityAt", "last_activity_at"),
    availableActions: normalizeActions(raw.availableActions ?? raw.available_actions),
  };
}

function normalizeDetail(raw: unknown, fallbackId?: string): ProfessionalReviewDetail | null {
  const data = isRecord(raw) && isRecord(raw.review) ? raw.review : raw;
  const base = normalizeListItem(data);

  if (!base) {
    if (!fallbackId) {
      return null;
    }

    return null;
  }

  const detail = isRecord(data) ? data : {};

  return {
    ...base,
    id: base.id || fallbackId || "",
    summaryForReviewer: pickString(
      detail,
      "summaryForReviewer",
      "summary_for_reviewer",
      "reviewerSummary",
    ),
    clientNotes: pickString(detail, "clientNotes", "client_notes", "notes"),
    nextAction: pickString(detail, "nextAction", "next_action"),
    comments: normalizeComments(detail.comments),
    requestedDocuments: normalizeRequestedDocuments(
      detail.requestedDocuments ?? detail.requested_documents,
    ),
    reviewedFiles: normalizeReviewedFiles(detail.reviewedFiles ?? detail.reviewed_files),
    auditEvents: normalizeAuditEvents(detail.auditEvents ?? detail.audit_events),
    aiSummary: normalizeAiSummary(detail.aiSummary ?? detail.ai_summary),
    originalFile: normalizeOriginalFile(detail.originalFile ?? detail.original_file),
  };
}

function normalizeDetailResponse(raw: unknown, fallbackId?: string) {
  const data = unwrapApiData(raw);
  const review = normalizeDetail(data, fallbackId);

  if (!review) {
    throw new ApiError({
      message: "No pudimos cargar la revision profesional.",
      status: 500,
      code: "PROFESSIONAL_REVIEW_INVALID_RESPONSE",
      data,
    });
  }

  return review;
}

function normalizeListResponse(raw: unknown): ProfessionalReviewsResponse {
  const data = unwrapApiData(raw);
  const source =
    isRecord(data) && Array.isArray(data.items)
      ? data
      : isRecord(data) && Array.isArray(data.reviews)
        ? { ...data, items: data.reviews }
        : { items: [] };

  const pagination = isRecord(source.pagination) ? source.pagination : source;

  return {
    items: pickArray(source, "items").flatMap((item) => {
      const review = normalizeListItem(item);
      return review ? [review] : [];
    }),
    pagination: {
      page: asNumber(pagination.page) ?? 1,
      pageSize: asNumber(pagination.pageSize ?? pagination.page_size) ?? 20,
      total: asNumber(pagination.total) ?? 0,
    },
  };
}

function normalizeCreateResponse(
  raw: unknown,
  caseId: string,
): RequestProfessionalReviewResponse {
  const data = unwrapApiData(raw);
  const source = isRecord(data) && isRecord(data.review) ? data.review : data;

  if (!isRecord(source)) {
    throw new ApiError({
      message: "No pudimos crear la solicitud de revision.",
      status: 500,
      code: "PROFESSIONAL_REVIEW_NOT_CREATED",
      data,
    });
  }

  const id = pickString(source, "id", "reviewId", "review_id");

  if (!id) {
    throw new ApiError({
      message: "No pudimos crear la solicitud de revision.",
      status: 500,
      code: "PROFESSIONAL_REVIEW_NOT_CREATED",
      data,
    });
  }

  const nextAction = pickString(source, "nextAction", "next_action");
  const requiresPayment =
    asBoolean(source.requiresPayment) ?? asBoolean(source.requires_payment) ?? false;

  return {
    id,
    caseId: pickString(source, "caseId", "case_id") || caseId,
    status: normalizeStatus(source.status),
    requiresPayment,
    paymentOrderId: pickString(source, "paymentOrderId", "payment_order_id"),
    nextAction:
      nextAction === "pay_review_order" ||
      nextAction === "wait_assignment" ||
      nextAction === "view_status"
        ? nextAction
        : requiresPayment
          ? "pay_review_order"
          : "view_status",
  };
}

function makeQuery(params: ReviewFilters) {
  const query = new URLSearchParams();

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  if (params.priority && params.priority !== "all") {
    query.set("priority", params.priority);
  }

  if (params.reviewType && params.reviewType !== "all") {
    query.set("reviewType", params.reviewType);
  }

  if (params.assignedToMe) {
    query.set("assignedToMe", "true");
  }

  if (params.dateFrom) {
    query.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    query.set("dateTo", params.dateTo);
  }

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.page) {
    query.set("page", String(params.page));
  }

  if (params.pageSize) {
    query.set("pageSize", String(params.pageSize));
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function getProfessionalReviewErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      UNAUTHORIZED: "Debes iniciar sesion para continuar.",
      FORBIDDEN: "No tienes permiso para ver esta revision.",
      CASE_NOT_FOUND: "No encontramos el expediente solicitado.",
      REVIEW_NOT_FOUND: "No encontramos la revision profesional.",
      ACTIVE_REVIEW_EXISTS: "Ya existe una revision activa para este documento.",
      NO_REVIEWABLE_TARGET:
        "Este expediente aun no tiene un documento disponible para revision.",
      INVALID_FILE_TYPE: "El tipo de archivo no esta permitido.",
      FILE_TOO_LARGE: "El archivo supera el tamano permitido.",
      ACTION_NOT_AVAILABLE: "Esta accion no esta disponible para tu rol.",
    };

    if (error.status === 401) {
      return messages.UNAUTHORIZED;
    }

    if (error.status === 403) {
      return messages.FORBIDDEN;
    }

    if (error.status === 404) {
      return messages.REVIEW_NOT_FOUND;
    }

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intenta nuevamente.";
}

export async function getCaseProfessionalReview(
  caseId: string,
): Promise<ProfessionalReviewDetail | null> {
  try {
    const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
      `/cases/${caseId}/professional-review`,
    );

    return normalizeDetailResponse(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function requestProfessionalReview(
  caseId: string,
  payload: RequestProfessionalReviewBody,
): Promise<RequestProfessionalReviewResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/professional-review`,
    {
      method: "POST",
      body: JSON.stringify({
        targetType: payload.targetType,
        targetId: payload.targetId,
        reviewType: payload.reviewType,
        priority: payload.priority,
        clientNotes: payload.clientNotes,
      }),
    },
  );

  return normalizeCreateResponse(response, caseId);
}

export async function listProfessionalReviews(
  filters: ReviewFilters = {},
): Promise<ProfessionalReviewsResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews${makeQuery(filters)}`,
  );

  return normalizeListResponse(response);
}

export async function getProfessionalReview(
  reviewId: string,
): Promise<ProfessionalReviewDetail> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews/${reviewId}`,
  );

  return normalizeDetailResponse(response, reviewId);
}

export async function createReviewComment(
  reviewId: string,
  payload: CreateReviewCommentBody,
): Promise<ReviewComment> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews/${reviewId}/comments`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  const data = unwrapApiData(response);
  const comment = normalizeComment(isRecord(data) ? data.comment ?? data : data);

  if (!comment) {
    throw new ApiError({
      message: "No pudimos guardar el comentario.",
      status: 500,
      code: "COMMENT_INVALID_RESPONSE",
      data,
    });
  }

  return comment;
}

export async function resolveReviewComment(
  reviewId: string,
  commentId: string,
): Promise<ReviewComment> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews/${reviewId}/comments/${commentId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ resolved: true }),
    },
  );
  const data = unwrapApiData(response);
  const comment = normalizeComment(isRecord(data) ? data.comment ?? data : data);

  if (!comment) {
    throw new ApiError({
      message: "No pudimos resolver el comentario.",
      status: 500,
      code: "COMMENT_INVALID_RESPONSE",
      data,
    });
  }

  return comment;
}

export async function requestClientAction(
  reviewId: string,
  payload: RequestClientActionBody,
): Promise<ProfessionalReviewDetail> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews/${reviewId}/request-client-action`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeDetailResponse(response, reviewId);
}

export async function uploadReviewedFile(
  reviewId: string,
  payload: UploadReviewedFileBody,
): Promise<ReviewedFile> {
  const formData = new FormData();
  formData.append("fileType", payload.fileType);
  formData.append("file", payload.file);
  formData.append("readyForApproval", String(payload.readyForApproval));

  if (payload.versionNote) {
    formData.append("versionNote", payload.versionNote);
  }

  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews/${reviewId}/reviewed-files`,
    {
      method: "POST",
      body: formData,
    },
  );
  const data = unwrapApiData(response);
  const file = normalizeReviewedFile(isRecord(data) ? data.file ?? data : data);

  if (!file) {
    throw new ApiError({
      message: "No pudimos cargar el archivo revisado.",
      status: 500,
      code: "REVIEWED_FILE_INVALID_RESPONSE",
      data,
    });
  }

  return file;
}

export async function uploadRequestedDocument(
  reviewId: string,
  payload: UploadRequestedDocumentBody,
): Promise<RequestedDocument> {
  const formData = new FormData();
  formData.append("documentType", payload.documentType);
  formData.append("file", payload.file);

  if (payload.requestedDocumentId) {
    formData.append("requestedDocumentId", payload.requestedDocumentId);
  }

  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews/${reviewId}/requested-documents`,
    {
      method: "POST",
      body: formData,
    },
  );
  const data = unwrapApiData(response);
  const document = normalizeRequestedDocument(
    isRecord(data) ? data.document ?? data : data,
  );

  if (!document) {
    throw new ApiError({
      message: "No pudimos cargar el documento solicitado.",
      status: 500,
      code: "REQUESTED_DOCUMENT_INVALID_RESPONSE",
      data,
    });
  }

  return document;
}

export async function approveProfessionalReview(
  reviewId: string,
  payload: ApproveReviewBody,
): Promise<ProfessionalReviewDetail> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews/${reviewId}/approve`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeDetailResponse(response, reviewId);
}

export async function rejectProfessionalReview(
  reviewId: string,
  payload: { reason: string; note?: string },
): Promise<ProfessionalReviewDetail> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews/${reviewId}/reject`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeDetailResponse(response, reviewId);
}

export async function cancelProfessionalReview(
  reviewId: string,
  reason?: string,
): Promise<ProfessionalReviewDetail> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews/${reviewId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );

  return normalizeDetailResponse(response, reviewId);
}

export async function generateProfessionalReviewAiSummary(
  reviewId: string,
): Promise<ProfessionalReviewDetail> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/professional-reviews/${reviewId}/ai-summary`,
    {
      method: "POST",
    },
  );

  return normalizeDetailResponse(response, reviewId);
}

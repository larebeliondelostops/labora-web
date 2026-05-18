import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  CloseCasePayload,
  CloseCaseResponse,
  ComplementDeliveryPayload,
  ComplementDeliveryResponse,
  CreateShareLinkPayload,
  CreateShareLinkResponse,
  DeliveryActorRole,
  DeliveryAvailableActions,
  DeliveryPackage,
  DeliveryPackageStatus,
  DeliveryResponse,
  DeliveryTimelineEvent,
  DownloadFile,
  DownloadFileCategory,
  DownloadFileStatus,
  DownloadUrlResponse,
  PaginatedDeliveryEvents,
  ShareLink,
  ShareLinkStatus,
  SharePermission,
  SharedDeliveryResponse,
} from "@/src/modules/delivery/api/delivery.types";

type RawRecord = Record<string, unknown>;
type ListEnvelope<T> =
  | T[]
  | {
      items?: T[];
      data?: T[];
      results?: T[];
      nextCursor?: string | null;
      next_cursor?: string | null;
    };

const packageStatuses: DeliveryPackageStatus[] = [
  "not_started",
  "generating",
  "ready",
  "partially_ready",
  "blocked",
  "requires_review",
  "completed",
  "closed",
  "error",
];

const fileStatuses: DownloadFileStatus[] = [
  "pending",
  "available",
  "locked",
  "requires_review",
  "expired",
  "deleted",
  "error",
];

const shareStatuses: ShareLinkStatus[] = [
  "active",
  "expired",
  "revoked",
  "max_views_reached",
  "disabled",
];

const fileCategories: DownloadFileCategory[] = [
  "executive_report",
  "technical_report",
  "inconsistency_matrix",
  "calculation_sheet",
  "legal_claim",
  "petition",
  "lawsuit_draft",
  "attachments_index",
  "traceability_log",
  "supporting_document",
  "other",
];

const sharePermissions: SharePermission[] = [
  "view",
  "download",
  "comment",
  "upload_supporting_files",
];

const actorRoles: DeliveryActorRole[] = [
  "user",
  "admin",
  "lawyer",
  "reviewer",
  "system",
];

export const deliveryErrorMessages: Record<string, string> = {
  DELIVERY_NOT_FOUND: "No encontramos una entrega final para este caso.",
  DELIVERY_NOT_READY: "La entrega aun no esta lista.",
  DELIVERY_BLOCKED: "La entrega esta bloqueada temporalmente.",
  DELIVERY_FILE_NOT_FOUND: "No encontramos este archivo.",
  DELIVERY_FILE_LOCKED: "Este archivo aun no esta disponible.",
  DELIVERY_FILE_REQUIRES_REVIEW: "Este archivo requiere revision antes de descargarse.",
  DELIVERY_PAYMENT_REQUIRED: "Debes desbloquear el analisis para acceder a estos documentos.",
  DELIVERY_UNAUTHORIZED: "Debes iniciar sesion para continuar.",
  DELIVERY_FORBIDDEN: "No tienes permiso para acceder a este recurso.",
  SHARE_LINK_INVALID: "El enlace no es valido.",
  SHARE_LINK_EXPIRED: "Este enlace ya expiro.",
  SHARE_LINK_REVOKED: "Este enlace fue revocado.",
  SHARE_LINK_MAX_VIEWS_REACHED: "Este enlace alcanzo el limite de vistas.",
  CASE_CANNOT_BE_CLOSED: "El caso no puede cerrarse todavia.",
  CASE_ALREADY_CLOSED: "Este caso ya esta cerrado.",
  AI_SUMMARY_LOW_CONFIDENCE: "El resumen automatico requiere revision.",
  TEMPORARY_PROCESSING_FAILURE: "Hubo un problema temporal. Intenta de nuevo.",
};

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

function pickString(raw: RawRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = asString(raw[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function pickNumber(raw: RawRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = asNumber(raw[key]);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function pickBoolean(raw: RawRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = asBoolean(raw[key]);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const text = asString(item);
    return text ? [text] : [];
  });
}

function unwrapList<T>(response: ListEnvelope<T> | ApiEnvelope<ListEnvelope<T>>) {
  return unwrapApiData(response);
}

function getItems<T>(value: ListEnvelope<T>): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value.items)) {
    return value.items;
  }

  if (Array.isArray(value.data)) {
    return value.data;
  }

  if (Array.isArray(value.results)) {
    return value.results;
  }

  return [];
}

function getRandomId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizePackageStatus(value: unknown): DeliveryPackageStatus {
  const status = asString(value);

  if (status && packageStatuses.includes(status as DeliveryPackageStatus)) {
    return status as DeliveryPackageStatus;
  }

  if (status === "processing" || status === "running" || status === "queued") {
    return "generating";
  }

  if (status === "done" || status === "published") {
    return "ready";
  }

  if (status === "review") {
    return "requires_review";
  }

  return "not_started";
}

function normalizeFileStatus(value: unknown, isUnlocked?: boolean): DownloadFileStatus {
  const status = asString(value);

  if (status && fileStatuses.includes(status as DownloadFileStatus)) {
    return status as DownloadFileStatus;
  }

  if (status === "ready" || status === "done" || status === "published") {
    return "available";
  }

  if (status === "review") {
    return "requires_review";
  }

  if (isUnlocked === false) {
    return "locked";
  }

  return "pending";
}

function normalizeShareStatus(value: unknown): ShareLinkStatus {
  const status = asString(value);

  if (status && shareStatuses.includes(status as ShareLinkStatus)) {
    return status as ShareLinkStatus;
  }

  if (status === "valid" || status === "enabled") {
    return "active";
  }

  if (status === "max_views" || status === "limit_reached") {
    return "max_views_reached";
  }

  return "disabled";
}

function normalizeCategory(value: unknown): DownloadFileCategory {
  const category = asString(value);

  if (category && fileCategories.includes(category as DownloadFileCategory)) {
    return category as DownloadFileCategory;
  }

  if (category === "executive" || category === "executive_report_pdf") {
    return "executive_report";
  }

  if (category === "technical" || category === "full_report") {
    return "technical_report";
  }

  if (category === "matrix") {
    return "inconsistency_matrix";
  }

  if (category === "calculation" || category === "calculation_report") {
    return "calculation_sheet";
  }

  if (category === "lawsuit" || category === "draft") {
    return "lawsuit_draft";
  }

  if (category === "attachments") {
    return "attachments_index";
  }

  if (category === "traceability") {
    return "traceability_log";
  }

  return "other";
}

function normalizePermissions(value: unknown): SharePermission[] {
  return asStringArray(value).flatMap((item) =>
    sharePermissions.includes(item as SharePermission) ? [item as SharePermission] : [],
  );
}

function normalizeActorRole(value: unknown): DeliveryActorRole {
  const role = asString(value);
  return role && actorRoles.includes(role as DeliveryActorRole)
    ? (role as DeliveryActorRole)
    : "system";
}

function normalizePackage(raw: unknown, fallbackCaseId: string): DeliveryPackage | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    pickString(raw, "id", "packageId", "package_id", "deliveryPackageId", "delivery_package_id") ||
    `${fallbackCaseId}-delivery`;
  const now = new Date().toISOString();

  return {
    id,
    caseId: pickString(raw, "caseId", "case_id") || fallbackCaseId,
    status: normalizePackageStatus(raw.status),
    version: pickNumber(raw, "version", "versionNumber", "version_number") || 1,
    title:
      pickString(raw, "title", "name") ||
      "Tu expediente final esta listo",
    description:
      pickString(raw, "description", "summary") ||
      "Consulta, descarga y comparte los documentos generados para tu caso.",
    completedAt:
      pickString(raw, "completedAt", "completed_at", "deliveredAt", "delivered_at") ||
      (normalizePackageStatus(raw.status) === "ready" ? now : null),
    closedAt: pickString(raw, "closedAt", "closed_at") || null,
    aiSummary:
      pickString(raw, "aiSummary", "ai_summary", "automaticSummary", "automatic_summary") ||
      null,
    aiConfidence:
      pickNumber(raw, "aiConfidence", "ai_confidence", "confidence") ?? null,
  };
}

function normalizeFile(raw: unknown): DownloadFile[] {
  if (!isRecord(raw)) {
    return [];
  }

  const id = pickString(raw, "id", "fileId", "file_id", "documentId", "document_id");

  if (!id) {
    return [];
  }

  const isUnlocked =
    pickBoolean(raw, "isUnlocked", "is_unlocked", "unlocked", "canDownload", "can_download") ??
    true;
  const requiresReview =
    pickBoolean(raw, "requiresReview", "requires_review") ??
    normalizeFileStatus(raw.status, isUnlocked) === "requires_review";
  const status = normalizeFileStatus(raw.status, isUnlocked);

  return [
    {
      id,
      fileName:
        pickString(raw, "fileName", "file_name", "filename", "name", "title") ||
        "Documento final",
      category: normalizeCategory(raw.category ?? raw.type ?? raw.documentType ?? raw.document_type),
      mimeType:
        pickString(raw, "mimeType", "mime_type", "contentType", "content_type") ||
        "application/pdf",
      sizeBytes: pickNumber(raw, "sizeBytes", "size_bytes", "size", "bytes") || 0,
      status,
      isUnlocked,
      requiresReview,
      downloadCount: pickNumber(raw, "downloadCount", "download_count", "downloads") || 0,
      generatedAt:
        pickString(raw, "generatedAt", "generated_at", "createdAt", "created_at") || null,
      lastDownloadedAt:
        pickString(raw, "lastDownloadedAt", "last_downloaded_at", "downloadedAt", "downloaded_at") ||
        null,
    },
  ];
}

function normalizeShareLink(raw: unknown): ShareLink[] {
  if (!isRecord(raw)) {
    return [];
  }

  const id = pickString(raw, "id", "shareLinkId", "share_link_id", "token");

  if (!id) {
    return [];
  }

  const expiresAt =
    pickString(raw, "expiresAt", "expires_at", "expiration", "expirationDate", "expiration_date") ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id,
      recipientName:
        pickString(raw, "recipientName", "recipient_name", "name", "lawyerName", "lawyer_name") ||
        null,
      recipientEmail:
        pickString(raw, "recipientEmail", "recipient_email", "email", "lawyerEmail", "lawyer_email") ||
        null,
      status: normalizeShareStatus(raw.status),
      permissions: normalizePermissions(raw.permissions).length
        ? normalizePermissions(raw.permissions)
        : ["view"],
      fileIds: asStringArray(raw.fileIds ?? raw.file_ids ?? raw.files),
      expiresAt,
      viewCount: pickNumber(raw, "viewCount", "view_count", "views") || 0,
      maxViews: pickNumber(raw, "maxViews", "max_views", "viewLimit", "view_limit") ?? null,
      createdAt: pickString(raw, "createdAt", "created_at") || null,
    },
  ];
}

function normalizeTimelineEvent(raw: unknown): DeliveryTimelineEvent[] {
  if (!isRecord(raw)) {
    return [];
  }

  return [
    {
      id: pickString(raw, "id", "eventId", "event_id") || getRandomId("event"),
      eventType:
        pickString(raw, "eventType", "event_type", "type", "action") ||
        "delivery_event",
      actorRole: normalizeActorRole(raw.actorRole ?? raw.actor_role ?? raw.actor),
      createdAt:
        pickString(raw, "createdAt", "created_at", "occurredAt", "occurred_at") ||
        new Date().toISOString(),
      label: pickString(raw, "label", "title"),
      description: pickString(raw, "description", "detail", "message"),
    },
  ];
}

function normalizeAvailableActions(
  raw: unknown,
  files: DownloadFile[],
  deliveryPackage: DeliveryPackage | null,
): DeliveryAvailableActions {
  const defaults = {
    canDownload: files.some((file) => file.status === "available" && file.isUnlocked),
    canCreateShareLink: files.some((file) => file.status === "available" && file.isUnlocked),
    canComplementCase: deliveryPackage?.status !== "closed",
    canCloseCase: Boolean(
      deliveryPackage &&
        !["generating", "blocked", "closed", "error", "not_started"].includes(deliveryPackage.status),
    ),
    closeBlockedReason: null,
  };

  if (!isRecord(raw)) {
    return defaults;
  }

  return {
    canDownload: pickBoolean(raw, "canDownload", "can_download") ?? defaults.canDownload,
    canCreateShareLink:
      pickBoolean(raw, "canCreateShareLink", "can_create_share_link", "canShare", "can_share") ??
      defaults.canCreateShareLink,
    canComplementCase:
      pickBoolean(raw, "canComplementCase", "can_complement_case", "canComplement", "can_complement") ??
      defaults.canComplementCase,
    canCloseCase:
      pickBoolean(raw, "canCloseCase", "can_close_case", "canClose", "can_close") ??
      defaults.canCloseCase,
    closeBlockedReason:
      pickString(raw, "closeBlockedReason", "close_blocked_reason", "blockedReason", "blocked_reason") ||
      null,
  };
}

function normalizeDeliveryResponse(raw: unknown, caseId: string): DeliveryResponse {
  const data = unwrapApiData(raw);
  const record = isRecord(data) ? data : {};
  const packageRaw =
    record.package ??
    record.deliveryPackage ??
    record.delivery_package ??
    (record.status || record.title ? record : null);
  const deliveryPackage = normalizePackage(packageRaw, caseId);
  const files = Array.isArray(record.files)
    ? record.files.flatMap(normalizeFile)
    : Array.isArray(record.documents)
      ? record.documents.flatMap(normalizeFile)
      : [];
  const shareLinks = Array.isArray(record.shareLinks)
    ? record.shareLinks.flatMap(normalizeShareLink)
    : Array.isArray(record.share_links)
      ? record.share_links.flatMap(normalizeShareLink)
      : [];
  const timeline = Array.isArray(record.timeline)
    ? record.timeline.flatMap(normalizeTimelineEvent)
    : Array.isArray(record.events)
      ? record.events.flatMap(normalizeTimelineEvent)
      : [];

  return {
    caseId: pickString(record, "caseId", "case_id") || caseId,
    package: deliveryPackage,
    files,
    shareLinks,
    timeline,
    availableActions: normalizeAvailableActions(
      record.availableActions ?? record.available_actions,
      files,
      deliveryPackage,
    ),
  };
}

function normalizeDownloadUrl(raw: unknown): DownloadUrlResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta de descarga no tiene el formato esperado.",
      status: 500,
      code: "INVALID_DELIVERY_DOWNLOAD_RESPONSE",
    });
  }

  return {
    downloadUrl:
      pickString(data, "downloadUrl", "download_url", "url") ||
      "",
    expiresInSeconds:
      pickNumber(data, "expiresInSeconds", "expires_in_seconds", "ttl", "ttlSeconds") ||
      900,
  };
}

function getShareUrl(raw: RawRecord, token?: string) {
  const direct = pickString(raw, "url", "shareUrl", "share_url", "publicUrl", "public_url");

  if (direct) {
    return direct;
  }

  if (!token) {
    return "";
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/share/delivery/${token}`;
}

function normalizeCreateShareLinkResponse(raw: unknown): CreateShareLinkResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta de enlace compartido no tiene el formato esperado.",
      status: 500,
      code: "INVALID_SHARE_LINK_RESPONSE",
    });
  }

  const linkRaw = isRecord(data.shareLink)
    ? data.shareLink
    : isRecord(data.share_link)
      ? data.share_link
      : data;
  const shareLink = normalizeShareLink(linkRaw)[0];
  const token = pickString(data, "token") || pickString(linkRaw, "token");

  if (!shareLink) {
    throw new ApiError({
      message: "La respuesta de enlace compartido no tiene el formato esperado.",
      status: 500,
      code: "INVALID_SHARE_LINK_RESPONSE",
    });
  }

  return {
    shareLink,
    token,
    url: getShareUrl(data, token),
  };
}

function normalizeSharedDeliveryResponse(raw: unknown, token: string): SharedDeliveryResponse {
  const data = unwrapApiData(raw);
  const record = isRecord(data) ? data : {};
  const rawStatus = asString(record.status);
  const status =
    rawStatus === "valid" || rawStatus === "error"
      ? rawStatus
      : normalizeShareStatus(record.status || "active");

  return {
    token,
    status,
    publicCaseNumber:
      pickString(record, "publicCaseNumber", "public_case_number", "caseNumber", "case_number") ||
      "Expediente compartido",
    recipientName:
      pickString(record, "recipientName", "recipient_name", "name") || null,
    expiresAt:
      pickString(record, "expiresAt", "expires_at") ||
      new Date().toISOString(),
    permissions: normalizePermissions(record.permissions).length
      ? normalizePermissions(record.permissions)
      : ["view"],
    files: Array.isArray(record.files)
      ? record.files.flatMap(normalizeFile)
      : Array.isArray(record.documents)
        ? record.documents.flatMap(normalizeFile)
        : [],
    message: pickString(record, "message", "description") || null,
  };
}

function normalizeComplementResponse(raw: unknown): ComplementDeliveryResponse {
  const data = unwrapApiData(raw);
  const record = isRecord(data) ? data : {};
  const status = asString(record.status);

  return {
    requestId:
      pickString(record, "requestId", "request_id", "id") ||
      getRandomId("complement"),
    status:
      status === "queued" || status === "requires_documents" || status === "error"
        ? status
        : "received",
    message:
      pickString(record, "message") ||
      "Recibimos tu solicitud de complemento.",
    nextHref: pickString(record, "nextHref", "next_href"),
  };
}

function normalizeCloseResponse(raw: unknown, caseId: string): CloseCaseResponse {
  const data = unwrapApiData(raw);
  const record = isRecord(data) ? data : {};
  const status = asString(record.status);

  return {
    caseId: pickString(record, "caseId", "case_id") || caseId,
    status: status === "blocked" || status === "error" ? status : "closed",
    closedAt:
      pickString(record, "closedAt", "closed_at") ||
      new Date().toISOString(),
    message: pickString(record, "message"),
    blockedReason: pickString(record, "blockedReason", "blocked_reason"),
  };
}

function normalizeEvents(raw: unknown): PaginatedDeliveryEvents {
  const data = unwrapList(raw as ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>);
  const items = getItems(data).flatMap(normalizeTimelineEvent);

  return {
    items,
    nextCursor: Array.isArray(data) ? null : data.nextCursor ?? data.next_cursor ?? null,
  };
}

export function getDeliveryErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return deliveryErrorMessages.DELIVERY_UNAUTHORIZED;
    }

    if (error.status === 403) {
      return deliveryErrorMessages.DELIVERY_FORBIDDEN;
    }

    return (error.code && deliveryErrorMessages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intentalo nuevamente.";
}

async function getDelivery(caseId: string): Promise<DeliveryResponse> {
  try {
    const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
      `/cases/${caseId}/delivery`,
    );

    return normalizeDeliveryResponse(response, caseId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return normalizeDeliveryResponse({ caseId, package: null, files: [] }, caseId);
    }

    throw error;
  }
}

async function downloadFile(fileId: string): Promise<DownloadUrlResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/delivery/files/${fileId}/download`,
    { method: "POST" },
  );

  return normalizeDownloadUrl(response);
}

async function downloadPackage(caseId: string): Promise<DownloadUrlResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/delivery/download`,
    { method: "POST" },
  );

  return normalizeDownloadUrl(response);
}

async function createShareLink(
  caseId: string,
  payload: CreateShareLinkPayload,
): Promise<CreateShareLinkResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/delivery/share-links`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeCreateShareLinkResponse(response);
}

async function getSharedDelivery(token: string): Promise<SharedDeliveryResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/share/delivery/${token}`,
  );

  return normalizeSharedDeliveryResponse(response, token);
}

async function downloadSharedFile(
  token: string,
  fileId: string,
): Promise<DownloadUrlResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/share/delivery/${token}/files/${fileId}/download`,
    { method: "POST" },
  );

  return normalizeDownloadUrl(response);
}

async function revokeShareLink(
  caseId: string,
  shareLinkId: string,
): Promise<ShareLink> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/delivery/share-links/${shareLinkId}/revoke`,
    { method: "POST" },
  );
  const data = normalizeShareLink(unwrapApiData(response))[0];

  if (!data) {
    return {
      id: shareLinkId,
      status: "revoked",
      permissions: ["view"],
      fileIds: [],
      expiresAt: new Date().toISOString(),
      viewCount: 0,
    };
  }

  return data;
}

async function complementDelivery(
  caseId: string,
  payload: ComplementDeliveryPayload,
): Promise<ComplementDeliveryResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/delivery/complement`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeComplementResponse(response);
}

async function closeCase(
  caseId: string,
  payload: CloseCasePayload,
): Promise<CloseCaseResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown> | void>(
    `/cases/${caseId}/delivery/close`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeCloseResponse(response, caseId);
}

async function getDeliveryEvents(
  caseId: string,
  cursor?: string,
): Promise<PaginatedDeliveryEvents> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const response = await apiFetch<
    ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>
  >(`/cases/${caseId}/delivery/events${query}`);

  return normalizeEvents(response);
}

export const deliveryApi = {
  getDelivery,
  downloadFile,
  downloadPackage,
  createShareLink,
  getSharedDelivery,
  downloadSharedFile,
  revokeShareLink,
  complementDelivery,
  closeCase,
  getDeliveryEvents,
};

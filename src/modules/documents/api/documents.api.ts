import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import { publicEnv } from "@/lib/env";
import type { ApiEnvelope } from "@/lib/api";
import type {
  CreateDocumentUploadRequest,
  CreateDocumentUploadResponse,
  DocumentClassificationSource,
  DocumentDetail,
  DocumentItem,
  DocumentReadiness,
  DocumentReadinessIssue,
  DocumentReadinessNextAction,
  DocumentReadinessStatus,
  DocumentStatus,
  DocumentTypeCategory,
  DocumentTypeDefinition,
  DocumentTypeSummary,
  DocumentValidation,
  DocumentValidationResult,
  DocumentValidationStatus,
  DocumentViewUrlResponse,
  ReplaceDocumentRequest,
  UpdateDocumentRequest,
} from "@/src/modules/documents/api/documents.types";

type RawRecord = Record<string, unknown>;
type ListEnvelope<T> = T[] | { items?: T[]; data?: T[] };

const documentStatuses: DocumentStatus[] = [
  "draft",
  "uploading",
  "uploaded",
  "processing",
  "validated",
  "requires_review",
  "rejected",
  "replaced",
  "deleted",
  "failed",
];

const validationStatuses: DocumentValidationStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
  "requires_review",
  "error",
];

const validationResults: DocumentValidationResult[] = [
  "accepted",
  "accepted_with_warnings",
  "rejected",
  "requires_review",
];

const readinessStatuses: DocumentReadinessStatus[] = [
  "missing_primary_document",
  "validating",
  "ready_for_preanalysis",
  "requires_review",
  "blocked",
];

const nextActions: DocumentReadinessNextAction[] = [
  "upload_primary_document",
  "review_documents",
  "continue_to_preanalysis",
];

const classificationSources: DocumentClassificationSource[] = [
  "manual",
  "ai",
  "system",
  "unknown",
];

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
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

function asStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value).flatMap(([key, rawValue]) => {
    const stringValue = asString(rawValue);
    return stringValue ? [[key, stringValue] as const] : [];
  });

  return entries.length ? Object.fromEntries(entries) : undefined;
}

function asDateString(value: unknown) {
  return asString(value) || new Date().toISOString();
}

function normalizeCategory(value: unknown): DocumentTypeCategory {
  const category = asString(value);

  if (category === "principal" || category === "soporte" || category === "otro") {
    return category;
  }

  return "otro";
}

function normalizeStatus(value: unknown): DocumentStatus {
  const status = asString(value);

  if (status && documentStatuses.includes(status as DocumentStatus)) {
    return status as DocumentStatus;
  }

  if (status === "valid" || status === "valid_with_warnings") {
    return "validated";
  }

  if (status === "validating") {
    return "processing";
  }

  return "uploaded";
}

function normalizeValidationStatus(value: unknown, status: DocumentStatus): DocumentValidationStatus {
  const validationStatus = asString(value);

  if (
    validationStatus &&
    validationStatuses.includes(validationStatus as DocumentValidationStatus)
  ) {
    return validationStatus as DocumentValidationStatus;
  }

  if (status === "processing" || status === "uploading") {
    return "in_progress";
  }

  if (status === "validated") {
    return "completed";
  }

  if (status === "requires_review") {
    return "requires_review";
  }

  if (status === "failed" || status === "rejected") {
    return "error";
  }

  return "not_started";
}

function normalizeValidationResult(value: unknown): DocumentValidationResult | undefined {
  const result = asString(value);

  if (result && validationResults.includes(result as DocumentValidationResult)) {
    return result as DocumentValidationResult;
  }

  if (result === "valid") {
    return "accepted";
  }

  if (result === "valid_with_warnings") {
    return "accepted_with_warnings";
  }

  return undefined;
}

function normalizeDocumentTypeSummary(value: unknown): DocumentTypeSummary | undefined {
  if (isRecord(value)) {
    const code = asString(value.code) || asString(value.documentTypeCode) || asString(value.document_type_code);
    const name = asString(value.name) || asString(value.label) || code;

    return code ? { code, name: name || code } : undefined;
  }

  const code = asString(value);
  return code ? { code, name: code } : undefined;
}

function normalizeWarning(raw: unknown) {
  if (!isRecord(raw)) {
    return [];
  }

  const message = asString(raw.message);

  if (!message) {
    return [];
  }

  return [
    {
      code: asString(raw.code) || "DOCUMENT_WARNING",
      message,
      page: asNumber(raw.page),
    },
  ];
}

function normalizeWarnings(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(normalizeWarning);
}

function normalizeChecks(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, boolean>>((acc, [key, check]) => {
    if (typeof check === "boolean") {
      acc[key] = check;
    }

    return acc;
  }, {});
}

function normalizeValidation(raw: unknown): DocumentValidation | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const result = normalizeValidationResult(raw.result) || "requires_review";

  return {
    result,
    score: asNumber(raw.score) ?? 0,
    checks: normalizeChecks(raw.checks),
    warnings: normalizeWarnings(raw.warnings),
    errors: normalizeWarnings(raw.errors),
  };
}

function normalizeDocumentItem(raw: unknown): DocumentItem {
  if (!isRecord(raw)) {
    throw new ApiError({
      message: "La respuesta del documento no tiene el formato esperado.",
      status: 500,
      code: "INVALID_DOCUMENT_RESPONSE",
    });
  }

  const status = normalizeStatus(raw.status);
  const documentType =
    normalizeDocumentTypeSummary(raw.documentType) ||
    normalizeDocumentTypeSummary(raw.document_type) ||
    normalizeDocumentTypeSummary(raw.documentTypeCode) ||
    normalizeDocumentTypeSummary(raw.document_type_code);
  const createdAt =
    asString(raw.createdAt) ||
    asString(raw.created_at) ||
    asString(raw.uploadedAt) ||
    asString(raw.uploaded_at);

  return {
    id: asString(raw.id) || asString(raw.documentId) || asString(raw.document_id) || "documento",
    caseId: asString(raw.caseId) || asString(raw.case_id) || "",
    displayName: asString(raw.displayName) || asString(raw.display_name),
    originalFilename:
      asString(raw.originalFilename) ||
      asString(raw.original_filename) ||
      asString(raw.filename) ||
      "Documento sin nombre",
    documentType,
    status,
    validationStatus: normalizeValidationStatus(
      raw.validationStatus ?? raw.validation_status,
      status,
    ),
    validationResult: normalizeValidationResult(
      raw.validationResult ?? raw.validation_result,
    ),
    pageCount: asNumber(raw.pageCount) ?? asNumber(raw.page_count),
    sizeBytes: asNumber(raw.sizeBytes) ?? asNumber(raw.size_bytes) ?? 0,
    isPrimary:
      asBoolean(raw.isPrimary) ??
      asBoolean(raw.is_primary) ??
      Boolean(documentType?.code && documentType.code.includes("historia")),
    isDuplicate: asBoolean(raw.isDuplicate) ?? asBoolean(raw.is_duplicate) ?? false,
    aiConfidence: asNumber(raw.aiConfidence) ?? asNumber(raw.ai_confidence),
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: asString(raw.updatedAt) || asString(raw.updated_at),
  };
}

function normalizeDocumentDetail(raw: unknown): DocumentDetail {
  if (!isRecord(raw)) {
    throw new ApiError({
      message: "La respuesta del documento no tiene el formato esperado.",
      status: 500,
      code: "INVALID_DOCUMENT_DETAIL_RESPONSE",
    });
  }

  const item = normalizeDocumentItem(raw);
  const source = asString(raw.classificationSource) || asString(raw.classification_source);

  return {
    ...item,
    mimeType:
      asString(raw.mimeType) ||
      asString(raw.mime_type) ||
      "application/pdf",
    classificationSource: source && classificationSources.includes(source as DocumentClassificationSource)
      ? (source as DocumentClassificationSource)
      : "unknown",
    validation: normalizeValidation(raw.validation),
  };
}

function normalizeDocumentType(raw: unknown): DocumentTypeDefinition {
  if (!isRecord(raw)) {
    throw new ApiError({
      message: "La respuesta de tipos documentales no tiene el formato esperado.",
      status: 500,
      code: "INVALID_DOCUMENT_TYPE_RESPONSE",
    });
  }

  const code = asString(raw.code) || asString(raw.id) || "otro_soporte";
  const allowedMimeTypes = asStringArray(raw.allowedMimeTypes ?? raw.allowed_mime_types);

  return {
    code,
    name: asString(raw.name) || asString(raw.label) || code,
    category: normalizeCategory(raw.category),
    isRequiredForBasicFlow:
      asBoolean(raw.isRequiredForBasicFlow) ??
      asBoolean(raw.is_required_for_basic_flow) ??
      false,
    isPrimaryCandidate:
      asBoolean(raw.isPrimaryCandidate) ??
      asBoolean(raw.is_primary_candidate) ??
      false,
    allowedMimeTypes: allowedMimeTypes.length
      ? allowedMimeTypes
      : ["application/pdf", "image/jpeg", "image/png"],
    maxSizeMb: asNumber(raw.maxSizeMb) ?? asNumber(raw.max_size_mb) ?? 50,
  };
}

function unwrapList<T>(response: ListEnvelope<T> | ApiEnvelope<ListEnvelope<T>>): ListEnvelope<T> {
  return unwrapApiData(response);
}

function normalizeDocumentUploadResponse(raw: unknown): CreateDocumentUploadResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta de carga documental no tiene el formato esperado.",
      status: 500,
      code: "INVALID_UPLOAD_RESPONSE",
    });
  }

  const rawDocument = data.document ?? data;
  const uploadMethod: "signed_url" | "multipart" =
    isRecord(data.upload) &&
    (data.upload.method === "multipart" || data.upload.method === "signed_url")
      ? data.upload.method
      : "signed_url";
  const upload = isRecord(data.upload)
    ? {
        id: asString(data.upload.id) || "upload",
        method: uploadMethod,
        uploadUrl: asString(data.upload.uploadUrl) || asString(data.upload.upload_url),
        headers: asStringRecord(data.upload.headers),
        expiresAt: asString(data.upload.expiresAt) || asString(data.upload.expires_at),
      }
    : undefined;

  return {
    document: normalizeDocumentItem(rawDocument),
    upload,
  };
}

function normalizeIssue(raw: unknown): DocumentReadinessIssue[] {
  if (!isRecord(raw)) {
    return [];
  }

  const message = asString(raw.message);

  if (!message) {
    return [];
  }

  return [
    {
      code: asString(raw.code) || "DOCUMENT_READINESS",
      message,
    },
  ];
}

function normalizeIssues(value: unknown): DocumentReadinessIssue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(normalizeIssue);
}

function normalizeReadiness(raw: unknown, caseId: string): DocumentReadiness {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta de readiness documental no tiene el formato esperado.",
      status: 500,
      code: "INVALID_DOCUMENT_READINESS_RESPONSE",
    });
  }

  const status = asString(data.readinessStatus) || asString(data.readiness_status);
  const nextAction = asString(data.nextAction) || asString(data.next_action);

  return {
    caseId: asString(data.caseId) || asString(data.case_id) || caseId,
    readinessStatus:
      status && readinessStatuses.includes(status as DocumentReadinessStatus)
        ? (status as DocumentReadinessStatus)
        : "missing_primary_document",
    hasPrimaryLaborHistory:
      asBoolean(data.hasPrimaryLaborHistory) ??
      asBoolean(data.has_primary_labor_history) ??
      false,
    documentsTotal: asNumber(data.documentsTotal) ?? asNumber(data.documents_total) ?? 0,
    documentsValidated:
      asNumber(data.documentsValidated) ?? asNumber(data.documents_validated) ?? 0,
    documentsWithWarnings:
      asNumber(data.documentsWithWarnings) ?? asNumber(data.documents_with_warnings) ?? 0,
    documentsRejected:
      asNumber(data.documentsRejected) ?? asNumber(data.documents_rejected) ?? 0,
    blockingIssues: normalizeIssues(data.blockingIssues ?? data.blocking_issues),
    warnings: normalizeIssues(data.warnings),
    nextAction:
      nextAction && nextActions.includes(nextAction as DocumentReadinessNextAction)
        ? (nextAction as DocumentReadinessNextAction)
        : undefined,
  };
}

export function getDocumentErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      CONSENT_REQUIRED:
        "Antes de cargar documentos necesitamos que aceptes las autorizaciones de tratamiento de datos.",
      CASE_ACCESS_DENIED: "No tienes permiso para ver este expediente.",
      DOCUMENT_SIZE_EXCEEDED: "El archivo supera el tamano maximo permitido.",
      DOCUMENT_MIME_TYPE_NOT_ALLOWED: "Este tipo de archivo no esta permitido.",
      DOCUMENT_PASSWORD_PROTECTED:
        "No pudimos leer este archivo porque parece estar protegido con contrasena.",
      DOCUMENT_CORRUPTED: "No pudimos leer este archivo. Sube una nueva version en PDF sin contrasena.",
      DOCUMENT_DUPLICATE: "Este archivo parece estar repetido en este expediente.",
      DOCUMENT_REQUIRES_REVIEW: "Este documento requiere revision antes de continuar.",
      STORAGE_PROVIDER_ERROR: "No pudimos guardar el archivo. Intenta nuevamente.",
      AI_CLASSIFICATION_FAILED:
        "No pudimos clasificar automaticamente el documento. Puedes seleccionar el tipo manualmente.",
      OCR_FAILED:
        "No pudimos leer todo el contenido. Puedes continuar con revision manual si el archivo es valido.",
    };

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intentalo nuevamente.";
}

export async function getDocumentTypes(): Promise<DocumentTypeDefinition[]> {
  const response = await apiFetch<
    ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>
  >("/document-types");
  const data = unwrapList(response);
  const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : data.data || [];

  return items.map(normalizeDocumentType);
}

export async function getCaseDocuments(caseId: string): Promise<DocumentItem[]> {
  const response = await apiFetch<
    ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>
  >(`/cases/${caseId}/documents`);
  const data = unwrapList(response);
  const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : data.data || [];

  return items.map(normalizeDocumentItem);
}

export async function createDocumentUpload(
  caseId: string,
  payload: CreateDocumentUploadRequest,
): Promise<CreateDocumentUploadResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/documents`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeDocumentUploadResponse(response);
}

export async function completeDocumentUpload(documentId: string): Promise<DocumentItem | void> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown> | void>(
    `/documents/${documentId}/complete-upload`,
    {
      method: "POST",
    },
  );

  return response ? normalizeDocumentItem(unwrapApiData(response)) : undefined;
}

export async function getDocumentDetail(documentId: string): Promise<DocumentDetail> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(`/documents/${documentId}`);
  return normalizeDocumentDetail(unwrapApiData(response));
}

export async function getDocumentViewUrl(
  documentId: string,
): Promise<DocumentViewUrlResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/documents/${documentId}/view-url`,
  );
  const data = unwrapApiData(response);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "No pudimos obtener el enlace seguro del documento.",
      status: 500,
      code: "INVALID_DOCUMENT_VIEW_URL_RESPONSE",
    });
  }

  return {
    url: resolveDocumentViewUrl(asString(data.url) || ""),
    expiresInSeconds:
      asNumber(data.expiresInSeconds) ?? asNumber(data.expires_in_seconds) ?? 0,
  };
}

export async function updateDocument(
  documentId: string,
  payload: UpdateDocumentRequest,
): Promise<DocumentDetail> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/documents/${documentId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

  return normalizeDocumentDetail(unwrapApiData(response));
}

export async function createReplacementUpload(
  documentId: string,
  payload: ReplaceDocumentRequest,
): Promise<CreateDocumentUploadResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/documents/${documentId}/replace`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeDocumentUploadResponse(response);
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiFetch<void>(`/documents/${documentId}`, {
    method: "DELETE",
  });
}

export async function getDocumentReadiness(caseId: string): Promise<DocumentReadiness> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/document-readiness`,
  );

  return normalizeReadiness(response, caseId);
}

export function uploadFileToUrl({
  file,
  method,
  uploadUrl,
  headers,
  signal,
  onProgress,
}: {
  file: File;
  method?: "PUT" | "POST";
  uploadUrl: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method || "PUT", resolveUploadUrl(uploadUrl));
    const requestHeaders = {
      "Content-Type": file.type || "application/octet-stream",
      ...headers,
    };

    Object.entries(requestHeaders).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(
        new ApiError({
          message: "No pudimos subir el archivo al almacenamiento seguro.",
          status: xhr.status,
          code: "STORAGE_PROVIDER_ERROR",
        }),
      );
    };

    xhr.onerror = () => {
      reject(
        new ApiError({
          message: "No pudimos subir el archivo al almacenamiento seguro.",
          status: xhr.status || 500,
          code: "STORAGE_PROVIDER_ERROR",
        }),
      );
    };

    xhr.onabort = () => {
      reject(
        new ApiError({
          message: "La carga fue cancelada.",
          status: 499,
          code: "UPLOAD_ABORTED",
        }),
      );
    };

    signal?.addEventListener(
      "abort",
      () => {
        xhr.abort();
      },
      { once: true },
    );

    xhr.send(file);
  });
}

function resolveUploadUrl(uploadUrl: string) {
  try {
    return new URL(uploadUrl).toString();
  } catch {
    // Relative upload URLs should target the API host, not the Next.js origin.
    return new URL(
      uploadUrl,
      uploadUrl.startsWith("/") ? publicEnv.apiUrl : `${publicEnv.apiUrl}/`,
    ).toString();
  }
}

function resolveDocumentViewUrl(viewUrl: string) {
  if (!viewUrl) {
    return "";
  }

  const apiBase = new URL(`${publicEnv.apiUrl}/`);

  try {
    const parsed = new URL(viewUrl, apiBase);
    const isLocalhost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    if (isLocalhost) {
      return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, apiBase.origin).toString();
    }

    return parsed.toString();
  } catch {
    return viewUrl;
  }
}

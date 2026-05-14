import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  AdminDocumentPrecheckItem,
  AdminDocumentPrecheckListResponse,
  AdminPrecheckDecisionPayload,
  AdminPrecheckListParams,
  DocumentIssueDto,
  DocumentPrecheckDecision,
  DocumentPrecheckDto,
  DocumentPrecheckListResponse,
  DocumentPrecheckStatus,
  IssueSeverity,
  OcrPagePreviewDto,
  OcrPreviewSummaryDto,
  StartOcrPreviewOptions,
  SuggestedAction,
  TrafficLight,
} from "@/src/modules/document-precheck/api/document-precheck.types";

type RawRecord = Record<string, unknown>;
type ListEnvelope<T> = T[] | { items?: T[]; data?: T[]; total?: number; page?: number; pageSize?: number };

const statuses: DocumentPrecheckStatus[] = [
  "not_started",
  "queued",
  "in_progress",
  "completed",
  "blocked",
  "requires_review",
  "error",
];

const decisions: DocumentPrecheckDecision[] = [
  "suitable",
  "suitable_with_observations",
  "requires_reupload",
  "requires_human_review",
  "unsupported",
  "failed",
];

const trafficLights: TrafficLight[] = ["green", "yellow", "red", "gray"];
const severities: IssueSeverity[] = ["info", "warning", "critical"];
const suggestedActions: SuggestedAction[] = [
  "continue",
  "upload_better_scan",
  "upload_correct_document",
  "add_supporting_document",
  "rotate_or_rescan",
  "contact_support",
  "wait_and_retry",
  "human_review",
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

function asStatus(value: unknown): DocumentPrecheckStatus {
  const status = asString(value);
  return status && statuses.includes(status as DocumentPrecheckStatus)
    ? (status as DocumentPrecheckStatus)
    : "not_started";
}

function asDecision(value: unknown): DocumentPrecheckDecision | null {
  const decision = asString(value);
  return decision && decisions.includes(decision as DocumentPrecheckDecision)
    ? (decision as DocumentPrecheckDecision)
    : null;
}

function asTrafficLight(value: unknown, decision: DocumentPrecheckDecision | null): TrafficLight {
  const light = asString(value);
  if (light && trafficLights.includes(light as TrafficLight)) {
    return light as TrafficLight;
  }

  if (decision === "suitable") {
    return "green";
  }

  if (decision === "suitable_with_observations" || decision === "requires_human_review") {
    return "yellow";
  }

  if (decision === "requires_reupload" || decision === "unsupported" || decision === "failed") {
    return "red";
  }

  return "gray";
}

function asSeverity(value: unknown): IssueSeverity {
  const severity = asString(value);
  return severity && severities.includes(severity as IssueSeverity)
    ? (severity as IssueSeverity)
    : "info";
}

function asSuggestedAction(value: unknown): SuggestedAction | undefined {
  const action = asString(value);
  return action && suggestedActions.includes(action as SuggestedAction)
    ? (action as SuggestedAction)
    : undefined;
}

function asDateString(value: unknown) {
  return asString(value) || new Date().toISOString();
}

function normalizeIssue(raw: unknown): DocumentIssueDto | null {
  if (!isRecord(raw)) {
    return null;
  }

  const message = asString(raw.message);
  const title = asString(raw.title) || asString(raw.code);

  if (!message && !title) {
    return null;
  }

  return {
    code: asString(raw.code) || "document_issue",
    severity: asSeverity(raw.severity),
    pageNumber: asNumber(raw.pageNumber) ?? asNumber(raw.page_number) ?? null,
    title: title || "Observacion documental",
    message: message || title || "Revisa este punto antes de continuar.",
    suggestedAction: asSuggestedAction(raw.suggestedAction ?? raw.suggested_action),
    metadata: isRecord(raw.metadata) ? raw.metadata : undefined,
  };
}

function normalizeIssues(value: unknown): DocumentIssueDto[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const issue = normalizeIssue(item);
    return issue ? [issue] : [];
  });
}

function normalizeOcrPage(raw: unknown): OcrPagePreviewDto | null {
  if (!isRecord(raw)) {
    return null;
  }

  const pageNumber = asNumber(raw.pageNumber) ?? asNumber(raw.page_number);
  if (!pageNumber) {
    return null;
  }

  return {
    pageNumber,
    textPreview: asString(raw.textPreview) || asString(raw.text_preview),
    confidenceScore: asNumber(raw.confidenceScore) ?? asNumber(raw.confidence_score),
    textDensity: asNumber(raw.textDensity) ?? asNumber(raw.text_density),
    isBlurry: asBoolean(raw.isBlurry) ?? asBoolean(raw.is_blurry),
    isRotated: asBoolean(raw.isRotated) ?? asBoolean(raw.is_rotated),
    rotationDegrees: asNumber(raw.rotationDegrees) ?? asNumber(raw.rotation_degrees) ?? null,
    hasTableLikeContent:
      asBoolean(raw.hasTableLikeContent) ?? asBoolean(raw.has_table_like_content),
    issues: normalizeIssues(raw.issues),
  };
}

function normalizeOcr(raw: unknown): OcrPreviewSummaryDto | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const pages = Array.isArray(raw.pages)
    ? raw.pages.flatMap((page) => {
        const normalized = normalizeOcrPage(page);
        return normalized ? [normalized] : [];
      })
    : [];

  return {
    ocrJobId: asString(raw.ocrJobId) || asString(raw.ocr_job_id),
    status: asString(raw.status) || "not_started",
    pagesTotal: asNumber(raw.pagesTotal) ?? asNumber(raw.pages_total),
    pagesProcessed: asNumber(raw.pagesProcessed) ?? asNumber(raw.pages_processed),
    textDetected: asBoolean(raw.textDetected) ?? asBoolean(raw.text_detected),
    avgTextDensity: asNumber(raw.avgTextDensity) ?? asNumber(raw.avg_text_density),
    pages,
  };
}

export function normalizeDocumentPrecheck(raw: unknown): DocumentPrecheckDto {
  if (!isRecord(raw)) {
    throw new ApiError({
      message: "La respuesta de revision documental no tiene el formato esperado.",
      status: 500,
      code: "INVALID_DOCUMENT_PRECHECK_RESPONSE",
    });
  }

  const decision = asDecision(raw.decision);

  return {
    precheckId:
      asString(raw.precheckId) ||
      asString(raw.precheck_id) ||
      asString(raw.id) ||
      "precheck",
    caseId: asString(raw.caseId) || asString(raw.case_id) || "",
    documentId: asString(raw.documentId) || asString(raw.document_id) || "",
    documentName:
      asString(raw.documentName) ||
      asString(raw.document_name) ||
      asString(raw.filename),
    status: asStatus(raw.status),
    decision,
    trafficLight: asTrafficLight(raw.trafficLight ?? raw.traffic_light, decision),
    confidenceScore:
      asNumber(raw.confidenceScore) ?? asNumber(raw.confidence_score) ?? null,
    summary: asString(raw.summary),
    issues: normalizeIssues(raw.issues),
    ocr: normalizeOcr(raw.ocr),
    createdAt: asDateString(raw.createdAt ?? raw.created_at),
    updatedAt: asString(raw.updatedAt) || asString(raw.updated_at),
    startedAt: asString(raw.startedAt) || asString(raw.started_at) || null,
    completedAt: asString(raw.completedAt) || asString(raw.completed_at) || null,
    failedAt: asString(raw.failedAt) || asString(raw.failed_at) || null,
  };
}

function normalizeList<T>(response: ListEnvelope<T> | ApiEnvelope<ListEnvelope<T>>) {
  return unwrapApiData(response);
}

function normalizePrecheckList(raw: unknown, caseId?: string): DocumentPrecheckListResponse {
  const data = normalizeList(raw as ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>);

  if (Array.isArray(data)) {
    return { caseId, items: data.map(normalizeDocumentPrecheck) };
  }

  if (!isRecord(data)) {
    return { caseId, items: [] };
  }

  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.data)
      ? data.data
      : [];

  return {
    caseId:
      asString((data as RawRecord).caseId) ||
      asString((data as RawRecord).case_id) ||
      caseId,
    items: items.map(normalizeDocumentPrecheck),
  };
}

function normalizeAdminItem(raw: unknown): AdminDocumentPrecheckItem {
  const base = normalizeDocumentPrecheck(raw);
  const record = isRecord(raw) ? raw : {};

  return {
    ...base,
    caseNumber: asString(record.caseNumber) || asString(record.case_number),
    userName: asString(record.userName) || asString(record.user_name),
    reviewerName: asString(record.reviewerName) || asString(record.reviewer_name),
    documentType: asString(record.documentType) || asString(record.document_type),
    criticalIssuesCount:
      asNumber(record.criticalIssuesCount) ?? asNumber(record.critical_issues_count),
  };
}

function createAdminQuery(params: AdminPrecheckListParams = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 20));

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  if (params.trafficLight && params.trafficLight !== "all") {
    query.set("trafficLight", params.trafficLight);
  }

  if (params.query?.trim()) {
    query.set("query", params.query.trim());
  }

  if (params.reviewer?.trim()) {
    query.set("reviewer", params.reviewer.trim());
  }

  if (params.documentType?.trim()) {
    query.set("documentType", params.documentType.trim());
  }

  if (params.onlyCritical) {
    query.set("onlyCritical", "true");
  }

  return query.toString();
}

function normalizeAdminList(raw: unknown, params: AdminPrecheckListParams): AdminDocumentPrecheckListResponse {
  const data = normalizeList(raw as ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>);

  if (Array.isArray(data)) {
    return {
      items: data.map(normalizeAdminItem),
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      total: data.length,
    };
  }

  if (!isRecord(data)) {
    return { items: [], page: 1, pageSize: 20, total: 0 };
  }

  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.data)
      ? data.data
      : [];

  return {
    items: items.map(normalizeAdminItem),
    page: asNumber(data.page) ?? params.page ?? 1,
    pageSize: asNumber(data.pageSize) ?? params.pageSize ?? 20,
    total: asNumber(data.total) ?? items.length,
  };
}

export function getPrecheckErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      CONSENT_REQUIRED:
        "Antes de revisar documentos necesitamos tu autorizacion de tratamiento de datos.",
      DOCUMENT_NOT_FOUND:
        "No encontramos este documento. Verifica que siga asociado al expediente.",
      UNAUTHORIZED: "No tienes permiso para ver este documento.",
      CASE_ACCESS_DENIED: "No tienes permiso para ver este expediente.",
      AI_PROVIDER_TIMEOUT:
        "La revision esta tardando mas de lo esperado. Intenta nuevamente o solicita soporte.",
      OCR_FAILED:
        "No pudimos leer el archivo. Sube una version mas clara o verifica que no tenga contrasena.",
    };

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la revision. Intenta de nuevo.";
}

export async function startDocumentPrecheck(
  caseId: string,
  documentId: string,
  force = false,
): Promise<DocumentPrecheckDto> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/document-precheck`,
    {
      method: "POST",
      body: JSON.stringify({ documentId, force }),
    },
  );

  return normalizeDocumentPrecheck(unwrapApiData(response));
}

export async function getDocumentPrechecks(
  caseId: string,
  documentId?: string,
  latest = true,
): Promise<DocumentPrecheckListResponse> {
  const query = new URLSearchParams();
  if (documentId) {
    query.set("documentId", documentId);
  }
  if (latest) {
    query.set("latest", "true");
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/document-precheck${suffix}`,
  );

  return normalizePrecheckList(response, caseId);
}

export async function getDocumentPrecheck(
  caseId: string,
  precheckId: string,
): Promise<DocumentPrecheckDto> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/document-precheck/${precheckId}`,
  );

  return normalizeDocumentPrecheck(unwrapApiData(response));
}

export async function startOcrPreview(
  documentId: string,
  options: StartOcrPreviewOptions = {},
): Promise<OcrPreviewSummaryDto> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/documents/${documentId}/ocr-preview`,
    {
      method: "POST",
      body: JSON.stringify({
        maxPages: options.maxPages ?? 5,
        includeTextPreview: options.includeTextPreview ?? true,
        force: options.force ?? false,
      }),
    },
  );

  return normalizeOcr(unwrapApiData(response)) || { status: "not_started", pages: [] };
}

export async function getOcrPreview(documentId: string): Promise<OcrPreviewSummaryDto> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/documents/${documentId}/ocr-preview`,
  );

  return normalizeOcr(unwrapApiData(response)) || { status: "not_started", pages: [] };
}

export async function getAdminPrechecks(
  params: AdminPrecheckListParams = {},
): Promise<AdminDocumentPrecheckListResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/admin/document-precheck?${createAdminQuery(params)}`,
  );

  return normalizeAdminList(response, params);
}

export async function getAdminPrecheck(precheckId: string): Promise<AdminDocumentPrecheckItem> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/admin/document-precheck/${precheckId}`,
  );

  return normalizeAdminItem(unwrapApiData(response));
}

export async function submitAdminPrecheckDecision(
  precheckId: string,
  payload: AdminPrecheckDecisionPayload,
): Promise<AdminDocumentPrecheckItem> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/admin/document-precheck/${precheckId}/decision`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeAdminItem(unwrapApiData(response));
}

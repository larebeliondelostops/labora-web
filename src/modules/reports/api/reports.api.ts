import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import {
  getSectionOrder,
  getSectionTitle,
} from "@/src/modules/reports/utils/reportSectionOrder";
import type {
  AdminReviewDecisionResponse,
  CreateReportRequest,
  CreateReportResponse,
  DownloadExportResponse,
  EvidenceRef,
  ExportFile,
  ExportFormat,
  ExportReportRequest,
  ExportReportResponse,
  ReportDetailResponse,
  ReportSection,
  ReportStatus,
  ReportSummary,
  ReportType,
  ReportVersionSummary,
  ReportVersionsResponse,
  ReportsListResponse,
} from "@/src/modules/reports/api/reports.types";

type RawRecord = Record<string, unknown>;
type ListEnvelope<T> =
  | T[]
  | {
      items?: T[];
      data?: T[];
      results?: T[];
      page?: number;
      limit?: number;
      pageSize?: number;
      total?: number;
      pagination?: {
        page?: number;
        limit?: number;
        pageSize?: number;
        total?: number;
      };
    };

const statuses: ReportStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
  "requires_review",
  "error",
  "draft",
  "queued",
  "generating",
  "ready",
  "approved",
  "rejected",
  "failed",
];

const reportTypes: ReportType[] = [
  "executive",
  "technical",
  "calculation",
  "inconsistency_matrix",
  "full",
];

const exportFormats: ExportFormat[] = ["pdf", "docx"];

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

function asReportStatus(value: unknown): ReportStatus {
  const status = asString(value);

  if (status && statuses.includes(status as ReportStatus)) {
    return status as ReportStatus;
  }

  if (status === "pending" || status === "waiting") {
    return "queued";
  }

  if (status === "processing" || status === "running") {
    return "generating";
  }

  if (status === "done" || status === "published") {
    return "ready";
  }

  if (status === "cancelled" || status === "canceled") {
    return "failed";
  }

  return "not_started";
}

function asReportType(value: unknown): ReportType {
  const reportType = asString(value);

  if (reportType && reportTypes.includes(reportType as ReportType)) {
    return reportType as ReportType;
  }

  if (reportType === "matrix") {
    return "inconsistency_matrix";
  }

  if (reportType === "complete") {
    return "full";
  }

  return "full";
}

function asExportFormat(value: unknown): ExportFormat {
  const format = asString(value);
  return format && exportFormats.includes(format as ExportFormat)
    ? (format as ExportFormat)
    : "pdf";
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

function asSourceType(value: unknown): EvidenceRef["type"] {
  const type = asString(value);

  if (
    type === "analysis_result" ||
    type === "calculation_result" ||
    type === "document" ||
    type === "extraction" ||
    type === "rule"
  ) {
    return type;
  }

  return "document";
}

function unwrapList<T>(
  response: ListEnvelope<T> | ApiEnvelope<ListEnvelope<T>>,
): ListEnvelope<T> {
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

function normalizeEvidenceRef(raw: unknown): EvidenceRef[] {
  if (!isRecord(raw)) {
    return [];
  }

  const id = asString(raw.id) || asString(raw.sourceId) || asString(raw.source_id);
  const label =
    asString(raw.label) ||
    asString(raw.title) ||
    asString(raw.name) ||
    asString(raw.field);

  if (!id || !label) {
    return [];
  }

  return [
    {
      type: asSourceType(raw.type),
      id,
      label,
      page: asNumber(raw.page),
      field: asString(raw.field),
    },
  ];
}

function normalizeEvidenceRefs(value: unknown): EvidenceRef[] {
  return Array.isArray(value) ? value.flatMap(normalizeEvidenceRef) : [];
}

function stringifyContent(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return asStringArray(value).join("\n");
  }

  return "";
}

function normalizeReportSection(raw: unknown, index: number): ReportSection[] {
  if (!isRecord(raw)) {
    return [];
  }

  const sectionKey =
    asString(raw.sectionKey) ||
    asString(raw.section_key) ||
    asString(raw.key) ||
    asString(raw.slug) ||
    asString(raw.id);

  if (!sectionKey) {
    return [];
  }

  const contentJson = raw.contentJson ?? raw.content_json ?? raw.data ?? raw.payload;
  const contentMarkdown =
    stringifyContent(raw.contentMarkdown) ||
    stringifyContent(raw.content_markdown) ||
    stringifyContent(raw.markdown) ||
    stringifyContent(raw.content) ||
    stringifyContent(raw.text) ||
    stringifyContent(raw.summary);

  return [
    {
      id: asString(raw.id) || sectionKey,
      sectionKey,
      title: asString(raw.title) || getSectionTitle(sectionKey),
      contentMarkdown,
      contentJson,
      orderIndex:
        asNumber(raw.orderIndex) ??
        asNumber(raw.order_index) ??
        getSectionOrder(sectionKey, index),
      confidence:
        asNumber(raw.confidence) ??
        asNumber(raw.confidenceScore) ??
        asNumber(raw.confidence_score),
      sourceRefs: normalizeEvidenceRefs(
        raw.sourceRefs ?? raw.source_refs ?? raw.evidenceRefs ?? raw.evidence_refs,
      ),
    },
  ];
}

function normalizeSections(value: unknown): ReportSection[] {
  const sections = Array.isArray(value)
    ? value.flatMap((item, index) => normalizeReportSection(item, index))
    : [];

  return sections.sort((a, b) => a.orderIndex - b.orderIndex);
}

function normalizeExportStatus(value: unknown): ExportFile["status"] {
  const status = asString(value);

  if (
    status === "queued" ||
    status === "generating" ||
    status === "ready" ||
    status === "failed"
  ) {
    return status;
  }

  if (status === "processing" || status === "running") {
    return "generating";
  }

  if (status === "completed" || status === "done") {
    return "ready";
  }

  return "queued";
}

function normalizeExportFile(raw: unknown): ExportFile[] {
  if (!isRecord(raw)) {
    return [];
  }

  const id =
    asString(raw.id) ||
    asString(raw.exportFileId) ||
    asString(raw.export_file_id);
  const reportId = asString(raw.reportId) || asString(raw.report_id);
  const versionId = asString(raw.versionId) || asString(raw.version_id);

  if (!id || !reportId || !versionId) {
    return [];
  }

  return [
    {
      id,
      reportId,
      versionId,
      format: asExportFormat(raw.format),
      status: normalizeExportStatus(raw.status),
      fileName:
        asString(raw.fileName) ||
        asString(raw.file_name) ||
        asString(raw.filename),
      downloadUrl:
        asString(raw.downloadUrl) ||
        asString(raw.download_url) ||
        asString(raw.url),
      createdAt: asString(raw.createdAt) || asString(raw.created_at),
      expiresAt: asString(raw.expiresAt) || asString(raw.expires_at),
    },
  ];
}

function normalizeExportFiles(value: unknown): ExportFile[] {
  return Array.isArray(value) ? value.flatMap(normalizeExportFile) : [];
}

function normalizeReportSummary(raw: unknown, fallbackCaseId: string): ReportSummary {
  if (!isRecord(raw)) {
    throw new ApiError({
      message: "La respuesta de informes no tiene el formato esperado.",
      status: 500,
      code: "INVALID_REPORT_RESPONSE",
    });
  }

  const reportType = asReportType(raw.reportType ?? raw.report_type ?? raw.type);
  const now = new Date().toISOString();

  return {
    id:
      asString(raw.id) ||
      asString(raw.reportId) ||
      asString(raw.report_id) ||
      `${fallbackCaseId}-${reportType}`,
    caseId:
      asString(raw.caseId) ||
      asString(raw.case_id) ||
      fallbackCaseId,
    title:
      asString(raw.title) ||
      asString(raw.name) ||
      {
        executive: "Informe ejecutivo",
        technical: "Informe tecnico",
        calculation: "Informe de calculo",
        inconsistency_matrix: "Matriz de inconsistencias",
        full: "Informe completo",
      }[reportType],
    reportType,
    status: asReportStatus(raw.status),
    currentVersionId:
      asString(raw.currentVersionId) || asString(raw.current_version_id),
    versionNumber:
      asNumber(raw.versionNumber) ||
      asNumber(raw.version_number) ||
      asNumber(raw.version),
    requiresHumanReview:
      asBoolean(raw.requiresHumanReview) ||
      asBoolean(raw.requires_human_review),
    createdAt: asString(raw.createdAt) || asString(raw.created_at) || now,
    updatedAt: asString(raw.updatedAt) || asString(raw.updated_at) || now,
  };
}

function normalizeCreateReportResponse(
  raw: unknown,
  fallbackCaseId: string,
): CreateReportResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta de generacion no tiene el formato esperado.",
      status: 500,
      code: "INVALID_REPORT_RESPONSE",
    });
  }

  return {
    reportId:
      asString(data.reportId) ||
      asString(data.report_id) ||
      asString(data.id) ||
      "",
    caseId:
      asString(data.caseId) ||
      asString(data.case_id) ||
      fallbackCaseId,
    status: asReportStatus(data.status),
    jobId: asString(data.jobId) || asString(data.job_id),
    message: asString(data.message),
  };
}

function normalizeReportDetail(raw: unknown, fallbackReportId: string): ReportDetailResponse {
  const data = unwrapApiData(raw);
  const report = isRecord(data) && isRecord(data.report) ? data.report : data;

  if (!isRecord(report)) {
    throw new ApiError({
      message: "La respuesta del informe no tiene el formato esperado.",
      status: 500,
      code: "INVALID_REPORT_RESPONSE",
    });
  }

  const currentVersionRaw = isRecord(report.currentVersion)
    ? report.currentVersion
    : isRecord(report.current_version)
      ? report.current_version
      : {};
  const now = new Date().toISOString();
  const versionId =
    asString(currentVersionRaw.id) ||
    asString(report.currentVersionId) ||
    asString(report.current_version_id) ||
    "current";

  return {
    id:
      asString(report.id) ||
      asString(report.reportId) ||
      asString(report.report_id) ||
      fallbackReportId,
    caseId:
      asString(report.caseId) ||
      asString(report.case_id) ||
      "",
    title: asString(report.title) || asString(report.name) || "Informe",
    reportType:
      asString(report.reportType) ||
      asString(report.report_type) ||
      asString(report.type) ||
      "full",
    status: asReportStatus(report.status),
    currentVersion: {
      id: versionId,
      versionNumber:
        asNumber(currentVersionRaw.versionNumber) ||
        asNumber(currentVersionRaw.version_number) ||
        asNumber(report.versionNumber) ||
        asNumber(report.version_number) ||
        asNumber(report.version) ||
        1,
      createdAt:
        asString(currentVersionRaw.createdAt) ||
        asString(currentVersionRaw.created_at) ||
        asString(report.createdAt) ||
        asString(report.created_at) ||
        now,
    },
    sections: normalizeSections(report.sections),
    availableExports: normalizeExportFiles(
      report.availableExports ?? report.available_exports ?? report.exports,
    ),
    requiresHumanReview:
      asBoolean(report.requiresHumanReview) ||
      asBoolean(report.requires_human_review),
    reviewReason:
      asString(report.reviewReason) || asString(report.review_reason),
    aiConfidence:
      asNumber(report.aiConfidence) ||
      asNumber(report.ai_confidence) ||
      asNumber(report.confidence),
    traceability: {
      contentHash:
        asString(report.traceability && isRecord(report.traceability) ? report.traceability.contentHash : undefined) ||
        asString(report.traceability && isRecord(report.traceability) ? report.traceability.content_hash : undefined) ||
        asString(report.contentHash) ||
        asString(report.content_hash),
      sourceHash:
        asString(report.traceability && isRecord(report.traceability) ? report.traceability.sourceHash : undefined) ||
        asString(report.traceability && isRecord(report.traceability) ? report.traceability.source_hash : undefined) ||
        asString(report.sourceHash) ||
        asString(report.source_hash),
      generatedAt:
        asString(report.traceability && isRecord(report.traceability) ? report.traceability.generatedAt : undefined) ||
        asString(report.traceability && isRecord(report.traceability) ? report.traceability.generated_at : undefined) ||
        asString(report.generatedAt) ||
        asString(report.generated_at),
    },
  };
}

function normalizeExportReportResponse(
  raw: unknown,
  fallbackReportId: string,
  fallbackVersionId: string,
  fallbackFormat: ExportFormat,
): ExportReportResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta de exportacion no tiene el formato esperado.",
      status: 500,
      code: "INVALID_EXPORT_RESPONSE",
    });
  }

  return {
    exportFileId:
      asString(data.exportFileId) ||
      asString(data.export_file_id) ||
      asString(data.id) ||
      "",
    reportId:
      asString(data.reportId) ||
      asString(data.report_id) ||
      fallbackReportId,
    versionId:
      asString(data.versionId) ||
      asString(data.version_id) ||
      fallbackVersionId,
    format: asExportFormat(data.format) || fallbackFormat,
    status: normalizeExportStatus(data.status),
  };
}

function normalizeDownloadResponse(raw: unknown): DownloadExportResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta de descarga no tiene el formato esperado.",
      status: 500,
      code: "INVALID_EXPORT_RESPONSE",
    });
  }

  return {
    downloadUrl:
      asString(data.downloadUrl) ||
      asString(data.download_url) ||
      asString(data.url) ||
      "",
    expiresAt:
      asString(data.expiresAt) ||
      asString(data.expires_at) ||
      new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

function normalizeVersion(raw: unknown): ReportVersionSummary[] {
  if (!isRecord(raw)) {
    return [];
  }

  const id = asString(raw.id) || asString(raw.versionId) || asString(raw.version_id);
  const status = asString(raw.status);
  const versionStatus =
    status === "current" || status === "superseded" || status === "archived"
      ? status
      : "superseded";

  if (!id) {
    return [];
  }

  return [
    {
      id,
      versionNumber:
        asNumber(raw.versionNumber) ||
        asNumber(raw.version_number) ||
        asNumber(raw.version) ||
        1,
      status: versionStatus,
      changeSummary:
        asString(raw.changeSummary) ||
        asString(raw.change_summary) ||
        asString(raw.summary),
      createdAt:
        asString(raw.createdAt) ||
        asString(raw.created_at) ||
        new Date().toISOString(),
      createdByRole:
        asString(raw.createdByRole) ||
        asString(raw.created_by_role) ||
        asString(raw.authorRole) ||
        asString(raw.author_role),
    },
  ];
}

function normalizeVersions(raw: unknown): ReportVersionsResponse {
  const data = unwrapApiData(raw);
  const list = unwrapList(data as ListEnvelope<unknown>);
  return { items: getItems(list).flatMap(normalizeVersion) };
}

export function getReportErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      REPORT_CASE_NOT_FOUND: "No encontramos este expediente o ya no esta disponible.",
      REPORT_ACCESS_DENIED: "No tienes permiso para ver este informe.",
      REPORT_PAYMENT_REQUIRED: "Para acceder al informe completo debes desbloquear el analisis del expediente.",
      REPORT_ANALYSIS_NOT_READY: "El informe estara disponible cuando termine el analisis completo del expediente.",
      REPORT_CALCULATION_NOT_READY: "El calculo aun no esta listo para este informe.",
      REPORT_SOURCE_DATA_INCOMPLETE: "Faltan datos o documentos para generar este informe.",
      REPORT_LOW_CONFIDENCE_REQUIRES_REVIEW: "Detectamos informacion que debe ser validada antes de entregar el informe final.",
      REPORT_GENERATION_FAILED: "No pudimos generar el informe. Intenta nuevamente o contacta soporte.",
      REPORT_EXPORT_FAILED: "No pudimos exportar el archivo. Intenta nuevamente.",
      REPORT_VERSION_NOT_FOUND: "No encontramos esta version del informe.",
      REPORT_FILE_NOT_READY: "El archivo aun no esta listo para descarga.",
      REPORT_TEMPLATE_NOT_FOUND: "No encontramos la plantilla solicitada.",
    };

    if (error.status === 401) {
      return "Tu sesion expiro. Inicia sesion para continuar.";
    }

    if (error.status === 403) {
      return "No tienes permiso para ver este informe.";
    }

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intentalo nuevamente.";
}

export async function getReports(caseId: string): Promise<ReportsListResponse> {
  try {
    const response = await apiFetch<
      ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>
    >(`/cases/${caseId}/reports`);
    const data = unwrapList(response);
    const items = getItems(data).map((item) => normalizeReportSummary(item, caseId));

    if (Array.isArray(data)) {
      return {
        items,
        pagination: {
          page: 1,
          limit: items.length || 20,
          total: items.length,
        },
      };
    }

    return {
      items,
      pagination: {
        page: asNumber(data.pagination?.page) || asNumber(data.page) || 1,
        limit:
          asNumber(data.pagination?.limit) ||
          asNumber(data.pagination?.pageSize) ||
          asNumber(data.limit) ||
          asNumber(data.pageSize) ||
          20,
        total:
          asNumber(data.pagination?.total) ||
          asNumber(data.total) ||
          items.length,
      },
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        items: [],
        pagination: { page: 1, limit: 20, total: 0 },
      };
    }

    throw error;
  }
}

export async function createReport(
  caseId: string,
  payload: CreateReportRequest,
): Promise<CreateReportResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/reports`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeCreateReportResponse(response, caseId);
}

export async function getReport(reportId: string): Promise<ReportDetailResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/reports/${reportId}`,
  );

  return normalizeReportDetail(response, reportId);
}

export async function exportReport(
  reportId: string,
  payload: ExportReportRequest,
): Promise<ExportReportResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/reports/${reportId}/export`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeExportReportResponse(
    response,
    reportId,
    payload.versionId,
    payload.format,
  );
}

export async function downloadExport(
  exportFileId: string,
): Promise<DownloadExportResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/exports/${exportFileId}/download`,
  );

  return normalizeDownloadResponse(response);
}

export async function getReportVersions(
  reportId: string,
): Promise<ReportVersionsResponse> {
  const response = await apiFetch<
    ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>
  >(`/reports/${reportId}/versions`);

  return normalizeVersions(response);
}

export async function approveReport(
  reportId: string,
  comment?: string,
): Promise<AdminReviewDecisionResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/reports/${reportId}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ comment }),
    },
  );
  const data = unwrapApiData(response);

  return {
    reportId,
    status: isRecord(data) ? asReportStatus(data.status) : "approved",
    message: isRecord(data) ? asString(data.message) : undefined,
  };
}

export async function rejectReport(
  reportId: string,
  comment?: string,
): Promise<AdminReviewDecisionResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/reports/${reportId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ comment }),
    },
  );
  const data = unwrapApiData(response);

  return {
    reportId,
    status: isRecord(data) ? asReportStatus(data.status) : "rejected",
    message: isRecord(data) ? asString(data.message) : undefined,
  };
}

export async function requestReportRegeneration(
  reportId: string,
  comment?: string,
): Promise<AdminReviewDecisionResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/reports/${reportId}/regenerate`,
    {
      method: "POST",
      body: JSON.stringify({ comment }),
    },
  );
  const data = unwrapApiData(response);

  return {
    reportId,
    status: isRecord(data) ? asReportStatus(data.status) : "queued",
    message: isRecord(data) ? asString(data.message) : undefined,
  };
}

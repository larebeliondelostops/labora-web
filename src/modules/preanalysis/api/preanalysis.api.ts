import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  BlockedReason,
  IssueSeverity,
  MissingDocumentDto,
  MissingDocumentPriority,
  MissingDocumentStatus,
  PreAnalysisCtaDto,
  PreAnalysisCtaType,
  PreAnalysisResultDto,
  PreAnalysisStatus,
  PreAnalysisStatusDto,
  PreIssueDto,
  TrafficLight,
  ViabilityLevel,
} from "@/src/modules/preanalysis/api/preanalysis.types";

type RawRecord = Record<string, unknown>;
type EndpointFactory = (caseId: string) => string;

const resultEndpoint: EndpointFactory = (caseId) => `/cases/${caseId}/pre-analysis`;
const legacyResultEndpoint: EndpointFactory = (caseId) => `/cases/${caseId}/preanalysis`;
const statusEndpoint: EndpointFactory = (caseId) => `/cases/${caseId}/pre-analysis/status`;
const legacyStatusEndpoint: EndpointFactory = (caseId) => `/cases/${caseId}/preanalysis/status`;
const retryEndpoint: EndpointFactory = (caseId) => `/cases/${caseId}/pre-analysis/retry`;
const legacyRetryEndpoint: EndpointFactory = (caseId) => `/cases/${caseId}/preanalysis/retry`;

const statuses: PreAnalysisStatus[] = [
  "not_started",
  "queued",
  "in_progress",
  "completed",
  "blocked",
  "requires_review",
  "error",
];

const trafficLights: TrafficLight[] = ["green", "yellow", "red", "gray"];
const viabilityLevels: ViabilityLevel[] = ["high", "medium", "low", "insufficient"];
const severities: IssueSeverity[] = ["low", "medium", "high"];
const priorities: MissingDocumentPriority[] = ["required", "recommended", "optional"];
const missingStatuses: MissingDocumentStatus[] = [
  "pending",
  "uploaded",
  "waived",
  "not_applicable",
];
const ctaTypes: PreAnalysisCtaType[] = [
  "unlock_full_analysis",
  "upload_missing_docs",
  "wait_review",
];
const blockedReasons: BlockedReason[] = [
  "missing_consent",
  "missing_main_document",
  "document_rejected",
  "extraction_not_ready",
  "questionnaire_required",
  "case_not_found",
  "permission_denied",
  "unknown",
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

function normalizeStatus(value: unknown): PreAnalysisStatus {
  const status = asString(value);

  if (status && statuses.includes(status as PreAnalysisStatus)) {
    return status as PreAnalysisStatus;
  }

  if (status === "processing" || status === "running") {
    return "in_progress";
  }

  if (status === "ready" || status === "done") {
    return "completed";
  }

  if (status === "pending") {
    return "queued";
  }

  return "not_started";
}

function normalizeTrafficLight(value: unknown): TrafficLight | undefined {
  const trafficLight = asString(value);
  return trafficLight && trafficLights.includes(trafficLight as TrafficLight)
    ? (trafficLight as TrafficLight)
    : undefined;
}

function normalizeViability(value: unknown): ViabilityLevel | undefined {
  const viabilityLevel = asString(value);
  return viabilityLevel && viabilityLevels.includes(viabilityLevel as ViabilityLevel)
    ? (viabilityLevel as ViabilityLevel)
    : undefined;
}

function normalizeSeverity(value: unknown): IssueSeverity {
  const severity = asString(value);
  return severity && severities.includes(severity as IssueSeverity)
    ? (severity as IssueSeverity)
    : "medium";
}

function normalizePriority(value: unknown): MissingDocumentPriority {
  const priority = asString(value);
  return priority && priorities.includes(priority as MissingDocumentPriority)
    ? (priority as MissingDocumentPriority)
    : "recommended";
}

function normalizeMissingStatus(value: unknown): MissingDocumentStatus {
  const status = asString(value);
  return status && missingStatuses.includes(status as MissingDocumentStatus)
    ? (status as MissingDocumentStatus)
    : "pending";
}

function normalizeCtaType(value: unknown): PreAnalysisCtaType {
  const type = asString(value);
  return type && ctaTypes.includes(type as PreAnalysisCtaType)
    ? (type as PreAnalysisCtaType)
    : "unlock_full_analysis";
}

function normalizeBlockedReason(value: unknown): BlockedReason | undefined {
  const reason = asString(value);

  if (reason && blockedReasons.includes(reason as BlockedReason)) {
    return reason as BlockedReason;
  }

  if (reason === "missing_document") {
    return "missing_main_document";
  }

  if (reason === "access_denied") {
    return "permission_denied";
  }

  return reason ? "unknown" : undefined;
}

function normalizeProgress(value: unknown): number | undefined {
  const progress = asNumber(value);

  if (progress === undefined) {
    return undefined;
  }

  return Math.max(0, Math.min(100, progress > 0 && progress <= 1 ? progress * 100 : progress));
}

function makeEmptyResult(caseId: string): PreAnalysisResultDto {
  return {
    id: "",
    caseId,
    status: "not_started",
    issues: [],
    missingDocuments: [],
    warnings: [],
  };
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
      code: asString(raw.code) || "PRE_ANALYSIS_WARNING",
      message,
    },
  ];
}

function normalizeWarnings(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(normalizeWarning);
}

function normalizeIssue(raw: unknown): PreIssueDto[] {
  if (!isRecord(raw)) {
    return [];
  }

  const title = asString(raw.title) || asString(raw.name);
  const summary =
    asString(raw.publicSummary) ||
    asString(raw.public_summary) ||
    asString(raw.summary) ||
    asString(raw.description);

  if (!title || !summary) {
    return [];
  }

  return [
    {
      id: asString(raw.id) || `${title}-${Math.random().toString(16).slice(2)}`,
      type: asString(raw.type) || "general",
      severity: normalizeSeverity(raw.severity),
      title,
      publicSummary: summary,
      lockedDetailAvailable:
        asBoolean(raw.lockedDetailAvailable) ??
        asBoolean(raw.locked_detail_available) ??
        true,
      confidence: asNumber(raw.confidence),
    },
  ];
}

function normalizeIssues(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(normalizeIssue);
}

function normalizeMissingDocument(raw: unknown): MissingDocumentDto[] {
  if (!isRecord(raw)) {
    return [];
  }

  const title = asString(raw.title) || asString(raw.documentType) || asString(raw.document_type);

  if (!title) {
    return [];
  }

  return [
    {
      id: asString(raw.id) || `${title}-${Math.random().toString(16).slice(2)}`,
      documentType:
        asString(raw.documentType) ||
        asString(raw.document_type) ||
        asString(raw.type) ||
        "support",
      title,
      priority: normalizePriority(raw.priority),
      reason: asString(raw.reason),
      status: normalizeMissingStatus(raw.status),
    },
  ];
}

function normalizeMissingDocuments(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(normalizeMissingDocument);
}

function normalizeCta(value: unknown): PreAnalysisCtaDto | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const label = asString(value.label);

  if (!label) {
    return undefined;
  }

  return {
    type: normalizeCtaType(value.type),
    label,
    description: asString(value.description),
  };
}

export function normalizePreAnalysisResult(
  raw: unknown,
  fallbackCaseId: string,
): PreAnalysisResultDto {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    return makeEmptyResult(fallbackCaseId);
  }

  const status = normalizeStatus(data.status);
  const valueDetected = isRecord(data.valueDetected)
    ? data.valueDetected
    : isRecord(data.value_detected)
      ? data.value_detected
      : undefined;

  return {
    id:
      asString(data.id) ||
      asString(data.preAnalysisId) ||
      asString(data.pre_analysis_id) ||
      "",
    caseId:
      asString(data.caseId) ||
      asString(data.case_id) ||
      fallbackCaseId,
    status,
    trafficLight: normalizeTrafficLight(data.trafficLight ?? data.traffic_light),
    viabilityLevel: normalizeViability(data.viabilityLevel ?? data.viability_level),
    completionScore: normalizeProgress(
      data.completionScore ?? data.completion_score ?? data.completeness,
    ),
    confidence: normalizeProgress(data.confidence),
    progress: normalizeProgress(data.progress ?? data.percentage),
    currentStep: asString(data.currentStep) || asString(data.current_step),
    preliminaryCaseType:
      asString(data.preliminaryCaseType) || asString(data.preliminary_case_type),
    limitedSummary:
      asString(data.limitedSummary) ||
      asString(data.limited_summary) ||
      asString(data.summary),
    valueDetected: valueDetected
      ? {
          title: asString(valueDetected.title) || "Encontramos valor preliminar",
          summary:
            asString(valueDetected.summary) ||
            asString(valueDetected.description) ||
            "Hay senales iniciales que ameritan una revision completa.",
        }
      : undefined,
    issues: normalizeIssues(data.issues),
    missingDocuments: normalizeMissingDocuments(
      data.missingDocuments ?? data.missing_documents,
    ),
    cta: normalizeCta(data.cta),
    warnings: normalizeWarnings(data.warnings),
    blockedReason: normalizeBlockedReason(data.blockedReason ?? data.blocked_reason),
    canRetry: asBoolean(data.canRetry) ?? asBoolean(data.can_retry),
    createdAt: asString(data.createdAt) || asString(data.created_at),
    completedAt: asString(data.completedAt) || asString(data.completed_at),
  };
}

function normalizePreAnalysisStatus(
  raw: unknown,
  fallbackCaseId: string,
): PreAnalysisStatusDto {
  const result = normalizePreAnalysisResult(raw, fallbackCaseId);

  return {
    id: result.id,
    caseId: result.caseId,
    status: result.status,
    trafficLight: result.trafficLight,
    viabilityLevel: result.viabilityLevel,
    progress: result.progress,
    currentStep: result.currentStep,
    blockedReason: result.blockedReason,
    updatedAt: result.completedAt || result.createdAt,
  };
}

async function fetchWithFallback<T>(
  primaryPath: string,
  fallbackPath: string,
  options?: RequestInit,
) {
  try {
    return await apiFetch<T>(primaryPath, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return apiFetch<T>(fallbackPath, options);
    }

    throw error;
  }
}

function isMissingPreAnalysis(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const notFoundCodes = [
    "PRE_ANALYSIS_NOT_FOUND",
    "PREANALYSIS_NOT_FOUND",
    "PRE_ANALYSIS_NOT_STARTED",
    "PREANALYSIS_NOT_STARTED",
  ];

  return error.status === 404 && (!error.code || notFoundCodes.includes(error.code));
}

export function getPreAnalysisErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      CONSENT_REQUIRED:
        "Debes aceptar las autorizaciones requeridas antes de continuar.",
      CASE_ACCESS_DENIED: "No tienes permiso para ver este expediente.",
      CASE_NOT_FOUND: "No encontramos este expediente o ya no esta disponible.",
      PRE_ANALYSIS_BLOCKED:
        "El preanalisis esta bloqueado. Revisa las acciones pendientes.",
      PRE_ANALYSIS_NOT_READY:
        "Aun estamos preparando la informacion del expediente.",
      PRE_ANALYSIS_FAILED:
        "No pudimos generar el preanalisis. Intentalo nuevamente.",
      CASE_VALIDATION_ERROR:
        "No pudimos iniciar el preanalisis con la informacion enviada. Revisa que el expediente tenga documentos y preguntas requeridas.",
      AI_SERVICE_UNAVAILABLE:
        "El servicio de analisis no esta disponible en este momento.",
    };

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intentalo nuevamente.";
}

export async function getPreAnalysis(caseId: string): Promise<PreAnalysisResultDto> {
  try {
    const response = await fetchWithFallback<unknown | ApiEnvelope<unknown>>(
      resultEndpoint(caseId),
      legacyResultEndpoint(caseId),
    );

    return normalizePreAnalysisResult(response, caseId);
  } catch (error) {
    if (isMissingPreAnalysis(error)) {
      return makeEmptyResult(caseId);
    }

    throw error;
  }
}

export async function getPreAnalysisStatus(
  caseId: string,
): Promise<PreAnalysisStatusDto> {
  try {
    const response = await fetchWithFallback<unknown | ApiEnvelope<unknown>>(
      statusEndpoint(caseId),
      legacyStatusEndpoint(caseId),
    );

    return normalizePreAnalysisStatus(response, caseId);
  } catch (error) {
    if (isMissingPreAnalysis(error)) {
      return {
        caseId,
        status: "not_started",
      };
    }

    throw error;
  }
}

export async function startPreAnalysis(caseId: string): Promise<PreAnalysisResultDto> {
  const response = await fetchWithFallback<unknown | ApiEnvelope<unknown> | void>(
    resultEndpoint(caseId),
    legacyResultEndpoint(caseId),
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );

  if (!response) {
    return {
      ...makeEmptyResult(caseId),
      status: "queued",
    };
  }

  return normalizePreAnalysisResult(response, caseId);
}

export async function retryPreAnalysis(caseId: string): Promise<PreAnalysisResultDto> {
  const response = await fetchWithFallback<unknown | ApiEnvelope<unknown> | void>(
    retryEndpoint(caseId),
    legacyRetryEndpoint(caseId),
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );

  if (!response) {
    return {
      ...makeEmptyResult(caseId),
      status: "queued",
    };
  }

  return normalizePreAnalysisResult(response, caseId);
}

import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  ConfirmExtractionPayload,
  ConfirmExtractionResponse,
  ContributionGap,
  ContributionWeek,
  CorrectionItem,
  CreateEmployerPayload,
  CreateLaborPeriodPayload,
  DocumentReference,
  Employer,
  EmployerType,
  ExtractionConfirmationStatus,
  ExtractionIssue,
  ExtractionIssueSeverity,
  ExtractionIssueStatus,
  ExtractionResponse,
  ExtractionStatus,
  FieldStatus,
  IgnoreEntityPayload,
  LaborNovelty,
  LaborPeriod,
  LaborPeriodType,
  RegimeHint,
  SalaryBase,
  UpdateExtractionFieldsPayload,
} from "@/src/modules/extraction/api/extraction.types";

type RawRecord = Record<string, unknown>;
type ListEnvelope<T> = T[] | { items?: T[]; data?: T[] };

const extractionStatuses: ExtractionStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
  "requires_review",
  "error",
];

const confirmationStatuses: ExtractionConfirmationStatus[] = [
  "draft",
  "ai_extracted",
  "user_reviewing",
  "user_confirmed",
  "confirmed_with_pending_fields",
  "admin_review_required",
  "admin_approved",
  "rejected",
  "superseded",
];

const fieldStatuses: FieldStatus[] = [
  "extracted",
  "normalized",
  "low_confidence",
  "corrected_by_user",
  "corrected_by_admin",
  "pending_user_confirmation",
  "confirmed",
  "ignored",
  "conflict",
];

const employerTypes: EmployerType[] = ["private", "public", "teacher", "unknown"];
const periodTypes: LaborPeriodType[] = ["worked", "contributed", "reported", "gap", "unknown"];
const regimeHints: RegimeHint[] = ["general", "public", "teacher", "special", "unknown"];
const issueSeverities: ExtractionIssueSeverity[] = ["info", "warning", "critical"];
const issueStatuses: ExtractionIssueStatus[] = ["open", "resolved", "dismissed", "pending"];

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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const text = asString(item);
    return text ? [text] : [];
  });
}

function asDateString(value: unknown) {
  return asString(value) || "";
}

function asStatus(value: unknown): ExtractionStatus {
  const status = asString(value);
  return status && extractionStatuses.includes(status as ExtractionStatus)
    ? (status as ExtractionStatus)
    : "requires_review";
}

function asConfirmationStatus(value: unknown): ExtractionConfirmationStatus {
  const status = asString(value);
  return status && confirmationStatuses.includes(status as ExtractionConfirmationStatus)
    ? (status as ExtractionConfirmationStatus)
    : "ai_extracted";
}

function asFieldStatus(value: unknown, confidence?: number): FieldStatus {
  const status = asString(value);
  if (status && fieldStatuses.includes(status as FieldStatus)) {
    return status as FieldStatus;
  }

  if (typeof confidence === "number" && confidence < 0.65) {
    return "low_confidence";
  }

  return "extracted";
}

function asEmployerType(value: unknown): EmployerType {
  const type = asString(value);
  return type && employerTypes.includes(type as EmployerType)
    ? (type as EmployerType)
    : "unknown";
}

function asPeriodType(value: unknown): LaborPeriodType {
  const type = asString(value);
  return type && periodTypes.includes(type as LaborPeriodType)
    ? (type as LaborPeriodType)
    : "unknown";
}

function asRegimeHint(value: unknown): RegimeHint {
  const hint = asString(value);
  return hint && regimeHints.includes(hint as RegimeHint)
    ? (hint as RegimeHint)
    : "unknown";
}

function asIssueSeverity(value: unknown): ExtractionIssueSeverity {
  const severity = asString(value);
  return severity && issueSeverities.includes(severity as ExtractionIssueSeverity)
    ? (severity as ExtractionIssueSeverity)
    : "warning";
}

function asIssueStatus(value: unknown): ExtractionIssueStatus {
  const status = asString(value);
  return status && issueStatuses.includes(status as ExtractionIssueStatus)
    ? (status as ExtractionIssueStatus)
    : "open";
}

function normalizeBBox(raw: unknown) {
  if (!isRecord(raw)) {
    return undefined;
  }

  const x = asNumber(raw.x);
  const y = asNumber(raw.y);
  const width = asNumber(raw.width);
  const height = asNumber(raw.height);

  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined
  ) {
    return undefined;
  }

  return { x, y, width, height };
}

export function normalizeDocumentReference(raw: unknown): DocumentReference | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const documentId =
    asString(raw.documentId) ||
    asString(raw.document_id) ||
    asString(raw.id);

  if (!documentId) {
    return undefined;
  }

  return {
    documentId,
    documentName:
      asString(raw.documentName) ||
      asString(raw.document_name) ||
      asString(raw.filename),
    page: asNumber(raw.page) ?? asNumber(raw.pageNumber) ?? asNumber(raw.page_number),
    bbox: normalizeBBox(raw.bbox),
    sourceText:
      asString(raw.sourceText) ||
      asString(raw.source_text) ||
      asString(raw.text),
    fieldId:
      asString(raw.fieldId) ||
      asString(raw.field_id),
  };
}

function normalizeEmployer(raw: unknown): Employer | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    asString(raw.id) ||
    asString(raw.employerId) ||
    asString(raw.employer_id);
  const name =
    asString(raw.name) ||
    asString(raw.normalizedName) ||
    asString(raw.normalized_name) ||
    asString(raw.rawName) ||
    asString(raw.raw_name);

  if (!id || !name) {
    return null;
  }

  const confidence = asNumber(raw.confidence) ?? asNumber(raw.confidenceScore) ?? asNumber(raw.confidence_score);

  return {
    id,
    name,
    rawName: asString(raw.rawName) || asString(raw.raw_name),
    nit: asString(raw.nit),
    employerType: asEmployerType(raw.employerType ?? raw.employer_type),
    confidence,
    status: asFieldStatus(raw.status, confidence),
  };
}

function normalizeLaborPeriod(raw: unknown): LaborPeriod | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    asString(raw.id) ||
    asString(raw.periodId) ||
    asString(raw.period_id);
  const startDate = asDateString(raw.startDate ?? raw.start_date);

  if (!id || !startDate) {
    return null;
  }

  const confidence = asNumber(raw.confidence) ?? asNumber(raw.confidenceScore) ?? asNumber(raw.confidence_score);

  return {
    id,
    employerId: asString(raw.employerId) || asString(raw.employer_id),
    employerName: asString(raw.employerName) || asString(raw.employer_name),
    startDate,
    endDate:
      asString(raw.endDate) ||
      asString(raw.end_date) ||
      null,
    periodType: asPeriodType(raw.periodType ?? raw.period_type),
    regimeHint: asRegimeHint(raw.regimeHint ?? raw.regime_hint),
    weeksDetected: asNumber(raw.weeksDetected ?? raw.weeks_detected ?? raw.weeks),
    daysDetected: asNumber(raw.daysDetected ?? raw.days_detected ?? raw.days),
    salaryBaseDetected:
      asNumber(raw.salaryBaseDetected ?? raw.salary_base_detected ?? raw.salaryBase),
    novelty: asString(raw.novelty),
    confidence,
    status: asFieldStatus(raw.status, confidence),
    source: normalizeDocumentReference(raw.source ?? raw.documentReference ?? raw.document_reference),
  };
}

function normalizeContributionWeek(raw: unknown): ContributionWeek | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    asString(raw.id) ||
    asString(raw.weekId) ||
    asString(raw.week_id) ||
    `${asNumber(raw.year) || "year"}-${asNumber(raw.month) || "total"}-${asString(raw.employerId) || asString(raw.employer_id) || "all"}`;
  const year = asNumber(raw.year);
  const weeks = asNumber(raw.weeks ?? raw.weeksDetected ?? raw.weeks_detected);

  if (!year || weeks === undefined) {
    return null;
  }

  const confidence = asNumber(raw.confidence) ?? asNumber(raw.confidenceScore) ?? asNumber(raw.confidence_score);

  return {
    id,
    year,
    month: asNumber(raw.month),
    employerId: asString(raw.employerId) || asString(raw.employer_id),
    employerName: asString(raw.employerName) || asString(raw.employer_name),
    weeks,
    confidence,
    status: asFieldStatus(raw.status, confidence),
    source: normalizeDocumentReference(raw.source ?? raw.documentReference ?? raw.document_reference),
  };
}

function normalizeSalaryBase(raw: unknown): SalaryBase | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    asString(raw.id) ||
    asString(raw.salaryBaseId) ||
    asString(raw.salary_base_id) ||
    `${asNumber(raw.year) || "year"}-${asNumber(raw.month) || "month"}-${asString(raw.employerId) || asString(raw.employer_id) || "all"}`;
  const year = asNumber(raw.year);

  if (!year) {
    return null;
  }

  const confidence = asNumber(raw.confidence) ?? asNumber(raw.confidenceScore) ?? asNumber(raw.confidence_score);

  return {
    id,
    year,
    month: asNumber(raw.month),
    employerId: asString(raw.employerId) || asString(raw.employer_id),
    employerName: asString(raw.employerName) || asString(raw.employer_name),
    originalValue:
      asNumber(raw.originalValue ?? raw.original_value) ??
      asNumber(raw.value) ??
      null,
    normalizedValue:
      asNumber(raw.normalizedValue ?? raw.normalized_value) ??
      asNumber(raw.amount) ??
      null,
    confidence,
    status: asFieldStatus(raw.status, confidence),
    source: normalizeDocumentReference(raw.source ?? raw.documentReference ?? raw.document_reference),
  };
}

function normalizeGap(raw: unknown): ContributionGap | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    asString(raw.id) ||
    asString(raw.gapId) ||
    asString(raw.gap_id);

  if (!id) {
    return null;
  }

  const confidence = asNumber(raw.confidence) ?? asNumber(raw.confidenceScore) ?? asNumber(raw.confidence_score);

  return {
    id,
    startDate:
      asString(raw.startDate) ||
      asString(raw.start_date) ||
      null,
    endDate:
      asString(raw.endDate) ||
      asString(raw.end_date) ||
      null,
    days: asNumber(raw.days),
    weeks: asNumber(raw.weeks),
    reason:
      asString(raw.reason) ||
      asString(raw.description) ||
      asString(raw.message),
    confidence,
    status: asFieldStatus(raw.status, confidence),
    source: normalizeDocumentReference(raw.source ?? raw.documentReference ?? raw.document_reference),
  };
}

function normalizeNovelty(raw: unknown): LaborNovelty | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    asString(raw.id) ||
    asString(raw.noveltyId) ||
    asString(raw.novelty_id);
  const title =
    asString(raw.title) ||
    asString(raw.type) ||
    asString(raw.message);

  if (!id || !title) {
    return null;
  }

  return {
    id,
    type: asString(raw.type) || "novelty",
    title,
    description: asString(raw.description) || asString(raw.message),
    severity: asIssueSeverity(raw.severity),
    status: asIssueStatus(raw.status),
    source: normalizeDocumentReference(raw.source ?? raw.documentReference ?? raw.document_reference),
  };
}

export function normalizeExtractionIssue(raw: unknown): ExtractionIssue | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    asString(raw.id) ||
    asString(raw.issueId) ||
    asString(raw.issue_id);
  const message =
    asString(raw.message) ||
    asString(raw.description);
  const title =
    asString(raw.title) ||
    asString(raw.type) ||
    message;

  if (!id || !title) {
    return null;
  }

  return {
    id,
    type: asString(raw.type) || "data_quality",
    severity: asIssueSeverity(raw.severity),
    title,
    message: message || title,
    entityType: asString(raw.entityType) || asString(raw.entity_type),
    entityId: asString(raw.entityId) || asString(raw.entity_id),
    fieldKey: asString(raw.fieldKey) || asString(raw.field_key),
    status: asIssueStatus(raw.status),
    suggestedAction:
      asString(raw.suggestedAction) ||
      asString(raw.suggested_action),
    source: normalizeDocumentReference(raw.source ?? raw.documentReference ?? raw.document_reference),
  };
}

function normalizeCorrection(raw: unknown): CorrectionItem | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id =
    asString(raw.id) ||
    asString(raw.correctionId) ||
    asString(raw.correction_id);
  const fieldKey =
    asString(raw.fieldKey) ||
    asString(raw.field_key) ||
    asString(raw.field);

  if (!id || !fieldKey) {
    return null;
  }

  return {
    id,
    entityType:
      asString(raw.entityType) ||
      asString(raw.entity_type) ||
      "extraction",
    entityId: asString(raw.entityId) || asString(raw.entity_id),
    fieldKey,
    label: asString(raw.label),
    previousValue: raw.previousValue ?? raw.previous_value ?? raw.oldValue ?? raw.old_value,
    newValue: raw.newValue ?? raw.new_value,
    actorName:
      asString(raw.actorName) ||
      asString(raw.actor_name) ||
      asString(raw.userName) ||
      asString(raw.user_name),
    actorRole: asString(raw.actorRole) || asString(raw.actor_role),
    reason: asString(raw.reason),
    createdAt:
      asString(raw.createdAt) ||
      asString(raw.created_at) ||
      new Date().toISOString(),
  };
}

function normalizeArray<T>(value: unknown, normalizer: (raw: unknown) => T | null): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const normalized = normalizer(item);
    return normalized ? [normalized] : [];
  });
}

function unwrapList(raw: unknown): unknown[] {
  const data = unwrapApiData(raw as ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>);

  if (Array.isArray(data)) {
    return data;
  }

  if (!isRecord(data)) {
    return [];
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  return [];
}

export function normalizeExtractionResponse(raw: unknown, fallbackCaseId?: string): ExtractionResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta de extraccion no tiene el formato esperado.",
      status: 500,
      code: "INVALID_EXTRACTION_RESPONSE",
    });
  }

  const employers = normalizeArray(data.employers, normalizeEmployer);
  const laborPeriods = normalizeArray(
    data.laborPeriods ?? data.labor_periods ?? data.periods,
    normalizeLaborPeriod,
  );
  const contributionWeeks = normalizeArray(
    data.contributionWeeks ?? data.contribution_weeks ?? data.weeks,
    normalizeContributionWeek,
  );
  const salaryBases = normalizeArray(
    data.salaryBases ?? data.salary_bases ?? data.salaries,
    normalizeSalaryBase,
  );
  const gaps = normalizeArray(data.gaps ?? data.contributionGaps ?? data.contribution_gaps, normalizeGap);
  const novelties = normalizeArray(data.novelties ?? data.laborNovelties ?? data.labor_novelties, normalizeNovelty);
  const issues = normalizeArray(data.issues, normalizeExtractionIssue);
  const documentReferences = normalizeArray(
    data.documentReferences ?? data.document_references,
    (item) => normalizeDocumentReference(item) || null,
  );
  const summary = isRecord(data.summary) ? data.summary : {};
  const blockingReasons = asStringArray(data.blockingReasons ?? data.blocking_reasons);
  const status = asStatus(data.status);

  return {
    caseId:
      asString(data.caseId) ||
      asString(data.case_id) ||
      fallbackCaseId ||
      "",
    status,
    confirmationStatus: asConfirmationStatus(
      data.confirmationStatus ?? data.confirmation_status,
    ),
    confidenceAvg:
      asNumber(data.confidenceAvg ?? data.confidence_avg ?? data.confidenceAverage) ??
      null,
    lowConfidenceCount:
      asNumber(data.lowConfidenceCount ?? data.low_confidence_count) ??
      [
        ...employers,
        ...laborPeriods,
        ...contributionWeeks,
        ...salaryBases,
        ...gaps,
      ].filter((item) => item.status === "low_confidence").length,
    summary: {
      employersCount:
        asNumber(summary.employersCount ?? summary.employers_count) ?? employers.length,
      laborPeriodsCount:
        asNumber(summary.laborPeriodsCount ?? summary.labor_periods_count) ??
        laborPeriods.length,
      contributionWeeksTotal:
        asNumber(summary.contributionWeeksTotal ?? summary.contribution_weeks_total) ??
        contributionWeeks.reduce((total, item) => total + item.weeks, 0),
      salaryBasesCount:
        asNumber(summary.salaryBasesCount ?? summary.salary_bases_count) ??
        salaryBases.length,
      gapsCount:
        asNumber(summary.gapsCount ?? summary.gaps_count) ??
        gaps.length,
      noveltiesCount:
        asNumber(summary.noveltiesCount ?? summary.novelties_count) ??
        novelties.length,
    },
    employers,
    laborPeriods,
    contributionWeeks,
    salaryBases,
    gaps,
    novelties,
    issues,
    documentReferences,
    canConfirm:
      asBoolean(data.canConfirm ?? data.can_confirm) ??
      (status === "completed" && blockingReasons.length === 0),
    blockingReasons,
  };
}

function normalizeConfirmResponse(raw: unknown): ConfirmExtractionResponse {
  if (!raw) {
    return {};
  }

  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    return {};
  }

  return {
    status: extractionStatuses.includes(data.status as ExtractionStatus)
      ? (data.status as ExtractionStatus)
      : undefined,
    confirmationStatus: confirmationStatuses.includes(
      data.confirmationStatus as ExtractionConfirmationStatus,
    )
      ? (data.confirmationStatus as ExtractionConfirmationStatus)
      : confirmationStatuses.includes(data.confirmation_status as ExtractionConfirmationStatus)
        ? (data.confirmation_status as ExtractionConfirmationStatus)
        : undefined,
    nextStep: asString(data.nextStep) || asString(data.next_step),
    message: asString(data.message),
  };
}

export function getExtractionErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      CONSENT_REQUIRED:
        "Antes de revisar la extraccion necesitamos tu autorizacion de tratamiento de datos.",
      CASE_ACCESS_DENIED: "No tienes permiso para revisar esta extraccion.",
      EXTRACTION_NOT_FOUND: "Aun no hay datos extraidos para este expediente.",
      EXTRACTION_BLOCKED:
        "La extraccion esta bloqueada. Revisa los motivos antes de continuar.",
      VALIDATION_ERROR: "Revisa los campos marcados antes de guardar.",
    };

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intenta nuevamente.";
}

export async function getExtraction(caseId: string): Promise<ExtractionResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/extraction`,
  );

  return normalizeExtractionResponse(response, caseId);
}

export async function updateExtractionFields(
  caseId: string,
  payload: UpdateExtractionFieldsPayload,
): Promise<ExtractionResponse | void> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown> | void>(
    `/cases/${caseId}/extraction-fields`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

  return response ? normalizeExtractionResponse(response, caseId) : undefined;
}

export async function createExtractionEmployer(
  caseId: string,
  payload: CreateEmployerPayload,
): Promise<Employer> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/extraction/employers`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  const data = unwrapApiData(response);
  const employer = normalizeEmployer(isRecord(data) && data.employer ? data.employer : data);

  if (!employer) {
    throw new ApiError({
      message: "La respuesta del empleador no tiene el formato esperado.",
      status: 500,
      code: "INVALID_EMPLOYER_RESPONSE",
    });
  }

  return employer;
}

export async function createExtractionLaborPeriod(
  caseId: string,
  payload: CreateLaborPeriodPayload,
): Promise<LaborPeriod> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/extraction/labor-periods`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  const data = unwrapApiData(response);
  const period = normalizeLaborPeriod(isRecord(data) && data.period ? data.period : data);

  if (!period) {
    throw new ApiError({
      message: "La respuesta del periodo no tiene el formato esperado.",
      status: 500,
      code: "INVALID_LABOR_PERIOD_RESPONSE",
    });
  }

  return period;
}

export async function ignoreExtractionEntity(
  caseId: string,
  entityType: string,
  entityId: string,
  payload: IgnoreEntityPayload,
): Promise<void> {
  await apiFetch<void>(
    `/cases/${caseId}/extraction/entities/${entityType}/${entityId}/ignore`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function getExtractionCorrections(caseId: string): Promise<CorrectionItem[]> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/extraction/corrections`,
  );

  return unwrapList(response).flatMap((item) => {
    const correction = normalizeCorrection(item);
    return correction ? [correction] : [];
  });
}

export async function getExtractionIssues(caseId: string): Promise<ExtractionIssue[]> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/extraction/issues`,
  );

  return unwrapList(response).flatMap((item) => {
    const issue = normalizeExtractionIssue(item);
    return issue ? [issue] : [];
  });
}

export async function updateExtractionIssue(
  caseId: string,
  issueId: string,
  payload: { status: ExtractionIssueStatus; reason?: string },
): Promise<ExtractionIssue> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/extraction/issues/${issueId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  const data = unwrapApiData(response);
  const issue = normalizeExtractionIssue(isRecord(data) && data.issue ? data.issue : data);

  if (!issue) {
    throw new ApiError({
      message: "La respuesta de la inconsistencia no tiene el formato esperado.",
      status: 500,
      code: "INVALID_EXTRACTION_ISSUE_RESPONSE",
    });
  }

  return issue;
}

export async function confirmExtraction(
  caseId: string,
  payload: ConfirmExtractionPayload,
): Promise<ConfirmExtractionResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown> | void>(
    `/cases/${caseId}/confirm-extraction`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeConfirmResponse(response);
}

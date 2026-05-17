import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  CaseHistoryItem,
  CaseListParams,
  CaseListResponse,
  CaseNextAction,
  CaseStatus,
  CaseTypeRequested,
  CloseCasePayload,
  CreateCasePayload,
  DocumentType,
  LaboraCase,
  SituationType,
  UpdateCasePayload,
} from "@/src/modules/cases/api/cases.types";
import { deriveNextAction } from "@/src/modules/cases/utils/caseActions";
import { maskDocument } from "@/src/modules/cases/utils/caseFormatters";

type RawRecord = Record<string, unknown>;
type ListEnvelope<T> = T[] | { items?: T[]; data?: T[]; total?: number; page?: number; pageSize?: number };

const statuses: CaseStatus[] = [
  "draft",
  "created",
  "ready_for_documents",
  "documents_pending",
  "documents_uploaded",
  "preanalysis_pending",
  "preanalysis_ready",
  "preview_locked",
  "paid_unlocked",
  "analysis_in_progress",
  "completed",
  "requires_review",
  "blocked",
  "closed",
  "archived",
  "error",
];

const caseTypes: CaseTypeRequested[] = [
  "labor_history_analysis",
  "pension_liquidation_review",
  "pension_reliquidation",
  "missing_weeks_review",
  "public_service_time_review",
  "teacher_magisterio_case",
  "special_regime_case",
  "administrative_claim",
  "lawsuit_draft_preparation",
  "not_sure",
];

const situationTypes: SituationType[] = [
  "not_pensioned_yet",
  "pensioned_with_doubts",
  "request_denied",
  "recognized_with_possible_error",
  "reliquidation_needed",
  "missing_weeks_or_time",
  "employer_default_or_omission",
  "regime_transfer_issue",
  "other",
  "not_sure",
];

const documentTypes: DocumentType[] = ["CC", "CE", "PA", "NIT", "OTHER"];

const legacyStatusMap: Record<string, CaseStatus> = {
  pending_payment: "preview_locked",
  payment_approved: "paid_unlocked",
  document_validation: "documents_uploaded",
  questionnaire_pending: "created",
  analysis_pending: "preanalysis_pending",
  analysis_processing: "analysis_in_progress",
  results_available: "completed",
  legal_draft_generated: "completed",
  professional_review: "requires_review",
};

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asStatus(value: unknown): CaseStatus {
  const status = asString(value);

  if (status && statuses.includes(status as CaseStatus)) {
    return status as CaseStatus;
  }

  if (status && legacyStatusMap[status]) {
    return legacyStatusMap[status];
  }

  return "created";
}

function asCaseType(value: unknown): CaseTypeRequested {
  const caseType = asString(value);

  if (caseType && caseTypes.includes(caseType as CaseTypeRequested)) {
    return caseType as CaseTypeRequested;
  }

  return "not_sure";
}

function asSituationType(value: unknown): SituationType {
  const situationType = asString(value);

  if (situationType && situationTypes.includes(situationType as SituationType)) {
    return situationType as SituationType;
  }

  return "not_sure";
}

function asDocumentType(value: unknown): DocumentType {
  const documentType = asString(value)?.toUpperCase();

  if (documentType && documentTypes.includes(documentType as DocumentType)) {
    return documentType as DocumentType;
  }

  return "CC";
}

function asNextAction(value: unknown, status: CaseStatus): CaseNextAction {
  const action = asString(value);
  const valid: CaseNextAction[] = [
    "complete_case",
    "upload_documents",
    "start_preanalysis",
    "view_preanalysis",
    "unlock_full_analysis",
    "start_full_analysis",
    "view_report",
    "request_review",
    "none",
  ];

  if (action && valid.includes(action as CaseNextAction)) {
    return action as CaseNextAction;
  }

  return deriveNextAction(status);
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

function normalizeCase(raw: unknown): LaboraCase {
  if (!isRecord(raw)) {
    throw new ApiError({
      message: "La respuesta del expediente no tiene el formato esperado.",
      status: 500,
      code: "INVALID_CASE_RESPONSE",
    });
  }

  const holder = isRecord(raw.holder) ? raw.holder : {};
  const status = asStatus(raw.status);
  const documentNumber = asString(holder.documentNumber) || asString(holder.document_number);
  const actingAsThirdParty =
    asBoolean(raw.actingAsThirdParty) ??
    asBoolean(raw.acting_as_third_party) ??
    (raw.holderType === "third_party" || raw.holder_type === "third_party");
  const nextBestAction = asNextAction(raw.nextBestAction ?? raw.next_best_action, status);
  const now = new Date().toISOString();

  return {
    id: asString(raw.id) || asString(raw.caseId) || asString(raw.case_id) || "demo",
    caseNumber:
      asString(raw.caseNumber) ||
      asString(raw.case_number) ||
      asString(raw.number) ||
      "EXP-SIN-NUMERO",
    holderType:
      raw.holderType === "third_party" || raw.holder_type === "third_party"
        ? "third_party"
        : "self",
    holder: {
      firstName:
        asString(holder.firstName) ||
        asString(holder.first_name) ||
        asString(raw.holderFirstName) ||
        asString(raw.holderName)?.split(" ")[0] ||
        "",
      lastName:
        asString(holder.lastName) ||
        asString(holder.last_name) ||
        asString(raw.holderLastName) ||
        asString(raw.holderName)?.split(" ").slice(1).join(" ") ||
        "",
      documentType: asDocumentType(holder.documentType ?? holder.document_type),
      documentNumber,
      documentNumberMasked:
        asString(holder.documentNumberMasked) ||
        asString(holder.document_number_masked) ||
        maskDocument(documentNumber),
      birthDate:
        asString(holder.birthDate) || asString(holder.birth_date) || null,
      email: asString(holder.email) || null,
      emailMasked:
        asString(holder.emailMasked) || asString(holder.email_masked) || asString(holder.email) || null,
      phone: asString(holder.phone) || null,
      phoneMasked:
        asString(holder.phoneMasked) || asString(holder.phone_masked) || asString(holder.phone) || null,
    },
    actingAsThirdParty,
    thirdPartyRelationship:
      asString(raw.thirdPartyRelationship) || asString(raw.third_party_relationship) || null,
    thirdPartyAuthorizationStatus:
      (asString(raw.thirdPartyAuthorizationStatus) ||
        asString(raw.third_party_authorization_status) ||
        (actingAsThirdParty ? "pending" : "not_required")) as LaboraCase["thirdPartyAuthorizationStatus"],
    caseTypeRequested: asCaseType(
      raw.caseTypeRequested ?? raw.case_type_requested ?? raw.caseType ?? raw.case_type ?? raw.serviceType,
    ),
    caseTypeSuggested: raw.caseTypeSuggested
      ? asCaseType(raw.caseTypeSuggested)
      : raw.case_type_suggested
        ? asCaseType(raw.case_type_suggested)
        : null,
    caseTypeConfidence:
      asNumber(raw.caseTypeConfidence) ?? asNumber(raw.case_type_confidence) ?? null,
    pensionFundOrEntity:
      asString(raw.pensionFundOrEntity) ||
      asString(raw.pension_fund_or_entity) ||
      asString(raw.pensionFund) ||
      null,
    situationType: asSituationType(raw.situationType ?? raw.situation_type),
    situationDescription:
      asString(raw.situationDescription) || asString(raw.situation_description) || null,
    status,
    statusReason: asString(raw.statusReason) || asString(raw.status_reason) || null,
    currentStep: asString(raw.currentStep) || asString(raw.current_step) || status,
    nextBestAction,
    allowedActions:
      asStringArray(raw.allowedActions ?? raw.allowed_actions).length > 0
        ? asStringArray(raw.allowedActions ?? raw.allowed_actions)
        : [nextBestAction],
    canEdit: asBoolean(raw.canEdit) ?? asBoolean(raw.can_edit),
    createdAt: asString(raw.createdAt) || asString(raw.created_at) || now,
    updatedAt: asString(raw.updatedAt) || asString(raw.updated_at) || now,
  };
}

function normalizeHistoryItem(raw: unknown): CaseHistoryItem {
  if (!isRecord(raw)) {
    return {
      id: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      title: "Movimiento del expediente",
      severity: "info",
    };
  }

  const severity = asString(raw.severity);

  return {
    id: asString(raw.id) || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    occurredAt:
      asString(raw.occurredAt) ||
      asString(raw.occurred_at) ||
      asString(raw.createdAt) ||
      asString(raw.created_at) ||
      new Date().toISOString(),
    title: asString(raw.title) || asString(raw.event) || "Movimiento del expediente",
    description: asString(raw.description) || asString(raw.detail) || null,
    severity:
      severity === "success" || severity === "warning" || severity === "error"
        ? severity
        : "info",
    icon: asString(raw.icon) || null,
  };
}

function unwrapList<T>(response: ListEnvelope<T> | ApiEnvelope<ListEnvelope<T>>): ListEnvelope<T> {
  return unwrapApiData(response);
}

function createQuery(params: CaseListParams) {
  const query = new URLSearchParams();

  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 20));

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  if (params.caseType && params.caseType !== "all") {
    query.set("caseType", params.caseType);
  }

  if (params.query?.trim()) {
    query.set("query", params.query.trim());
  }

  return query.toString();
}

export function getCaseErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "CONSENT_REQUIRED") {
      return "Antes de crear el expediente necesitamos que aceptes las autorizaciones de tratamiento de datos personales y sensibles.";
    }

    if (error.code === "CASE_ACCESS_DENIED") {
      return "No tienes permiso para ver este expediente.";
    }

    if (error.code === "CASE_NOT_FOUND") {
      return "No encontramos este expediente o ya no esta disponible.";
    }

    if (error.code === "CASE_STATE_CONFLICT") {
      return "El expediente cambio de estado. Actualiza la pagina para continuar.";
    }

    if (error.code === "CASE_LOCKED") {
      return "Este expediente no puede modificarse en este momento.";
    }

    return error.message;
  }

  return "No pudimos completar la accion. Intentalo nuevamente.";
}

export async function getCases(params: CaseListParams = {}): Promise<CaseListResponse> {
  const response = await apiFetch<
    ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>
  >(`/cases?${createQuery(params)}`);
  const data = unwrapList(response);

  if (Array.isArray(data)) {
    return {
      items: data.map(normalizeCase),
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      total: data.length,
    };
  }

  const rawItems = Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [];

  return {
    items: rawItems.map(normalizeCase),
    page: asNumber(data.page) ?? params.page ?? 1,
    pageSize: asNumber(data.pageSize) ?? params.pageSize ?? 20,
    total: asNumber(data.total) ?? rawItems.length,
  };
}

export async function getCase(caseId: string): Promise<LaboraCase> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(`/cases/${caseId}`);
  return normalizeCase(unwrapApiData(response));
}

export async function createCase(payload: CreateCasePayload): Promise<LaboraCase> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>("/cases", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeCase(unwrapApiData(response));
}

export async function submitCase(caseId: string): Promise<LaboraCase | void> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown> | void>(
    `/cases/${caseId}/submit`,
    {
      method: "POST",
    },
  );

  return response ? normalizeCase(unwrapApiData(response)) : undefined;
}

export async function updateCase(
  caseId: string,
  payload: UpdateCasePayload,
): Promise<LaboraCase> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(`/cases/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return normalizeCase(unwrapApiData(response));
}

export async function closeCase(
  caseId: string,
  payload: CloseCasePayload,
): Promise<void> {
  await apiFetch<void>(`/cases/${caseId}/close`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCaseHistory(caseId: string): Promise<CaseHistoryItem[]> {
  const response = await apiFetch<
    ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>
  >(`/cases/${caseId}/history`);
  const data = unwrapList(response);
  const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : data.data || [];

  return items.map(normalizeHistoryItem);
}

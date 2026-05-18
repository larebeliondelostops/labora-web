import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  AdminLegalDraftsResponse,
  AdminLegalDraftSummary,
  AdminReviewDecisionRequest,
  AvailableLegalActionsResponse,
  CreateDraftRequest,
  CreateDraftResponse,
  CreateLegalActionRequest,
  CreateLegalActionResponse,
  DraftAttachment,
  DraftExport,
  DraftQuality,
  DraftSection,
  DraftSectionStatus,
  EligibilityStatus,
  ExportDraftRequest,
  LegalActionAvailable,
  LegalActionDetail,
  LegalActionHistoryItem,
  LegalActionReadinessItem,
  LegalActionStatus,
  LegalActionType,
  LegalDraft,
  LegalDraftStatus,
  LegalDraftSummary,
  MissingAttachment,
  PendingMarker,
  ProfessionalReviewLevel,
  QualityCheckItem,
  QualityCheckStatus,
  QualityOverallStatus,
  RegenerateSectionRequest,
  SourceReference,
  SubmitReviewRequest,
  SuggestedFact,
  SuggestedRequest,
  UpdateDraftRequest,
  Warning,
  WarningSeverity,
} from "@/src/modules/legal-actions/api/legal-actions.types";
import {
  legalActionTypeDescriptions,
  legalActionTypeLabels,
} from "@/src/modules/legal-actions/utils/mapStatusToLabel";

type RawRecord = Record<string, unknown>;
type ListEnvelope<T> =
  | T[]
  | {
      items?: T[];
      data?: T[];
      results?: T[];
      actions?: T[];
      drafts?: T[];
      total?: number;
    };

const legalActionTypes: LegalActionType[] = [
  "technical_report_download",
  "executive_summary",
  "petition",
  "administrative_claim",
  "reliquidation_request",
  "administrative_appeal",
  "lawsuit_draft",
  "professional_review_request",
];

const actionStatuses: LegalActionStatus[] = [
  "not_started",
  "in_progress",
  "generated",
  "requires_review",
  "blocked",
  "completed",
  "cancelled",
  "error",
];

const draftStatuses: LegalDraftStatus[] = [
  "created",
  "generating",
  "ready_for_edit",
  "editing",
  "quality_check_pending",
  "quality_check_failed",
  "quality_check_passed",
  "requires_review",
  "approved",
  "export_ready",
  "exported",
  "failed",
  "archived",
];

const historicalStatuses: string[] = [...actionStatuses, ...draftStatuses];

const sectionStatuses: DraftSectionStatus[] = [
  "pending",
  "generating",
  "generated",
  "edited",
  "approved",
  "needs_data",
  "low_confidence",
  "failed",
];

const eligibilityStatuses: EligibilityStatus[] = [
  "available",
  "recommended",
  "not_recommended",
  "blocked",
  "requires_more_data",
  "requires_professional_review",
];

const reviewLevels: ProfessionalReviewLevel[] = [
  "none",
  "optional",
  "recommended",
  "mandatory",
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const text = asString(item);
    return text ? [text] : [];
  });
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  if (Array.isArray(value.actions)) {
    return value.actions;
  }

  if (Array.isArray(value.drafts)) {
    return value.drafts;
  }

  return [];
}

function normalizeActionType(value: unknown): LegalActionType {
  const actionType = asString(value);

  if (actionType && legalActionTypes.includes(actionType as LegalActionType)) {
    return actionType as LegalActionType;
  }

  if (actionType === "petition_right" || actionType === "derecho_peticion") {
    return "petition";
  }

  if (actionType === "claim") {
    return "administrative_claim";
  }

  if (actionType === "appeal") {
    return "administrative_appeal";
  }

  if (actionType === "lawsuit") {
    return "lawsuit_draft";
  }

  return "petition";
}

function normalizeActionStatus(value: unknown): LegalActionStatus {
  const status = asString(value);

  if (status && actionStatuses.includes(status as LegalActionStatus)) {
    return status as LegalActionStatus;
  }

  if (status === "draft_generated" || status === "ready") {
    return "generated";
  }

  if (status === "processing" || status === "started") {
    return "in_progress";
  }

  if (status === "failed") {
    return "error";
  }

  return "not_started";
}

function normalizeDraftStatus(value: unknown): LegalDraftStatus {
  const status = asString(value);

  if (status && draftStatuses.includes(status as LegalDraftStatus)) {
    return status as LegalDraftStatus;
  }

  if (status === "processing" || status === "queued" || status === "running") {
    return "generating";
  }

  if (status === "ready" || status === "completed") {
    return "ready_for_edit";
  }

  if (status === "quality_pending") {
    return "quality_check_pending";
  }

  if (status === "quality_failed") {
    return "quality_check_failed";
  }

  if (status === "quality_passed") {
    return "quality_check_passed";
  }

  return "created";
}

function normalizeSectionStatus(value: unknown): DraftSectionStatus {
  const status = asString(value);

  if (status && sectionStatuses.includes(status as DraftSectionStatus)) {
    return status as DraftSectionStatus;
  }

  if (status === "ready") {
    return "generated";
  }

  if (status === "requires_data") {
    return "needs_data";
  }

  return "pending";
}

function normalizeEligibilityStatus(value: unknown): EligibilityStatus {
  const status = asString(value);

  if (status && eligibilityStatuses.includes(status as EligibilityStatus)) {
    return status as EligibilityStatus;
  }

  if (status === "requires_data") {
    return "requires_more_data";
  }

  if (status === "requires_review") {
    return "requires_professional_review";
  }

  if (status === "unavailable") {
    return "blocked";
  }

  return "available";
}

function normalizeReviewLevel(value: unknown): ProfessionalReviewLevel {
  const level = asString(value);

  if (level && reviewLevels.includes(level as ProfessionalReviewLevel)) {
    return level as ProfessionalReviewLevel;
  }

  if (level === "required") {
    return "mandatory";
  }

  return "optional";
}

function normalizeSeverity(value: unknown): WarningSeverity {
  const severity = asString(value);

  if (severity === "info" || severity === "warning" || severity === "critical") {
    return severity;
  }

  if (severity === "error" || severity === "danger") {
    return "critical";
  }

  return "warning";
}

function normalizeWarning(raw: unknown, index = 0): Warning[] {
  if (typeof raw === "string" && raw.trim()) {
    return [
      {
        code: `warning_${index + 1}`,
        message: raw.trim(),
        severity: "warning",
      },
    ];
  }

  if (!isRecord(raw)) {
    return [];
  }

  const message =
    asString(raw.message) || asString(raw.label) || asString(raw.description);

  if (!message) {
    return [];
  }

  return [
    {
      code: asString(raw.code) || asString(raw.id) || `warning_${index + 1}`,
      message,
      severity: normalizeSeverity(raw.severity ?? raw.level),
    },
  ];
}

function normalizeWarnings(value: unknown): Warning[] {
  return Array.isArray(value)
    ? value.flatMap((item, index) => normalizeWarning(item, index))
    : normalizeWarning(value);
}

function normalizeMissingAttachment(raw: unknown, index = 0): MissingAttachment[] {
  if (typeof raw === "string" && raw.trim()) {
    return [
      {
        code: `attachment_${index + 1}`,
        label: raw.trim(),
        required: false,
      },
    ];
  }

  if (!isRecord(raw)) {
    return [];
  }

  const label =
    asString(raw.label) ||
    asString(raw.name) ||
    asString(raw.title) ||
    asString(raw.documentType) ||
    asString(raw.document_type);

  if (!label) {
    return [];
  }

  return [
    {
      code:
        asString(raw.code) ||
        asString(raw.id) ||
        asString(raw.documentTypeCode) ||
        asString(raw.document_type_code) ||
        `attachment_${index + 1}`,
      label,
      required: asBoolean(raw.required) ?? asBoolean(raw.isRequired) ?? false,
      description: asString(raw.description) || asString(raw.reason),
    },
  ];
}

function normalizeMissingAttachments(value: unknown): MissingAttachment[] {
  return Array.isArray(value)
    ? value.flatMap((item, index) => normalizeMissingAttachment(item, index))
    : normalizeMissingAttachment(value);
}

function normalizePendingMarker(raw: unknown, index = 0): PendingMarker[] {
  if (typeof raw === "string" && raw.trim()) {
    return [
      {
        code: `pending_${index + 1}`,
        label: raw.trim(),
        severity: "warning",
      },
    ];
  }

  if (!isRecord(raw)) {
    return [];
  }

  const label =
    asString(raw.label) || asString(raw.message) || asString(raw.description);

  if (!label) {
    return [];
  }

  return [
    {
      code: asString(raw.code) || asString(raw.id) || `pending_${index + 1}`,
      label,
      section_key: asString(raw.sectionKey) || asString(raw.section_key),
      severity: normalizeSeverity(raw.severity),
    },
  ];
}

function normalizePendingMarkers(value: unknown): PendingMarker[] {
  return Array.isArray(value)
    ? value.flatMap((item, index) => normalizePendingMarker(item, index))
    : normalizePendingMarker(value);
}

function normalizeSourceType(value: unknown): SourceReference["type"] {
  const type = asString(value);

  if (
    type === "report" ||
    type === "document" ||
    type === "inconsistency" ||
    type === "calculation" ||
    type === "legal_rule" ||
    type === "user_input"
  ) {
    return type;
  }

  if (type === "rule") {
    return "legal_rule";
  }

  return "report";
}

function normalizeSourceReference(raw: unknown, index = 0): SourceReference[] {
  if (!isRecord(raw)) {
    return [];
  }

  const label =
    asString(raw.label) || asString(raw.title) || asString(raw.name);

  if (!label) {
    return [];
  }

  return [
    {
      type: normalizeSourceType(raw.type ?? raw.sourceType ?? raw.source_type),
      id:
        asString(raw.id) ||
        asString(raw.sourceId) ||
        asString(raw.source_id) ||
        `source_${index + 1}`,
      label,
    },
  ];
}

function normalizeSourceReferences(value: unknown): SourceReference[] {
  return Array.isArray(value)
    ? value.flatMap((item, index) => normalizeSourceReference(item, index))
    : normalizeSourceReference(value);
}

function normalizeAvailableAction(raw: unknown): LegalActionAvailable[] {
  if (!isRecord(raw)) {
    return [];
  }

  const actionType = normalizeActionType(
    raw.action_type ?? raw.actionType ?? raw.type,
  );
  const eligibilityStatus = normalizeEligibilityStatus(
    raw.eligibility_status ?? raw.eligibilityStatus ?? raw.status,
  );
  const isRecommended =
    asBoolean(raw.isRecommended) ??
    asBoolean(raw.is_recommended) ??
    eligibilityStatus === "recommended";

  return [
    {
      action_type: actionType,
      title:
        asString(raw.title) ||
        asString(raw.label) ||
        legalActionTypeLabels[actionType],
      description:
        asString(raw.description) || legalActionTypeDescriptions[actionType],
      eligibility_status: isRecommended ? "recommended" : eligibilityStatus,
      eligibility_reason:
        asString(raw.eligibility_reason) ||
        asString(raw.eligibilityReason) ||
        asString(raw.reason),
      professional_review_level: normalizeReviewLevel(
        raw.professional_review_level ?? raw.professionalReviewLevel,
      ),
      warnings: normalizeWarnings(raw.warnings),
      missing_attachments: normalizeMissingAttachments(
        raw.missing_attachments ?? raw.missingAttachments,
      ),
      is_recommended: isRecommended,
    },
  ];
}

function defaultReadiness(caseId: string): LegalActionReadinessItem[] {
  return [
    {
      key: "payment",
      label: "Pago desbloqueado",
      completed: true,
      href: `/app/cases/${caseId}/payment`,
    },
    {
      key: "analysis",
      label: "Analisis completo",
      completed: true,
      href: `/app/cases/${caseId}/full-analysis`,
    },
    {
      key: "report",
      label: "Informe disponible",
      completed: true,
      href: `/app/cases/${caseId}/reports`,
    },
    {
      key: "route",
      label: "Ruta recomendada",
      completed: true,
      href: `/app/cases/${caseId}/result`,
    },
  ];
}

function normalizeReadiness(value: unknown, caseId: string): LegalActionReadinessItem[] {
  if (!Array.isArray(value)) {
    return defaultReadiness(caseId);
  }

  const items = value.flatMap((item, index) => {
    if (!isRecord(item)) {
      return [];
    }

    const label = asString(item.label) || asString(item.title);

    if (!label) {
      return [];
    }

    return [
      {
        key: asString(item.key) || asString(item.code) || `readiness_${index + 1}`,
        label,
        completed:
          asBoolean(item.completed) ??
          asBoolean(item.ready) ??
          asBoolean(item.isComplete) ??
          false,
        href: asString(item.href),
      },
    ];
  });

  return items.length ? items : defaultReadiness(caseId);
}

function normalizeAvailableResponse(
  raw: unknown,
  fallbackCaseId: string,
): AvailableLegalActionsResponse {
  const data = unwrapApiData(raw);
  const source = isRecord(data) ? data : {};
  const actionsSource =
    source.actions ??
    source.availableActions ??
    source.available_actions ??
    source.items ??
    (Array.isArray(data) ? data : []);
  const actions = Array.isArray(actionsSource)
    ? actionsSource.flatMap(normalizeAvailableAction)
    : [];
  const readiness = normalizeReadiness(source.readiness ?? source.checklist, fallbackCaseId);
  const recommendedActionType = normalizeActionType(
    source.recommendedActionType ??
      source.recommended_action_type ??
      actions.find((action) => action.is_recommended)?.action_type,
  );
  const hasRecommended = actions.some(
    (action) => action.action_type === recommendedActionType,
  );
  const ready =
    asBoolean(source.ready) ??
    asBoolean(source.isReady) ??
    asBoolean(source.is_ready) ??
    readiness.every((item) => item.completed);

  return {
    case_id:
      asString(source.caseId) || asString(source.case_id) || fallbackCaseId,
    case_number: asString(source.caseNumber) || asString(source.case_number),
    holder_name: asString(source.holderName) || asString(source.holder_name),
    analysis_status:
      asString(source.analysisStatus) || asString(source.analysis_status),
    viability:
      source.viability === "green" ||
      source.viability === "yellow" ||
      source.viability === "red" ||
      source.viability === "gray"
        ? source.viability
        : undefined,
    recommended_route:
      asString(source.recommendedRoute) || asString(source.recommended_route),
    ready,
    readiness,
    recommended_action_type: hasRecommended ? recommendedActionType : undefined,
    actions,
    missing_attachments: normalizeMissingAttachments(
      source.missingAttachments ?? source.missing_attachments,
    ),
    warnings: normalizeWarnings(source.warnings),
    updated_at: asString(source.updatedAt) || asString(source.updated_at),
  };
}

function normalizeDraftExport(raw: unknown, index = 0): DraftExport[] {
  if (!isRecord(raw)) {
    return [];
  }

  const format = asString(raw.format);
  const status = asString(raw.status);

  return [
    {
      id: asString(raw.id) || asString(raw.export_id) || `export_${index + 1}`,
      format: format === "docx" ? "docx" : "pdf",
      file_name:
        asString(raw.file_name) ||
        asString(raw.fileName) ||
        `documento.${format === "docx" ? "docx" : "pdf"}`,
      status:
        status === "ready" || status === "failed" || status === "processing"
          ? status
          : "queued",
      download_url: asString(raw.download_url) || asString(raw.downloadUrl),
      created_at:
        asString(raw.created_at) ||
        asString(raw.createdAt) ||
        new Date().toISOString(),
    },
  ];
}

function normalizeDraftExports(value: unknown): DraftExport[] {
  return Array.isArray(value)
    ? value.flatMap((item, index) => normalizeDraftExport(item, index))
    : normalizeDraftExport(value);
}

function normalizeDraftAttachment(raw: unknown, index = 0): DraftAttachment[] {
  if (!isRecord(raw)) {
    return [];
  }

  const label =
    asString(raw.label) ||
    asString(raw.name) ||
    asString(raw.title) ||
    asString(raw.originalFilename) ||
    asString(raw.original_filename);

  if (!label) {
    return [];
  }

  const status = asString(raw.status);

  return [
    {
      id: asString(raw.id) || asString(raw.document_id) || `attachment_${index + 1}`,
      label,
      type:
        asString(raw.type) ||
        asString(raw.documentType) ||
        asString(raw.document_type),
      status:
        status === "missing" ||
        status === "processing" ||
        status === "failed" ||
        status === "available"
          ? status
          : "available",
      required: asBoolean(raw.required) ?? asBoolean(raw.isRequired) ?? false,
      suggested:
        asBoolean(raw.suggested) ??
        asBoolean(raw.isSuggested) ??
        asBoolean(raw.is_suggested) ??
        true,
    },
  ];
}

function normalizeDraftAttachments(value: unknown): DraftAttachment[] {
  return Array.isArray(value)
    ? value.flatMap((item, index) => normalizeDraftAttachment(item, index))
    : normalizeDraftAttachment(value);
}

function normalizeDraftSection(raw: unknown, index = 0): DraftSection[] {
  if (!isRecord(raw)) {
    return [];
  }

  const sectionKey =
    asString(raw.section_key) ||
    asString(raw.sectionKey) ||
    asString(raw.key) ||
    asString(raw.slug) ||
    `section_${index + 1}`;

  return [
    {
      id: asString(raw.id) || sectionKey,
      section_key: sectionKey,
      title: asString(raw.title) || `Seccion ${index + 1}`,
      order_index:
        asNumber(raw.order_index) || asNumber(raw.orderIndex) || index + 1,
      content_html:
        asString(raw.content_html) ||
        asString(raw.contentHtml) ||
        asString(raw.html) ||
        asString(raw.content) ||
        "",
      status: normalizeSectionStatus(raw.status),
      pending_markers: normalizePendingMarkers(
        raw.pending_markers ?? raw.pendingMarkers,
      ),
      confidence_score:
        asNumber(raw.confidence_score) || asNumber(raw.confidenceScore),
      source_references: normalizeSourceReferences(
        raw.source_references ?? raw.sourceReferences ?? raw.sources,
      ),
    },
  ];
}

function normalizeDraftSections(value: unknown, rawDraft: RawRecord): DraftSection[] {
  const sections = Array.isArray(value)
    ? value.flatMap((item, index) => normalizeDraftSection(item, index))
    : [];

  if (sections.length) {
    return sections.sort((a, b) => a.order_index - b.order_index);
  }

  const content =
    asString(rawDraft.content_html) ||
    asString(rawDraft.contentHtml) ||
    asString(rawDraft.html) ||
    asString(rawDraft.content);

  if (!content) {
    return [];
  }

  return [
    {
      id: "main",
      section_key: "main",
      title: "Borrador",
      order_index: 1,
      content_html: content,
      status: "generated",
      pending_markers: [],
      source_references: [],
    },
  ];
}

function normalizeQualityStatus(value: unknown): QualityOverallStatus {
  const status = asString(value);

  if (
    status === "passed" ||
    status === "passed_with_warnings" ||
    status === "failed" ||
    status === "requires_review"
  ) {
    return status;
  }

  if (status === "ready") {
    return "passed";
  }

  if (status === "warning") {
    return "passed_with_warnings";
  }

  return "requires_review";
}

function normalizeQualityCheckStatus(value: unknown): QualityCheckStatus {
  const status = asString(value);

  if (
    status === "passed" ||
    status === "warning" ||
    status === "failed" ||
    status === "pending"
  ) {
    return status;
  }

  if (status === "ok") {
    return "passed";
  }

  return "pending";
}

function normalizeQualityCheck(raw: unknown, index = 0): QualityCheckItem[] {
  if (!isRecord(raw)) {
    return [];
  }

  const label = asString(raw.label) || asString(raw.title) || asString(raw.name);

  if (!label) {
    return [];
  }

  return [
    {
      id: asString(raw.id) || asString(raw.code) || `check_${index + 1}`,
      label,
      status: normalizeQualityCheckStatus(raw.status ?? raw.result),
      message: asString(raw.message) || asString(raw.description),
      severity: raw.severity ? normalizeSeverity(raw.severity) : undefined,
    },
  ];
}

function normalizeQuality(raw: unknown): DraftQuality | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  return {
    overall_status: normalizeQualityStatus(
      raw.overall_status ?? raw.overallStatus ?? raw.status,
    ),
    score: asNumber(raw.score) ?? asNumber(raw.quality_score),
    checks: Array.isArray(raw.checks)
      ? raw.checks.flatMap((item, index) => normalizeQualityCheck(item, index))
      : [],
    critical_warnings: normalizeWarnings(
      raw.critical_warnings ?? raw.criticalWarnings,
    ),
    recommendations: asStringArray(raw.recommendations),
    can_export:
      asBoolean(raw.can_export) ?? asBoolean(raw.canExport) ?? true,
    updated_at: asString(raw.updated_at) || asString(raw.updatedAt),
  };
}

function normalizeLegalDraft(raw: unknown, fallbackDraftId: string): LegalDraft {
  const data = unwrapApiData(raw);
  const draft = isRecord(data) && isRecord(data.draft) ? data.draft : data;

  if (!isRecord(draft)) {
    throw new ApiError({
      message: "La respuesta del borrador no tiene el formato esperado.",
      status: 500,
      code: "INVALID_DRAFT_RESPONSE",
    });
  }

  const status = normalizeDraftStatus(draft.status);
  const quality = normalizeQuality(
    draft.quality ?? draft.quality_check ?? draft.qualityCheck,
  );
  const qualityScore =
    asNumber(draft.quality_score) ||
    asNumber(draft.qualityScore) ||
    quality?.score;

  return {
    id: asString(draft.id) || asString(draft.draft_id) || fallbackDraftId,
    case_id: asString(draft.case_id) || asString(draft.caseId) || "",
    legal_action_id:
      asString(draft.legal_action_id) || asString(draft.legalActionId) || "",
    title: asString(draft.title) || asString(draft.name) || "Borrador",
    status,
    professional_review_level: normalizeReviewLevel(
      draft.professional_review_level ?? draft.professionalReviewLevel,
    ),
    quality_score: qualityScore,
    document_metadata: isRecord(draft.document_metadata)
      ? draft.document_metadata
      : isRecord(draft.documentMetadata)
        ? draft.documentMetadata
        : {},
    sections: normalizeDraftSections(draft.sections, draft),
    warnings: normalizeWarnings(draft.warnings),
    exports: normalizeDraftExports(draft.exports ?? draft.availableExports),
    quality,
    attachments: normalizeDraftAttachments(draft.attachments ?? draft.documents),
    missing_attachments: normalizeMissingAttachments(
      draft.missing_attachments ?? draft.missingAttachments,
    ),
    pending_markers: normalizePendingMarkers(
      draft.pending_markers ?? draft.pendingMarkers ?? draft.pending_data,
    ),
    can_export_pdf:
      asBoolean(draft.can_export_pdf) ?? asBoolean(draft.canExportPdf) ?? true,
    can_export_docx:
      asBoolean(draft.can_export_docx) ?? asBoolean(draft.canExportDocx) ?? true,
    created_at: asString(draft.created_at) || asString(draft.createdAt),
    updated_at: asString(draft.updated_at) || asString(draft.updatedAt),
  };
}

function normalizeSuggestedFact(raw: unknown, index = 0): SuggestedFact[] {
  if (!isRecord(raw)) {
    return [];
  }

  const text = asString(raw.text) || asString(raw.label) || asString(raw.content);

  if (!text) {
    return [];
  }

  return [
    {
      id: asString(raw.id) || `fact_${index + 1}`,
      text,
      source: normalizeSourceType(raw.source ?? raw.type),
      source_label:
        asString(raw.source_label) ||
        asString(raw.sourceLabel) ||
        asString(raw.origin),
      confidence_score:
        asNumber(raw.confidence_score) || asNumber(raw.confidenceScore),
      selected: asBoolean(raw.selected) ?? true,
    },
  ];
}

function normalizeSuggestedFacts(value: unknown): SuggestedFact[] {
  return Array.isArray(value)
    ? value.flatMap((item, index) => normalizeSuggestedFact(item, index))
    : [];
}

function normalizeSuggestedRequest(raw: unknown, index = 0): SuggestedRequest[] {
  if (typeof raw === "string" && raw.trim()) {
    return [
      {
        id: `request_${index + 1}`,
        text: raw.trim(),
        selected: true,
        kind: "request",
      },
    ];
  }

  if (!isRecord(raw)) {
    return [];
  }

  const text = asString(raw.text) || asString(raw.label) || asString(raw.content);

  if (!text) {
    return [];
  }

  const kind = asString(raw.kind);

  return [
    {
      id: asString(raw.id) || `request_${index + 1}`,
      text,
      selected: asBoolean(raw.selected) ?? true,
      kind:
        kind === "main_claim" || kind === "subsidiary_claim"
          ? kind
          : "request",
    },
  ];
}

function normalizeSuggestedRequests(value: unknown): SuggestedRequest[] {
  return Array.isArray(value)
    ? value.flatMap((item, index) => normalizeSuggestedRequest(item, index))
    : normalizeSuggestedRequest(value);
}

function normalizeDraftSummary(raw: unknown, index = 0): LegalDraftSummary[] {
  if (!isRecord(raw)) {
    return [];
  }

  const id = asString(raw.id) || asString(raw.draft_id);

  if (!id) {
    return [];
  }

  return [
    {
      id,
      title: asString(raw.title) || asString(raw.name) || `Borrador ${index + 1}`,
      status: normalizeDraftStatus(raw.status),
      quality_score: asNumber(raw.quality_score) || asNumber(raw.qualityScore),
      created_at: asString(raw.created_at) || asString(raw.createdAt),
      updated_at: asString(raw.updated_at) || asString(raw.updatedAt),
    },
  ];
}

function normalizeHistoryItem(raw: unknown, index = 0): LegalActionHistoryItem[] {
  if (!isRecord(raw)) {
    return [];
  }

  const title = asString(raw.title) || asString(raw.event);

  if (!title) {
    return [];
  }

  const status = asString(raw.status);

  return [
    {
      id: asString(raw.id) || `history_${index + 1}`,
      title,
      description: asString(raw.description) || asString(raw.detail),
      occurred_at:
        asString(raw.occurred_at) ||
        asString(raw.occurredAt) ||
        asString(raw.created_at) ||
        asString(raw.createdAt) ||
        new Date().toISOString(),
      status:
        status && historicalStatuses.includes(status)
          ? (status as LegalActionStatus | LegalDraftStatus)
          : undefined,
    },
  ];
}

function normalizeLegalActionDetail(
  raw: unknown,
  fallbackActionId: string,
): LegalActionDetail {
  const data = unwrapApiData(raw);
  const action = isRecord(data) && isRecord(data.action) ? data.action : data;

  if (!isRecord(action)) {
    throw new ApiError({
      message: "La respuesta de la accion juridica no tiene el formato esperado.",
      status: 500,
      code: "INVALID_LEGAL_ACTION_RESPONSE",
    });
  }

  const actionType = normalizeActionType(
    action.action_type ?? action.actionType ?? action.type,
  );

  return {
    id:
      asString(action.id) ||
      asString(action.legal_action_id) ||
      asString(action.legalActionId) ||
      fallbackActionId,
    case_id: asString(action.case_id) || asString(action.caseId) || "",
    action_type: actionType,
    title: asString(action.title) || legalActionTypeLabels[actionType],
    status: normalizeActionStatus(action.status),
    eligibility_status: normalizeEligibilityStatus(
      action.eligibility_status ?? action.eligibilityStatus,
    ),
    eligibility_reason:
      asString(action.eligibility_reason) ||
      asString(action.eligibilityReason) ||
      asString(action.reason),
    professional_review_level: normalizeReviewLevel(
      action.professional_review_level ?? action.professionalReviewLevel,
    ),
    warnings: normalizeWarnings(action.warnings),
    missing_attachments: normalizeMissingAttachments(
      action.missing_attachments ?? action.missingAttachments,
    ),
    pending_data: normalizePendingMarkers(
      action.pending_data ?? action.pendingData ?? action.pending_markers,
    ),
    drafts: Array.isArray(action.drafts)
      ? action.drafts.flatMap((item, index) => normalizeDraftSummary(item, index))
      : [],
    history: Array.isArray(action.history)
      ? action.history.flatMap((item, index) => normalizeHistoryItem(item, index))
      : [],
    suggested_facts: normalizeSuggestedFacts(
      action.suggested_facts ?? action.suggestedFacts ?? action.facts,
    ),
    suggested_requests: normalizeSuggestedRequests(
      action.suggested_requests ??
        action.suggestedRequests ??
        action.requests ??
        action.claims,
    ),
    attachments: normalizeDraftAttachments(action.attachments ?? action.documents),
    created_at: asString(action.created_at) || asString(action.createdAt),
    updated_at: asString(action.updated_at) || asString(action.updatedAt),
  };
}

function normalizeCreateLegalActionResponse(
  raw: unknown,
  fallbackCaseId: string,
): CreateLegalActionResponse {
  const data = unwrapApiData(raw);
  const source = isRecord(data) && isRecord(data.action) ? data.action : data;

  if (!isRecord(source)) {
    return {
      action_id: "",
      case_id: fallbackCaseId,
      status: "in_progress",
    };
  }

  return {
    action_id:
      asString(source.action_id) ||
      asString(source.actionId) ||
      asString(source.id) ||
      "",
    case_id: asString(source.case_id) || asString(source.caseId) || fallbackCaseId,
    status: normalizeActionStatus(source.status),
    draft_id: asString(source.draft_id) || asString(source.draftId),
  };
}

function normalizeCreateDraftResponse(
  raw: unknown,
  fallbackActionId: string,
): CreateDraftResponse {
  const data = unwrapApiData(raw);
  const source = isRecord(data) && isRecord(data.draft) ? data.draft : data;

  if (!isRecord(source)) {
    return {
      draft_id: "",
      action_id: fallbackActionId,
      status: "generating",
    };
  }

  return {
    draft_id:
      asString(source.draft_id) ||
      asString(source.draftId) ||
      asString(source.id) ||
      "",
    action_id:
      asString(source.action_id) ||
      asString(source.actionId) ||
      asString(source.legal_action_id) ||
      fallbackActionId,
    status: normalizeDraftStatus(source.status),
  };
}

function normalizeAdminDraft(raw: unknown, index = 0): AdminLegalDraftSummary[] {
  if (!isRecord(raw)) {
    return [];
  }

  const id = asString(raw.id) || asString(raw.draft_id);

  if (!id) {
    return [];
  }

  const actionType = normalizeActionType(raw.action_type ?? raw.actionType);
  const reviewLevel = normalizeReviewLevel(
    raw.professional_review_level ?? raw.professionalReviewLevel,
  );

  return [
    {
      id,
      case_id: asString(raw.case_id) || asString(raw.caseId) || "",
      case_number:
        asString(raw.case_number) ||
        asString(raw.caseNumber) ||
        `Caso ${index + 1}`,
      user_name:
        asString(raw.user_name) ||
        asString(raw.userName) ||
        asString(raw.holder_name) ||
        "Usuario",
      title: asString(raw.title) || legalActionTypeLabels[actionType],
      action_type: actionType,
      status: normalizeDraftStatus(raw.status),
      quality_score: asNumber(raw.quality_score) || asNumber(raw.qualityScore),
      professional_review_level: reviewLevel,
      review_required:
        asBoolean(raw.review_required) ??
        asBoolean(raw.reviewRequired) ??
        reviewLevel === "mandatory",
      updated_at:
        asString(raw.updated_at) ||
        asString(raw.updatedAt) ||
        new Date().toISOString(),
    },
  ];
}

function normalizeAdminDraftsResponse(raw: unknown): AdminLegalDraftsResponse {
  const data = unwrapList(unwrapApiData(raw) as ListEnvelope<unknown>);
  const items = getItems(data).flatMap((item, index) => normalizeAdminDraft(item, index));

  return {
    items,
    total: Array.isArray(data) ? items.length : asNumber(data.total) || items.length,
  };
}

export function getLegalActionsErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      LEGAL_ACTION_CASE_NOT_READY:
        "Tu expediente aun no esta listo para generar escritos.",
      LEGAL_ACTION_ACCESS_DENIED: "No tienes permiso para ver este recurso.",
      LEGAL_ACTION_NOT_ALLOWED:
        "Esta accion no esta disponible para la ruta recomendada de tu caso.",
      LEGAL_ACTION_NOT_FOUND: "No encontramos esta accion juridica.",
      LEGAL_DRAFT_NOT_FOUND: "No encontramos este borrador.",
      LEGAL_DRAFT_GENERATION_FAILED:
        "No pudimos generar el borrador en este momento.",
      LEGAL_DRAFT_EXPORT_FAILED:
        "No pudimos generar el archivo. Intenta de nuevo.",
      LEGAL_DRAFT_QUALITY_FAILED:
        "El control de calidad encontro errores que debes revisar.",
    };

    if (error.status === 401) {
      return "Tu sesion expiro. Inicia sesion para continuar.";
    }

    if (error.status === 403) {
      return "No tienes permiso para ver este recurso.";
    }

    if (error.status === 404) {
      return "No encontramos esta informacion o ya no esta disponible.";
    }

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intentalo nuevamente.";
}

export async function getAvailableLegalActions(
  caseId: string,
): Promise<AvailableLegalActionsResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/legal-actions/available`,
  );

  return normalizeAvailableResponse(response, caseId);
}

export async function createLegalAction(
  caseId: string,
  payload: CreateLegalActionRequest,
): Promise<CreateLegalActionResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/legal-actions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeCreateLegalActionResponse(response, caseId);
}

export async function getLegalAction(
  actionId: string,
): Promise<LegalActionDetail> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/legal-actions/${actionId}`,
  );

  return normalizeLegalActionDetail(response, actionId);
}

export async function createDraft(
  actionId: string,
  payload: CreateDraftRequest,
): Promise<CreateDraftResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/legal-actions/${actionId}/drafts`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeCreateDraftResponse(response, actionId);
}

export async function getDraft(draftId: string): Promise<LegalDraft> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/drafts/${draftId}`,
  );

  return normalizeLegalDraft(response, draftId);
}

export async function updateDraft(
  draftId: string,
  payload: UpdateDraftRequest,
): Promise<LegalDraft> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/drafts/${draftId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

  return normalizeLegalDraft(response, draftId);
}

export async function regenerateDraftSection(
  draftId: string,
  sectionId: string,
  payload: RegenerateSectionRequest,
): Promise<LegalDraft> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/drafts/${draftId}/sections/${sectionId}/regenerate`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeLegalDraft(response, draftId);
}

export async function runQualityCheck(draftId: string): Promise<LegalDraft> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/drafts/${draftId}/quality-check`,
    {
      method: "POST",
    },
  );

  return normalizeLegalDraft(response, draftId);
}

export async function exportDraft(
  draftId: string,
  payload: ExportDraftRequest,
): Promise<LegalDraft> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/drafts/${draftId}/export`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeLegalDraft(response, draftId);
}

export async function submitDraftForReview(
  draftId: string,
  payload: SubmitReviewRequest,
): Promise<LegalDraft> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/drafts/${draftId}/submit-review`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeLegalDraft(response, draftId);
}

export async function getAdminLegalDrafts(params: {
  status?: string;
  actionType?: string;
  query?: string;
} = {}): Promise<AdminLegalDraftsResponse> {
  const query = new URLSearchParams();

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  if (params.actionType && params.actionType !== "all") {
    query.set("actionType", params.actionType);
  }

  if (params.query?.trim()) {
    query.set("query", params.query.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiFetch<
    ListEnvelope<unknown> | ApiEnvelope<ListEnvelope<unknown>>
  >(`/admin/legal-drafts${suffix}`);

  return normalizeAdminDraftsResponse(response);
}

export async function getAdminLegalDraft(draftId: string): Promise<LegalDraft> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/admin/legal-drafts/${draftId}`,
  );

  return normalizeLegalDraft(response, draftId);
}

export async function submitAdminReviewDecision(
  draftId: string,
  payload: AdminReviewDecisionRequest,
): Promise<LegalDraft> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/admin/legal-drafts/${draftId}/review`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeLegalDraft(response, draftId || makeId("draft"));
}

import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  CaseResultResponse,
  EconomicEstimate,
  FinalViability,
  FinalViabilityLevel,
  MainInconsistency,
  MissingDocument,
  RecommendedRoute,
  ResultAction,
  ResultBlocker,
  ResultCard,
  ResultImpact,
  ResultInconsistency,
  ResultStatus,
  ResultTone,
  ResultWarning,
} from "@/src/modules/result/api/result.types";

type RawRecord = Record<string, unknown>;

const statuses: ResultStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
  "requires_review",
  "approved",
  "rejected",
  "error",
];

const viabilityLevels: FinalViabilityLevel[] = [
  "high",
  "medium",
  "low",
  "incomplete",
  "not_applicable",
];

const tones: ResultTone[] = ["success", "warning", "danger", "neutral", "info"];
const impacts: ResultImpact[] = ["high", "medium", "low", "none"];
const priorities: MissingDocument["priority"][] = ["high", "medium", "low"];
const warningSeverities: ResultWarning["severity"][] = ["info", "warning", "critical"];
const actionTypes: ResultAction["type"][] = [
  "generate_report",
  "generate_executive_summary",
  "generate_legal_action",
  "upload_missing_documents",
  "request_professional_review",
  "go_to_payment",
  "retry_analysis",
];
const routeTypes: RecommendedRoute["routeType"][] = [
  "no_action",
  "collect_more_documents",
  "administrative_claim",
  "reliquidation_request",
  "petition_right",
  "legal_claim_draft",
  "professional_review",
  "low_viability",
  "incomplete_case",
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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const text = asString(item);
    return text ? [text] : [];
  });
}

function normalizeStatus(value: unknown): ResultStatus {
  const status = asString(value);

  if (status && statuses.includes(status as ResultStatus)) {
    return status as ResultStatus;
  }

  if (status === "pending" || status === "processing" || status === "running") {
    return "in_progress";
  }

  if (status === "done" || status === "ready") {
    return "completed";
  }

  if (status === "failed" || status === "cancelled") {
    return "error";
  }

  return "not_started";
}

function normalizeViabilityLevel(value: unknown): FinalViabilityLevel {
  const level = asString(value);

  if (level && viabilityLevels.includes(level as FinalViabilityLevel)) {
    return level as FinalViabilityLevel;
  }

  if (level === "insufficient_information") {
    return "incomplete";
  }

  return "incomplete";
}

function colorFromLevel(level: FinalViabilityLevel): FinalViability["color"] {
  if (level === "high") {
    return "green";
  }

  if (level === "medium") {
    return "yellow";
  }

  if (level === "low") {
    return "orange";
  }

  return "gray";
}

function normalizeColor(value: unknown, level: FinalViabilityLevel): FinalViability["color"] {
  const color = asString(value);

  if (
    color === "green" ||
    color === "yellow" ||
    color === "orange" ||
    color === "red" ||
    color === "gray"
  ) {
    return color;
  }

  return colorFromLevel(level);
}

function normalizeTone(value: unknown): ResultTone {
  const tone = asString(value);
  return tone && tones.includes(tone as ResultTone) ? (tone as ResultTone) : "neutral";
}

function normalizeImpact(value: unknown): ResultImpact {
  const impact = asString(value);
  return impact && impacts.includes(impact as ResultImpact)
    ? (impact as ResultImpact)
    : "none";
}

function normalizePriority(value: unknown): MissingDocument["priority"] {
  const priority = asString(value);
  return priority && priorities.includes(priority as MissingDocument["priority"])
    ? (priority as MissingDocument["priority"])
    : "medium";
}

function normalizeWarningSeverity(value: unknown): ResultWarning["severity"] {
  const severity = asString(value);
  return severity && warningSeverities.includes(severity as ResultWarning["severity"])
    ? (severity as ResultWarning["severity"])
    : "warning";
}

function normalizeFinalViability(value: unknown): FinalViability | null {
  if (!isRecord(value)) {
    return null;
  }

  const level = normalizeViabilityLevel(value.level);
  const label = asString(value.label) || {
    high: "Viabilidad alta",
    medium: "Viabilidad media",
    low: "Viabilidad baja",
    incomplete: "Informacion incompleta",
    not_applicable: "No aplica",
  }[level];

  return {
    level,
    label,
    score: asNumber(value.score) ?? null,
    color: normalizeColor(value.color, level),
    rationale:
      asString(value.rationale) ||
      asString(value.description) ||
      "El backend no envio una explicacion detallada.",
    strengths: normalizeStringArray(value.strengths),
    weaknesses: normalizeStringArray(value.weaknesses),
    missingInformation: normalizeStringArray(
      value.missingInformation ?? value.missing_information,
    ),
  };
}

function normalizeEconomicEstimate(value: unknown): EconomicEstimate | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    currency: "COP",
    hasEconomicEstimate:
      asBoolean(value.hasEconomicEstimate) ??
      asBoolean(value.has_economic_estimate) ??
      Boolean(
        value.estimatedClaimableAmount ||
          value.estimated_claimable_amount ||
          value.estimatedRetroactiveAmount ||
          value.estimated_retroactive_amount,
      ),
    estimatedClaimableAmount:
      asNumber(value.estimatedClaimableAmount ?? value.estimated_claimable_amount) ??
      null,
    estimatedRetroactiveAmount:
      asNumber(value.estimatedRetroactiveAmount ?? value.estimated_retroactive_amount) ??
      null,
    estimatedMonthlyDifference:
      asNumber(value.estimatedMonthlyDifference ?? value.estimated_monthly_difference) ??
      null,
    minAmount: asNumber(value.minAmount ?? value.min_amount) ?? null,
    maxAmount: asNumber(value.maxAmount ?? value.max_amount) ?? null,
    warnings: normalizeStringArray(value.warnings),
    assumptions: normalizeStringArray(value.assumptions),
  };
}

function normalizeMainInconsistency(value: unknown): MainInconsistency | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = asString(value.title) || asString(value.name);
  const description = asString(value.description) || asString(value.summary);

  if (!title || !description) {
    return null;
  }

  const impact = normalizeImpact(value.impact);

  return {
    title,
    description,
    impact: impact === "none" ? undefined : impact,
    confidenceScore:
      asNumber(value.confidenceScore ?? value.confidence_score ?? value.confidence) ??
      null,
  };
}

function normalizeCard(raw: unknown): ResultCard[] {
  if (!isRecord(raw)) {
    return [];
  }

  const title = asString(raw.title) || asString(raw.label);

  if (!title) {
    return [];
  }

  const key = asString(raw.key) || asString(raw.id) || title;
  const value = raw.value === null || raw.value === undefined
    ? null
    : String(raw.value);

  return [
    {
      key,
      title,
      value,
      description: asString(raw.description) || null,
      icon: asString(raw.icon) || null,
      tone: normalizeTone(raw.tone),
      metadata: isRecord(raw.metadata) ? raw.metadata : undefined,
    },
  ];
}

function normalizeCards(value: unknown): ResultCard[] {
  return Array.isArray(value) ? value.flatMap(normalizeCard) : [];
}

function normalizeMissingDocument(raw: unknown): MissingDocument[] {
  if (typeof raw === "string" && raw.trim()) {
    return [
      {
        name: raw.trim(),
        required: true,
        priority: "medium",
      },
    ];
  }

  if (!isRecord(raw)) {
    return [];
  }

  const name = asString(raw.name) || asString(raw.title) || asString(raw.documentType);

  if (!name) {
    return [];
  }

  return [
    {
      id: asString(raw.id),
      name,
      description: asString(raw.description) || asString(raw.reason),
      required:
        asBoolean(raw.required) ??
        asBoolean(raw.isRequired) ??
        asBoolean(raw.is_required) ??
        true,
      priority: normalizePriority(raw.priority),
      uploadUrl:
        asString(raw.uploadUrl) ||
        asString(raw.upload_url) ||
        asString(raw.href) ||
        null,
    },
  ];
}

function normalizeMissingDocuments(value: unknown): MissingDocument[] {
  return Array.isArray(value) ? value.flatMap(normalizeMissingDocument) : [];
}

function normalizeInconsistency(raw: unknown): ResultInconsistency[] {
  if (!isRecord(raw)) {
    return [];
  }

  const title = asString(raw.title) || asString(raw.name);
  const description = asString(raw.description) || asString(raw.summary);

  if (!title || !description) {
    return [];
  }

  return [
    {
      id: asString(raw.id) || title,
      inconsistencyType:
        asString(raw.inconsistencyType) ||
        asString(raw.inconsistency_type) ||
        asString(raw.type) ||
        "general",
      title,
      description,
      evidenceSummary:
        asString(raw.evidenceSummary) ||
        asString(raw.evidence_summary) ||
        asString(raw.evidence) ||
        null,
      legalImpact: normalizeImpact(raw.legalImpact ?? raw.legal_impact),
      economicImpact: normalizeImpact(raw.economicImpact ?? raw.economic_impact),
      estimatedAmount:
        asNumber(raw.estimatedAmount ?? raw.estimated_amount ?? raw.amount) ?? null,
      confidenceScore:
        asNumber(raw.confidenceScore ?? raw.confidence_score ?? raw.confidence) ??
        null,
      requiredDocuments: normalizeMissingDocuments(
        raw.requiredDocuments ??
          raw.required_documents ??
          raw.missingDocuments ??
          raw.missing_documents,
      ),
    },
  ];
}

function normalizeInconsistencies(value: unknown): ResultInconsistency[] {
  return Array.isArray(value) ? value.flatMap(normalizeInconsistency) : [];
}

function normalizeWarning(raw: unknown): ResultWarning[] {
  if (typeof raw === "string" && raw.trim()) {
    return [
      {
        code: "RESULT_WARNING",
        message: raw.trim(),
        severity: "warning",
      },
    ];
  }

  if (!isRecord(raw)) {
    return [];
  }

  const message = asString(raw.message) || asString(raw.detail);

  if (!message) {
    return [];
  }

  return [
    {
      code: asString(raw.code) || "RESULT_WARNING",
      message,
      severity: normalizeWarningSeverity(raw.severity),
    },
  ];
}

function normalizeWarnings(value: unknown): ResultWarning[] {
  return Array.isArray(value) ? value.flatMap(normalizeWarning) : [];
}

function normalizeBlocker(raw: unknown): ResultBlocker[] {
  if (typeof raw === "string" && raw.trim()) {
    return [
      {
        code: "RESULT_BLOCKER",
        message: raw.trim(),
      },
    ];
  }

  if (!isRecord(raw)) {
    return [];
  }

  const message = asString(raw.message) || asString(raw.detail);

  if (!message) {
    return [];
  }

  return [
    {
      code: asString(raw.code) || "RESULT_BLOCKER",
      message,
      actionLabel:
        asString(raw.actionLabel) || asString(raw.action_label) || null,
      actionUrl:
        asString(raw.actionUrl) ||
        asString(raw.action_url) ||
        asString(raw.href) ||
        null,
    },
  ];
}

function normalizeBlockers(value: unknown): ResultBlocker[] {
  return Array.isArray(value) ? value.flatMap(normalizeBlocker) : [];
}

function normalizeRouteType(value: unknown): RecommendedRoute["routeType"] {
  const routeType = asString(value);

  if (routeType && routeTypes.includes(routeType as RecommendedRoute["routeType"])) {
    return routeType as RecommendedRoute["routeType"];
  }

  if (routeType === "petition") {
    return "petition_right";
  }

  if (routeType === "lawsuit_draft") {
    return "legal_claim_draft";
  }

  if (routeType === "request_documents") {
    return "collect_more_documents";
  }

  return "professional_review";
}

function normalizeRecommendedRoute(value: unknown): RecommendedRoute | null {
  if (!isRecord(value)) {
    return null;
  }

  const routeType = normalizeRouteType(value.routeType ?? value.route_type);
  const title = asString(value.title);
  const description = asString(value.description) || asString(value.summary);

  if (!title || !description) {
    return null;
  }

  return {
    routeType,
    title,
    description,
    nextActionLabel:
      asString(value.nextActionLabel) || asString(value.next_action_label) || null,
    nextActionType:
      asString(value.nextActionType) || asString(value.next_action_type) || null,
    nextActionUrl:
      asString(value.nextActionUrl) || asString(value.next_action_url) || null,
    requiresDocuments:
      asBoolean(value.requiresDocuments) ??
      asBoolean(value.requires_documents) ??
      false,
    requiresProfessionalReview:
      asBoolean(value.requiresProfessionalReview) ??
      asBoolean(value.requires_professional_review) ??
      false,
    canGenerateLegalAction:
      asBoolean(value.canGenerateLegalAction) ??
      asBoolean(value.can_generate_legal_action) ??
      false,
    recommendedLegalActionType:
      asString(value.recommendedLegalActionType) ||
      asString(value.recommended_legal_action_type) ||
      null,
    rationale:
      asString(value.rationale) ||
      "El backend no envio una razon detallada para esta ruta.",
    blockers: normalizeBlockers(value.blockers),
    requiredDocuments: normalizeMissingDocuments(
      value.requiredDocuments ?? value.required_documents,
    ),
  };
}

function normalizeActionType(value: unknown): ResultAction["type"] | null {
  const type = asString(value);

  if (type && actionTypes.includes(type as ResultAction["type"])) {
    return type as ResultAction["type"];
  }

  return null;
}

function normalizeAction(raw: unknown): ResultAction[] {
  if (!isRecord(raw)) {
    return [];
  }

  const type = normalizeActionType(raw.type);
  const label = asString(raw.label) || asString(raw.title);

  if (!type || !label) {
    return [];
  }

  return [
    {
      type,
      label,
      enabled:
        asBoolean(raw.enabled) ??
        asBoolean(raw.isEnabled) ??
        asBoolean(raw.is_enabled) ??
        true,
      href:
        asString(raw.href) ||
        asString(raw.url) ||
        asString(raw.actionUrl) ||
        asString(raw.action_url) ||
        null,
      disabledReason:
        asString(raw.disabledReason) ||
        asString(raw.disabled_reason) ||
        null,
    },
  ];
}

function normalizeActions(value: unknown): ResultAction[] {
  return Array.isArray(value) ? value.flatMap(normalizeAction) : [];
}

function makeEmptyResult(caseId: string): CaseResultResponse {
  return {
    caseId,
    caseCode: caseId,
    resultId: null,
    version: null,
    status: "not_started",
    isVisibleToUser: false,
    generatedAt: null,
    headline: null,
    executiveSummary: null,
    userExplanation: null,
    legalDisclaimer: null,
    finalViability: null,
    economicEstimate: null,
    mainInconsistency: null,
    cards: [],
    inconsistencies: [],
    recommendedRoute: null,
    missingDocuments: [],
    warnings: [],
    blockers: [],
    availableActions: [],
  };
}

function makeBlockedResult(
  caseId: string,
  status: ResultStatus,
  blocker: ResultBlocker,
  action?: ResultAction,
): CaseResultResponse {
  return {
    ...makeEmptyResult(caseId),
    status,
    blockers: [blocker],
    availableActions: action ? [action] : [],
  };
}

export function normalizeCaseResult(
  raw: unknown,
  fallbackCaseId: string,
): CaseResultResponse {
  const data = unwrapApiData(raw);
  const result = isRecord(data) && isRecord(data.result)
    ? data.result
    : isRecord(data) && isRecord(data.caseResult)
      ? data.caseResult
      : isRecord(data) && isRecord(data.case_result)
        ? data.case_result
        : data;

  if (!isRecord(result)) {
    return makeEmptyResult(fallbackCaseId);
  }

  const status = normalizeStatus(result.status);

  return {
    caseId:
      asString(result.caseId) ||
      asString(result.case_id) ||
      fallbackCaseId,
    caseCode:
      asString(result.caseCode) ||
      asString(result.case_code) ||
      asString(result.caseNumber) ||
      asString(result.case_number) ||
      fallbackCaseId,
    resultId:
      asString(result.resultId) ||
      asString(result.result_id) ||
      asString(result.id) ||
      null,
    version: asNumber(result.version) ?? null,
    status,
    isVisibleToUser:
      asBoolean(result.isVisibleToUser) ??
      asBoolean(result.is_visible_to_user) ??
      (status === "completed" || status === "approved"),
    generatedAt:
      asString(result.generatedAt) ||
      asString(result.generated_at) ||
      asString(result.completedAt) ||
      asString(result.completed_at) ||
      null,
    headline: asString(result.headline) || asString(result.title) || null,
    executiveSummary:
      asString(result.executiveSummary) ||
      asString(result.executive_summary) ||
      asString(result.summary) ||
      null,
    userExplanation:
      asString(result.userExplanation) ||
      asString(result.user_explanation) ||
      null,
    legalDisclaimer:
      asString(result.legalDisclaimer) ||
      asString(result.legal_disclaimer) ||
      null,
    finalViability: normalizeFinalViability(
      result.finalViability ?? result.final_viability ?? result.viability,
    ),
    economicEstimate: normalizeEconomicEstimate(
      result.economicEstimate ?? result.economic_estimate,
    ),
    mainInconsistency: normalizeMainInconsistency(
      result.mainInconsistency ?? result.main_inconsistency,
    ),
    cards: normalizeCards(result.cards),
    inconsistencies: normalizeInconsistencies(result.inconsistencies),
    recommendedRoute: normalizeRecommendedRoute(
      result.recommendedRoute ?? result.recommended_route,
    ),
    missingDocuments: normalizeMissingDocuments(
      result.missingDocuments ?? result.missing_documents,
    ),
    warnings: normalizeWarnings(result.warnings),
    blockers: normalizeBlockers(result.blockers),
    availableActions: normalizeActions(
      result.availableActions ?? result.available_actions,
    ),
  };
}

export function mapResultError(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      PAYMENT_REQUIRED: "Para ver el resultado completo debes completar el pago.",
      ANALYSIS_NOT_COMPLETED:
        "El analisis completo aun esta en proceso. Te avisaremos cuando termine.",
      CASE_ACCESS_DENIED: "No tienes permiso para ver este expediente.",
      CASE_NOT_FOUND: "No encontramos este expediente o ya no esta disponible.",
      RESULT_NOT_FOUND: "Aun no hay resultado completo disponible.",
      RESULT_NOT_VISIBLE: "Este resultado aun no esta visible para el usuario.",
    };

    if (error.status === 401) {
      return "Tu sesion expiro. Inicia sesion para continuar.";
    }

    if (error.status === 403) {
      return "No tienes permiso para ver este expediente.";
    }

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos cargar el resultado completo. Intenta nuevamente.";
}

export async function getCaseResult(caseId: string): Promise<CaseResultResponse> {
  try {
    const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
      `/cases/${caseId}/result`,
    );

    return normalizeCaseResult(response, caseId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return makeEmptyResult(caseId);
    }

    if (error instanceof ApiError && (error.status === 402 || error.code === "PAYMENT_REQUIRED")) {
      return makeBlockedResult(
        caseId,
        "blocked",
        {
          code: "PAYMENT_REQUIRED",
          message: "Para ver el resultado completo debes completar el pago.",
          actionLabel: "Ir al pago",
          actionUrl: `/app/cases/${caseId}/checkout`,
        },
        {
          type: "go_to_payment",
          label: "Ir al pago",
          enabled: true,
          href: `/app/cases/${caseId}/checkout`,
        },
      );
    }

    if (error instanceof ApiError && error.code === "ANALYSIS_NOT_COMPLETED") {
      return makeBlockedResult(caseId, "in_progress", {
        code: "ANALYSIS_NOT_COMPLETED",
        message: "El analisis completo aun esta en proceso.",
        actionLabel: "Ver analisis completo",
        actionUrl: `/app/cases/${caseId}/full-analysis`,
      });
    }

    throw error;
  }
}

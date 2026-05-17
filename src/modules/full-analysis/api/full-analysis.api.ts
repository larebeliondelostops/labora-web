import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  AnalysisInconsistency,
  AnalysisStep,
  CalculationResult,
  CalculationUnit,
  CalculationsQuery,
  ConfidenceBreakdownItem,
  ConfidenceLevel,
  ConfidenceResponse,
  ExecutiveResult,
  FullAnalysis,
  FullAnalysisBlockedReason,
  FullAnalysisProgress,
  FullAnalysisReadinessItem,
  FullAnalysisReviewGuidance,
  FullAnalysisStartResponse,
  FullAnalysisStatus,
  FullAnalysisWarning,
  InconsistencySeverity,
  LegalRuleResult,
  Paginated,
  RecommendedRoute,
  ResultStatus,
  RetryFullAnalysisPayload,
  RuleResult,
  RulesQuery,
  Scenario,
  ScenarioType,
  SourceRef,
  SourceRefType,
  StartFullAnalysisPayload,
  StepStatus,
  ViabilityLevel,
} from "@/src/modules/full-analysis/api/full-analysis.types";

type RawRecord = Record<string, unknown>;

const statuses: FullAnalysisStatus[] = [
  "not_started",
  "queued",
  "in_progress",
  "rules_running",
  "calculations_running",
  "scenario_comparison_running",
  "confidence_evaluation_running",
  "requires_review",
  "completed",
  "blocked",
  "failed",
  "cancelled",
];

const stepStatuses: StepStatus[] = [
  "pending",
  "active",
  "completed",
  "warning",
  "error",
  "blocked",
];

const resultStatuses: ResultStatus[] = [
  "well_liquidated",
  "possible_error",
  "relevant_error",
  "insufficient_information",
];

const viabilityLevels: ViabilityLevel[] = [
  "high",
  "medium",
  "low",
  "insufficient_information",
];

const recommendedRoutes: RecommendedRoute[] = [
  "no_action",
  "request_documents",
  "administrative_claim",
  "reliquidation_request",
  "petition",
  "lawsuit_draft",
  "professional_review",
];

const confidenceLevels: ConfidenceLevel[] = ["high", "medium", "low", "critical"];
const ruleResults: RuleResult[] = [
  "passed",
  "failed",
  "not_applicable",
  "warning",
  "inconclusive",
];
const calculationUnits: CalculationUnit[] = [
  "COP",
  "weeks",
  "days",
  "months",
  "percentage",
];
const scenarioTypes: ScenarioType[] = [
  "recognized_by_entity",
  "calculated_correct",
  "alternative",
  "missing_documents",
  "user_claimed",
];
const severities: InconsistencySeverity[] = ["low", "medium", "high", "critical"];
const sourceRefTypes: SourceRefType[] = [
  "document",
  "extracted_fact",
  "legal_rule",
  "calculation",
  "questionnaire_answer",
];
const blockedReasons: FullAnalysisBlockedReason[] = [
  "payment_required",
  "payment_pending",
  "missing_documents",
  "validation_incomplete",
  "consent_required",
  "case_not_ready",
  "unknown",
];

const defaultSteps: AnalysisStep[] = [
  { key: "preparing", label: "Preparando datos", status: "pending" },
  { key: "rules", label: "Reglas juridicas", status: "pending" },
  { key: "calculations", label: "Calculos", status: "pending" },
  { key: "scenarios", label: "Comparador de escenarios", status: "pending" },
  { key: "confidence", label: "Evaluacion de confianza", status: "pending" },
  { key: "summary", label: "Resumen final", status: "pending" },
];

const defaultReadiness: FullAnalysisReadinessItem[] = [
  { key: "payment", label: "Pago aprobado", ready: true },
  { key: "documents", label: "Documentos procesados", ready: true },
  { key: "data", label: "Datos validados", ready: true },
  { key: "preanalysis", label: "Preanalisis disponible", ready: true },
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

function normalizePercent(value: unknown): number {
  const numberValue = asNumber(value);

  if (numberValue === undefined) {
    return 0;
  }

  const normalized = numberValue > 0 && numberValue <= 1 ? numberValue * 100 : numberValue;
  return Math.max(0, Math.min(100, normalized));
}

function normalizeStatus(value: unknown): FullAnalysisStatus {
  const status = asString(value);

  if (status && statuses.includes(status as FullAnalysisStatus)) {
    return status as FullAnalysisStatus;
  }

  if (status === "processing" || status === "running") {
    return "in_progress";
  }

  if (status === "ready" || status === "done") {
    return "completed";
  }

  if (status === "error") {
    return "failed";
  }

  return "not_started";
}

function normalizeStepStatus(value: unknown): StepStatus {
  const status = asString(value);
  return status && stepStatuses.includes(status as StepStatus)
    ? (status as StepStatus)
    : "pending";
}

function normalizeResultStatus(value: unknown): ResultStatus {
  const status = asString(value);
  return status && resultStatuses.includes(status as ResultStatus)
    ? (status as ResultStatus)
    : "insufficient_information";
}

function normalizeViability(value: unknown): ViabilityLevel {
  const level = asString(value);
  return level && viabilityLevels.includes(level as ViabilityLevel)
    ? (level as ViabilityLevel)
    : "insufficient_information";
}

function normalizeRecommendedRoute(value: unknown): RecommendedRoute {
  const route = asString(value);
  return route && recommendedRoutes.includes(route as RecommendedRoute)
    ? (route as RecommendedRoute)
    : "professional_review";
}

function normalizeConfidenceLevel(value: unknown, score?: number): ConfidenceLevel {
  const level = asString(value);

  if (level && confidenceLevels.includes(level as ConfidenceLevel)) {
    return level as ConfidenceLevel;
  }

  if (score !== undefined) {
    if (score >= 80) {
      return "high";
    }

    if (score >= 60) {
      return "medium";
    }

    if (score >= 35) {
      return "low";
    }
  }

  return "critical";
}

function normalizeRuleResult(value: unknown): RuleResult {
  const result = asString(value);
  return result && ruleResults.includes(result as RuleResult)
    ? (result as RuleResult)
    : "inconclusive";
}

function normalizeCalculationUnit(value: unknown): CalculationUnit | undefined {
  const unit = asString(value);
  return unit && calculationUnits.includes(unit as CalculationUnit)
    ? (unit as CalculationUnit)
    : undefined;
}

function normalizeScenarioType(value: unknown): ScenarioType {
  const type = asString(value);
  return type && scenarioTypes.includes(type as ScenarioType)
    ? (type as ScenarioType)
    : "alternative";
}

function normalizeSeverity(value: unknown): InconsistencySeverity {
  const severity = asString(value);
  return severity && severities.includes(severity as InconsistencySeverity)
    ? (severity as InconsistencySeverity)
    : "medium";
}

function normalizeSourceRefType(value: unknown): SourceRefType {
  const type = asString(value);
  return type && sourceRefTypes.includes(type as SourceRefType)
    ? (type as SourceRefType)
    : "document";
}

function normalizeBlockedReason(value: unknown): FullAnalysisBlockedReason | undefined {
  const reason = asString(value);

  if (reason && blockedReasons.includes(reason as FullAnalysisBlockedReason)) {
    return reason as FullAnalysisBlockedReason;
  }

  if (reason === "PAYMENT_REQUIRED") {
    return "payment_required";
  }

  if (reason === "CASE_NOT_READY_FOR_FULL_ANALYSIS") {
    return "case_not_ready";
  }

  return reason ? "unknown" : undefined;
}

function normalizeWarning(raw: unknown): FullAnalysisWarning[] {
  if (typeof raw === "string" && raw.trim()) {
    return [{ code: "FULL_ANALYSIS_WARNING", message: raw.trim() }];
  }

  if (!isRecord(raw)) {
    return [];
  }

  const message = asString(raw.message);

  if (!message) {
    return [];
  }

  return [
    {
      code: asString(raw.code) || "FULL_ANALYSIS_WARNING",
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

function normalizeSourceRef(raw: unknown): SourceRef[] {
  if (!isRecord(raw)) {
    return [];
  }

  const id = asString(raw.id) || asString(raw.refId) || asString(raw.ref_id);
  const label = asString(raw.label) || asString(raw.name) || id;

  if (!id || !label) {
    return [];
  }

  return [
    {
      type: normalizeSourceRefType(raw.type),
      id,
      label,
    },
  ];
}

function normalizeSourceRefs(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(normalizeSourceRef);
}

function normalizeStep(raw: unknown): AnalysisStep[] {
  if (!isRecord(raw)) {
    return [];
  }

  const label = asString(raw.label) || asString(raw.name);

  if (!label) {
    return [];
  }

  return [
    {
      key: asString(raw.key) || asString(raw.id) || label.toLowerCase(),
      label,
      status: normalizeStepStatus(raw.status),
    },
  ];
}

function normalizeSteps(value: unknown, status: FullAnalysisStatus): AnalysisStep[] {
  if (Array.isArray(value)) {
    const steps = value.flatMap(normalizeStep);
    if (steps.length) {
      return steps;
    }
  }

  const activeByStatus: Partial<Record<FullAnalysisStatus, string>> = {
    queued: "preparing",
    in_progress: "preparing",
    rules_running: "rules",
    calculations_running: "calculations",
    scenario_comparison_running: "scenarios",
    confidence_evaluation_running: "confidence",
    completed: "summary",
  };
  const activeKey = activeByStatus[status];
  let reachedActive = false;

  return defaultSteps.map((step) => {
    if (status === "completed") {
      return { ...step, status: "completed" };
    }

    if (step.key === activeKey) {
      reachedActive = true;
      return { ...step, status: "active" };
    }

    return {
      ...step,
      status: !reachedActive && activeKey ? "completed" : "pending",
    };
  });
}

function normalizeProgress(raw: unknown, status: FullAnalysisStatus): FullAnalysisProgress {
  const data = isRecord(raw) ? raw : {};
  const percentage = normalizePercent(
    data.percentage ?? data.progress ?? data.percent,
  );

  return {
    percentage: status === "completed" ? 100 : percentage,
    currentStep:
      asString(data.currentStep) ||
      asString(data.current_step) ||
      asString(data.step) ||
      "Preparando analisis",
    steps: normalizeSteps(data.steps, status),
  };
}

function normalizeExecutiveResult(value: unknown): ExecutiveResult | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const mainFinding =
    asString(value.mainFinding) ||
    asString(value.main_finding) ||
    asString(value.summary);

  if (!mainFinding) {
    return undefined;
  }

  return {
    resultStatus: normalizeResultStatus(value.resultStatus ?? value.result_status),
    viabilityLevel: normalizeViability(value.viabilityLevel ?? value.viability_level),
    recommendedRoute: normalizeRecommendedRoute(
      value.recommendedRoute ?? value.recommended_route,
    ),
    estimatedDifference:
      asNumber(value.estimatedDifference) ??
      asNumber(value.estimated_difference),
    currency: asString(value.currency) === "COP" ? "COP" : "COP",
    mainFinding,
  };
}

function normalizeReadinessItem(raw: unknown): FullAnalysisReadinessItem[] {
  if (!isRecord(raw)) {
    return [];
  }

  const label = asString(raw.label) || asString(raw.name);

  if (!label) {
    return [];
  }

  return [
    {
      key: asString(raw.key) || asString(raw.id) || label.toLowerCase(),
      label,
      ready:
        asBoolean(raw.ready) ??
        asBoolean(raw.isReady) ??
        asBoolean(raw.is_ready) ??
        false,
      description: asString(raw.description),
    },
  ];
}

function normalizeReadiness(value: unknown, status: FullAnalysisStatus) {
  if (Array.isArray(value)) {
    const items = value.flatMap(normalizeReadinessItem);
    if (items.length) {
      return items;
    }
  }

  const ready = status !== "blocked";
  return defaultReadiness.map((item) => ({ ...item, ready }));
}

function normalizeConfidenceSummary(
  value: unknown,
): FullAnalysis["confidence"] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const globalScore = normalizePercent(
    value.globalScore ?? value.global_score ?? value.score,
  );

  return {
    globalScore,
    level: normalizeConfidenceLevel(value.level, globalScore),
    requiresHumanReview:
      asBoolean(value.requiresHumanReview) ??
      asBoolean(value.requires_human_review) ??
      false,
    reasons: normalizeStringArray(value.reasons),
  };
}

function normalizeReviewGuidance(value: unknown): FullAnalysisReviewGuidance | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const title = asString(value.title);
  const message = asString(value.message);

  if (!title || !message) {
    return undefined;
  }

  return {
    title,
    message,
    reasons: normalizeStringArray(value.reasons),
  };
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

function makeEmptyAnalysis(caseId: string): FullAnalysis {
  return {
    id: "",
    caseId,
    status: "not_started",
    version: 1,
    progress: normalizeProgress({}, "not_started"),
    readiness: defaultReadiness,
    warnings: [],
    canStart: true,
    canRetry: false,
  };
}

export function normalizeFullAnalysis(raw: unknown, fallbackCaseId: string): FullAnalysis {
  const data = unwrapApiData(raw);
  const analysis = isRecord(data) && isRecord(data.analysis)
    ? data.analysis
    : isRecord(data) && isRecord(data.fullAnalysis)
      ? data.fullAnalysis
      : isRecord(data) && isRecord(data.full_analysis)
        ? data.full_analysis
        : data;

  if (!isRecord(analysis)) {
    return makeEmptyAnalysis(fallbackCaseId);
  }

  const status = normalizeStatus(analysis.status);
  const progress = normalizeProgress(analysis.progress, status);

  return {
    id:
      asString(analysis.id) ||
      asString(analysis.analysisId) ||
      asString(analysis.analysis_id) ||
      "",
    caseId:
      asString(analysis.caseId) ||
      asString(analysis.case_id) ||
      fallbackCaseId,
    status,
    version: asNumber(analysis.version) ?? 1,
    progress,
    executiveResult: normalizeExecutiveResult(
      analysis.executiveResult ?? analysis.executive_result,
    ),
    confidence: normalizeConfidenceSummary(analysis.confidence),
    readiness: normalizeReadiness(
      analysis.readiness ?? analysis.checklist,
      status,
    ),
    warnings: normalizeWarnings(analysis.warnings),
    reviewGuidance: normalizeReviewGuidance(
      analysis.reviewGuidance ?? analysis.review_guidance,
    ),
    blockedReason: normalizeBlockedReason(
      analysis.blockedReason ?? analysis.blocked_reason,
    ),
    canStart:
      asBoolean(analysis.canStart) ??
      asBoolean(analysis.can_start) ??
      status === "not_started",
    canRetry:
      asBoolean(analysis.canRetry) ??
      asBoolean(analysis.can_retry) ??
      status === "failed",
    createdAt: asString(analysis.createdAt) || asString(analysis.created_at),
    completedAt:
      asString(analysis.completedAt) || asString(analysis.completed_at),
  };
}

function normalizeRule(raw: unknown): LegalRuleResult[] {
  if (!isRecord(raw)) {
    return [];
  }

  const ruleName = asString(raw.ruleName) || asString(raw.rule_name) || asString(raw.name);

  if (!ruleName) {
    return [];
  }

  return [
    {
      id: asString(raw.id) || asString(raw.ruleCode) || ruleName,
      ruleCode:
        asString(raw.ruleCode) ||
        asString(raw.rule_code) ||
        asString(raw.code) ||
        "RULE",
      ruleName,
      category: asString(raw.category) || "General",
      result: normalizeRuleResult(raw.result),
      explanation: asString(raw.explanation) || "Sin explicacion disponible.",
      sourceRefs: normalizeSourceRefs(raw.sourceRefs ?? raw.source_refs),
      confidence: normalizePercent(raw.confidence),
      requiresReview:
        asBoolean(raw.requiresReview) ??
        asBoolean(raw.requires_review) ??
        false,
      version: asString(raw.version),
      warnings: normalizeWarnings(raw.warnings),
    },
  ];
}

function normalizeCalculation(raw: unknown): CalculationResult[] {
  if (!isRecord(raw)) {
    return [];
  }

  const name = asString(raw.name) || asString(raw.calculationName);

  if (!name) {
    return [];
  }

  return [
    {
      id: asString(raw.id) || asString(raw.calculationCode) || name,
      calculationCode:
        asString(raw.calculationCode) ||
        asString(raw.calculation_code) ||
        asString(raw.code) ||
        "CALCULATION",
      name,
      type: asString(raw.type) || "general",
      inputValues: isRecord(raw.inputValues)
        ? raw.inputValues
        : isRecord(raw.input_values)
          ? raw.input_values
          : {},
      formulaExpression:
        asString(raw.formulaExpression) ||
        asString(raw.formula_expression),
      resultValue: asNumber(raw.resultValue ?? raw.result_value ?? raw.value),
      resultUnit: normalizeCalculationUnit(raw.resultUnit ?? raw.result_unit),
      resultDetail: isRecord(raw.resultDetail)
        ? raw.resultDetail
        : isRecord(raw.result_detail)
          ? raw.result_detail
          : undefined,
      sourceRefs: normalizeSourceRefs(raw.sourceRefs ?? raw.source_refs),
      confidence: normalizePercent(raw.confidence),
      warnings: normalizeWarnings(raw.warnings),
    },
  ];
}

function normalizeScenario(raw: unknown): Scenario[] {
  if (!isRecord(raw)) {
    return [];
  }

  const name = asString(raw.name) || asString(raw.title);

  if (!name) {
    return [];
  }

  return [
    {
      id: asString(raw.id) || name,
      scenarioType: normalizeScenarioType(raw.scenarioType ?? raw.scenario_type),
      name,
      description: asString(raw.description),
      amountEstimated:
        asNumber(raw.amountEstimated) ?? asNumber(raw.amount_estimated),
      weeksEstimated:
        asNumber(raw.weeksEstimated) ?? asNumber(raw.weeks_estimated),
      retroactiveEstimated:
        asNumber(raw.retroactiveEstimated) ??
        asNumber(raw.retroactive_estimated),
      differenceVsRecognized:
        asNumber(raw.differenceVsRecognized) ??
        asNumber(raw.difference_vs_recognized),
      confidence: normalizePercent(raw.confidence),
      warnings: normalizeWarnings(raw.warnings),
    },
  ];
}

function normalizeInconsistency(raw: unknown): AnalysisInconsistency[] {
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
      type: asString(raw.type) || "general",
      severity: normalizeSeverity(raw.severity),
      title,
      description,
      evidenceRefs: normalizeSourceRefs(raw.evidenceRefs ?? raw.evidence_refs),
      legalImpact: asString(raw.legalImpact) || asString(raw.legal_impact),
      economicImpactEstimated:
        asNumber(raw.economicImpactEstimated) ??
        asNumber(raw.economic_impact_estimated),
      missingDocuments: normalizeStringArray(
        raw.missingDocuments ?? raw.missing_documents,
      ),
      recommendedAction:
        asString(raw.recommendedAction) || asString(raw.recommended_action),
      confidence: normalizePercent(raw.confidence),
      relatedRuleId:
        asString(raw.relatedRuleId) || asString(raw.related_rule_id),
      relatedCalculationId:
        asString(raw.relatedCalculationId) ||
        asString(raw.related_calculation_id),
    },
  ];
}

function normalizeBreakdownItem(raw: unknown): ConfidenceBreakdownItem[] {
  if (!isRecord(raw)) {
    return [];
  }

  const label = asString(raw.label) || asString(raw.name);

  if (!label) {
    return [];
  }

  const score = normalizePercent(raw.score ?? raw.globalScore ?? raw.global_score);

  return [
    {
      key: asString(raw.key) || asString(raw.id) || label,
      label,
      score,
      level: normalizeConfidenceLevel(raw.level, score),
      reasons: normalizeStringArray(raw.reasons),
    },
  ];
}

function normalizePaginated<T>(
  raw: unknown,
  normalizer: (raw: unknown) => T[],
): Paginated<T> {
  const data = unwrapApiData(raw);
  const itemsValue = isRecord(data)
    ? data.items ?? data.data ?? data.results
    : data;
  const items = Array.isArray(itemsValue) ? itemsValue.flatMap(normalizer) : [];

  return {
    items,
    page: isRecord(data) ? asNumber(data.page) ?? 1 : 1,
    pageSize:
      isRecord(data)
        ? asNumber(data.pageSize ?? data.page_size ?? data.limit) ?? items.length
        : items.length,
    total: isRecord(data) ? asNumber(data.total) ?? items.length : items.length,
  };
}

export function normalizeConfidence(raw: unknown): ConfidenceResponse {
  const data = unwrapApiData(raw);
  const confidence = isRecord(data) && isRecord(data.confidence)
    ? data.confidence
    : data;

  if (!isRecord(confidence)) {
    return {
      globalScore: 0,
      level: "critical",
      requiresHumanReview: false,
      reasons: [],
      breakdown: [],
      warnings: [],
    };
  }

  const globalScore = normalizePercent(
    confidence.globalScore ?? confidence.global_score ?? confidence.score,
  );

  return {
    globalScore,
    level: normalizeConfidenceLevel(confidence.level, globalScore),
    requiresHumanReview:
      asBoolean(confidence.requiresHumanReview) ??
      asBoolean(confidence.requires_human_review) ??
      false,
    reasons: normalizeStringArray(confidence.reasons),
    breakdown: Array.isArray(confidence.breakdown)
      ? confidence.breakdown.flatMap(normalizeBreakdownItem)
      : [],
    warnings: normalizeWarnings(confidence.warnings),
  };
}

export function mapFullAnalysisError(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      PAYMENT_REQUIRED:
        "Para ver el analisis completo debes desbloquear este expediente.",
      CASE_NOT_READY_FOR_FULL_ANALYSIS:
        "Este expediente aun no esta listo para analisis completo.",
      ANALYSIS_ALREADY_RUNNING:
        "El analisis completo ya esta en ejecucion.",
      MISSING_REQUIRED_STRUCTURED_DATA:
        "Faltan datos estructurados necesarios para continuar.",
      EXTERNAL_AI_PROVIDER_FAILED:
        "El proveedor de analisis no respondio correctamente.",
      CALCULATION_ENGINE_FAILED:
        "El motor de calculo tuvo un problema recuperable.",
      LEGAL_RULE_ENGINE_FAILED:
        "El motor de reglas juridicas tuvo un problema recuperable.",
      CONSENT_REQUIRED:
        "Debes completar las autorizaciones antes de continuar.",
      CASE_ACCESS_DENIED:
        "No tienes permiso para ver este expediente.",
      CASE_NOT_FOUND:
        "No encontramos el expediente solicitado.",
    };

    if (error.status === 401) {
      return "Tu sesion expiro. Inicia sesion para continuar.";
    }

    if (error.status === 403) {
      return "No tienes permiso para ver este expediente.";
    }

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intenta nuevamente.";
}

export async function getFullAnalysis(caseId: string): Promise<FullAnalysis> {
  try {
    const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
      `/cases/${caseId}/full-analysis`,
    );

    return normalizeFullAnalysis(response, caseId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return makeEmptyAnalysis(caseId);
    }

    throw error;
  }
}

export async function startFullAnalysis(
  caseId: string,
  payload: StartFullAnalysisPayload = {},
): Promise<FullAnalysisStartResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/full-analysis`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return { analysis: normalizeFullAnalysis(response, caseId) };
}

export async function retryFullAnalysis(
  caseId: string,
  payload: RetryFullAnalysisPayload = {},
): Promise<FullAnalysisStartResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/full-analysis/retry`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return { analysis: normalizeFullAnalysis(response, caseId) };
}

export async function getRulesResults(
  caseId: string,
  params: RulesQuery = {},
): Promise<Paginated<LegalRuleResult>> {
  const search = params.filter && params.filter !== "all"
    ? `?filter=${encodeURIComponent(params.filter)}`
    : "";
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/rules-results${search}`,
  );

  return normalizePaginated(response, normalizeRule);
}

export async function getCalculations(
  caseId: string,
  params: CalculationsQuery = {},
): Promise<Paginated<CalculationResult>> {
  const search = params.type ? `?type=${encodeURIComponent(params.type)}` : "";
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/calculations${search}`,
  );

  return normalizePaginated(response, normalizeCalculation);
}

export async function getScenarios(caseId: string): Promise<{ items: Scenario[] }> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/full-analysis/scenarios`,
  );

  return { items: normalizePaginated(response, normalizeScenario).items };
}

export async function getInconsistencies(
  caseId: string,
): Promise<{ items: AnalysisInconsistency[] }> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/full-analysis/inconsistencies`,
  );

  return { items: normalizePaginated(response, normalizeInconsistency).items };
}

export async function getConfidence(caseId: string): Promise<ConfidenceResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/full-analysis/confidence`,
  );

  return normalizeConfidence(response);
}

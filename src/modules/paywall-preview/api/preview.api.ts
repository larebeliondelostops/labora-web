import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  AlertLevel,
  CheckoutSessionResponse,
  ConversionEventPayload,
  CreatePreviewPayload,
  LockedFeature,
  PreviewCtaTarget,
  PreviewResponse,
  PreviewStatus,
} from "@/src/modules/paywall-preview/api/preview.types";

type RawRecord = Record<string, unknown>;

const statuses: PreviewStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
  "requires_review",
  "error",
];

const alertLevels: AlertLevel[] = ["low", "medium", "high", "unknown"];
const ctaTargets: PreviewCtaTarget[] = ["checkout", "analysis", "review"];

const defaultBlurredSections = [
  "Matriz de inconsistencias",
  "Calculo estimado",
  "Fundamento juridico",
  "Ruta recomendada",
  "Informe tecnico",
];

const defaultFeatures: LockedFeature[] = [
  {
    key: "technical_report",
    title: "Informe tecnico completo",
    description: "Analisis estructurado con hallazgos y soporte documental.",
    isHighlighted: true,
  },
  {
    key: "detailed_calculation",
    title: "Calculo detallado",
    description: "Estimaciones y validaciones preparadas para revision.",
  },
  {
    key: "inconsistency_matrix",
    title: "Matriz de inconsistencias",
    description: "Cruce de senales detectadas y posibles brechas documentales.",
  },
  {
    key: "recommended_path",
    title: "Recomendacion de ruta",
    description: "Siguientes pasos sugeridos segun el expediente.",
  },
  {
    key: "downloads",
    title: "Descargas y escritos",
    description: "Archivos disponibles si aplican despues del desbloqueo.",
  },
];

const defaultComparison = {
  free: [
    "Resumen preliminar limitado",
    "Alertas generales",
    "Nivel de completitud",
    "Vista parcial de entregables",
  ],
  paid: [
    "Informe tecnico completo",
    "Matriz de inconsistencias",
    "Calculo detallado",
    "Recomendacion de ruta",
    "Descargas y escritos si aplican",
  ],
};

const defaultDisclaimer =
  "El pago desbloquea el analisis completo, no garantiza un resultado administrativo o judicial.";

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const text = asString(item);
    return text ? [text] : [];
  });
}

function normalizePercent(value: unknown): number | undefined {
  const numberValue = asNumber(value);

  if (numberValue === undefined) {
    return undefined;
  }

  const normalized = numberValue > 0 && numberValue <= 1 ? numberValue * 100 : numberValue;
  return Math.max(0, Math.min(100, normalized));
}

function normalizeStatus(value: unknown): PreviewStatus {
  const status = asString(value);

  if (status && statuses.includes(status as PreviewStatus)) {
    return status as PreviewStatus;
  }

  if (status === "queued" || status === "processing" || status === "running") {
    return "in_progress";
  }

  if (status === "ready" || status === "done" || status === "available") {
    return "completed";
  }

  if (status === "review_required") {
    return "requires_review";
  }

  return "not_started";
}

function normalizeAlertLevel(value: unknown): AlertLevel | undefined {
  const level = asString(value);
  return level && alertLevels.includes(level as AlertLevel)
    ? (level as AlertLevel)
    : undefined;
}

function normalizeCtaTarget(value: unknown, isUnlocked: boolean): PreviewCtaTarget {
  const target = asString(value);

  if (target && ctaTargets.includes(target as PreviewCtaTarget)) {
    return target as PreviewCtaTarget;
  }

  if (target === "result") {
    return "analysis";
  }

  if (target === "support") {
    return "review";
  }

  return isUnlocked ? "analysis" : "checkout";
}

function normalizeFeature(raw: unknown): LockedFeature[] {
  if (!isRecord(raw)) {
    return [];
  }

  const title = asString(raw.title) || asString(raw.name);

  if (!title) {
    return [];
  }

  const fallbackKey = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return [
    {
      key: asString(raw.key) || asString(raw.id) || fallbackKey || "locked_feature",
      title,
      description: asString(raw.description),
      isHighlighted:
        asBoolean(raw.isHighlighted) ?? asBoolean(raw.is_highlighted) ?? false,
    },
  ];
}

function normalizeFeatures(value: unknown): LockedFeature[] {
  if (!Array.isArray(value)) {
    return defaultFeatures;
  }

  const features = value.flatMap(normalizeFeature);
  return features.length ? features : defaultFeatures;
}

function normalizeWarnings(value: unknown): PreviewResponse["warnings"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) {
      return [{ message: item.trim() }];
    }

    if (!isRecord(item)) {
      return [];
    }

    const message = asString(item.message);

    if (!message) {
      return [];
    }

    return [
      {
        code: asString(item.code),
        message,
      },
    ];
  });
}

function findObject(...values: unknown[]) {
  return values.find(isRecord) as RawRecord | undefined;
}

function makeFallbackPreview(
  caseId: string,
  status: PreviewStatus,
  overrides: Partial<PreviewResponse> = {},
): PreviewResponse {
  return {
    caseId,
    previewId: "",
    status,
    isUnlocked: false,
    summary: {
      title: "Vista previa del resultado",
      limitedText:
        "Aun no hay suficientes datos disponibles para mostrar una vista previa confiable.",
      alertLevel: "unknown",
    },
    lockedContent: {
      blurredSections: defaultBlurredSections,
      features: defaultFeatures,
    },
    cta: {
      label: "Desbloquear analisis completo",
      target: "checkout",
      disclaimer: defaultDisclaimer,
    },
    comparison: defaultComparison,
    warnings: [],
    ...overrides,
  };
}

export function normalizePreviewResponse(
  raw: unknown,
  fallbackCaseId: string,
): PreviewResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    return makeFallbackPreview(fallbackCaseId, "not_started");
  }

  const summary = findObject(data.summary, data.previewSummary, data.preview_summary) || {};
  const lockedContent =
    findObject(data.lockedContent, data.locked_content, data.locked) || {};
  const cta = findObject(data.cta, data.callToAction, data.call_to_action) || {};
  const comparison = findObject(data.comparison, data.freeVsPaid, data.free_vs_paid) || {};
  const isUnlocked =
    asBoolean(data.isUnlocked) ??
    asBoolean(data.is_unlocked) ??
    asBoolean(data.unlocked) ??
    false;
  const status = normalizeStatus(data.status);
  const features = normalizeFeatures(
    lockedContent.features ?? lockedContent.lockedFeatures ?? lockedContent.locked_features,
  );
  const blurredSections =
    asStringArray(
      lockedContent.blurredSections ??
        lockedContent.blurred_sections ??
        lockedContent.sections,
    ) || [];

  return {
    caseId:
      asString(data.caseId) ||
      asString(data.case_id) ||
      asString(summary.caseId) ||
      fallbackCaseId,
    previewId:
      asString(data.previewId) ||
      asString(data.preview_id) ||
      asString(data.id) ||
      "",
    status,
    isUnlocked,
    summary: {
      title:
        asString(summary.title) ||
        (status === "completed" ? "Tu vista previa esta lista" : "Vista previa del resultado"),
      limitedText:
        asString(summary.limitedText) ||
        asString(summary.limited_text) ||
        asString(summary.publicSummary) ||
        asString(summary.public_summary) ||
        asString(data.limitedText) ||
        "Encontramos senales preliminares que pueden ayudarte a decidir si vale la pena desbloquear el analisis completo.",
      mainFindingTeaser:
        asString(summary.mainFindingTeaser) ||
        asString(summary.main_finding_teaser) ||
        asString(summary.teaser),
      alertLevel: normalizeAlertLevel(summary.alertLevel ?? summary.alert_level) || "unknown",
      completionScore: normalizePercent(summary.completionScore ?? summary.completion_score),
      confidenceScore: normalizePercent(summary.confidenceScore ?? summary.confidence_score),
      requiresHumanReview:
        asBoolean(summary.requiresHumanReview) ??
        asBoolean(summary.requires_human_review),
      hiddenValueHint:
        asString(summary.hiddenValueHint) ||
        asString(summary.hidden_value_hint),
      missingItems: asStringArray(summary.missingItems ?? summary.missing_items),
    },
    lockedContent: {
      blurredSections: blurredSections.length ? blurredSections : defaultBlurredSections,
      features,
    },
    cta: {
      label:
        asString(cta.label) ||
        (isUnlocked ? "Ver analisis completo" : "Desbloquear analisis completo"),
      target: normalizeCtaTarget(cta.target, isUnlocked),
      checkoutUrl: asString(cta.checkoutUrl) || asString(cta.checkout_url),
      priceLabel: asString(cta.priceLabel) || asString(cta.price_label),
      disclaimer: asString(cta.disclaimer) || defaultDisclaimer,
    },
    comparison: {
      free: asStringArray(comparison.free).length
        ? asStringArray(comparison.free)
        : defaultComparison.free,
      paid: asStringArray(comparison.paid).length
        ? asStringArray(comparison.paid)
        : defaultComparison.paid,
    },
    warnings: normalizeWarnings(data.warnings),
    blockedReason: asString(data.blockedReason) || asString(data.blocked_reason),
    statusMessage:
      asString(data.statusMessage) ||
      asString(data.status_message) ||
      asString(data.message),
  };
}

function previewForApiError(caseId: string, error: ApiError): PreviewResponse | undefined {
  if (error.code === "PREVIEW_NOT_AVAILABLE" || error.status === 404) {
    return makeFallbackPreview(caseId, "not_started", {
      statusMessage: "Aun no hay una vista previa disponible.",
    });
  }

  if (
    error.status === 423 ||
    error.code === "REVIEW_REQUIRED" ||
    error.code === "PAYWALL_BLOCKED"
  ) {
    return makeFallbackPreview(caseId, "requires_review", {
      statusMessage:
        "Tu caso requiere una validacion adicional antes de mostrar una vista previa confiable.",
    });
  }

  if (
    error.status === 403 ||
    error.code === "UNAUTHORIZED_CASE_ACCESS" ||
    error.code === "CASE_ACCESS_DENIED"
  ) {
    return makeFallbackPreview(caseId, "blocked", {
      blockedReason: error.code,
      statusMessage: "No tienes permiso sobre este expediente.",
    });
  }

  return undefined;
}

export function getPreviewErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      CONSENT_REQUIRED:
        "Falta aceptar una autorizacion requerida antes de mostrar la vista previa.",
      PREANALYSIS_REQUIRED:
        "Aun estamos preparando la informacion preliminar del expediente.",
      PRE_ANALYSIS_REQUIRED:
        "Aun estamos preparando la informacion preliminar del expediente.",
      PREVIEW_NOT_AVAILABLE: "Aun no hay una vista previa disponible.",
      PAYWALL_BLOCKED:
        "La vista previa esta bloqueada temporalmente para este expediente.",
      REVIEW_REQUIRED:
        "Tu caso requiere una validacion adicional antes de mostrar una vista previa confiable.",
      UNAUTHORIZED_CASE_ACCESS: "No tienes permiso para ver este expediente.",
      CASE_ACCESS_DENIED: "No tienes permiso para ver este expediente.",
      CHECKOUT_UNAVAILABLE:
        "No pudimos iniciar el pago en este momento. Intentalo nuevamente.",
    };

    if (error.status === 401) {
      return "Tu sesion expiro. Inicia sesion para continuar.";
    }

    if (error.status === 403) {
      return "No tienes permiso sobre este expediente.";
    }

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intentalo nuevamente.";
}

export async function getCasePreview(caseId: string): Promise<PreviewResponse> {
  try {
    const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
      `/cases/${caseId}/preview`,
    );

    return normalizePreviewResponse(response, caseId);
  } catch (error) {
    if (error instanceof ApiError) {
      const fallback = previewForApiError(caseId, error);

      if (fallback) {
        return fallback;
      }
    }

    throw error;
  }
}

export async function createCasePreview(
  caseId: string,
  payload: CreatePreviewPayload = {},
): Promise<PreviewResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/preview`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizePreviewResponse(response, caseId);
}

export async function getCasePaywall(caseId: string) {
  return apiFetch<unknown | ApiEnvelope<unknown>>(`/cases/${caseId}/paywall`);
}

export async function trackConversionEvent(payload: ConversionEventPayload) {
  await apiFetch<void>("/analytics/conversion-events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createCheckoutSession({
  caseId,
  returnUrl,
}: {
  caseId: string;
  returnUrl: string;
}): Promise<CheckoutSessionResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/checkout/session`,
    {
      method: "POST",
      body: JSON.stringify({
        source: "preview_paywall",
        returnUrl,
      }),
    },
  );
  const data = unwrapApiData(response);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "No pudimos iniciar el checkout.",
      status: 500,
      code: "CHECKOUT_UNAVAILABLE",
    });
  }

  const checkoutUrl = asString(data.checkoutUrl) || asString(data.checkout_url);

  if (!checkoutUrl) {
    throw new ApiError({
      message: "El checkout no esta disponible en este momento.",
      status: 500,
      code: "CHECKOUT_UNAVAILABLE",
      data,
    });
  }

  return {
    checkoutSessionId:
      asString(data.checkoutSessionId) ||
      asString(data.checkout_session_id) ||
      asString(data.id) ||
      "",
    checkoutUrl,
    expiresAt: asString(data.expiresAt) || asString(data.expires_at),
    provider: asString(data.provider) || "epayco",
    checkoutType:
      asString(data.checkoutType) ||
      asString(data.checkout_type) ||
      "onpage",
    testMode:
      asBoolean(data.testMode) ??
      asBoolean(data.test_mode) ??
      false,
    providerSessionToken:
      asString(data.providerSessionToken) ||
      asString(data.provider_session_token) ||
      null,
  };
}

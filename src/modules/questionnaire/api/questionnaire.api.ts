import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  AdminQuestionnaireDecisionPayload,
  Answer,
  AnswerSource,
  CaseProfilePreview,
  Question,
  QuestionOption,
  QuestionnaireResponse,
  QuestionnaireSection,
  QuestionnaireSession,
  QuestionnaireStatus,
  QuestionType,
  SaveAnswersRequest,
  SaveAnswersResponse,
  SubmitQuestionnaireRequest,
  SubmitQuestionnaireResponse,
} from "@/src/modules/questionnaire/api/questionnaire.types";

type RawRecord = Record<string, unknown>;

const questionnaireStatuses: QuestionnaireStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
  "requires_review",
  "error",
];

const questionTypes: QuestionType[] = [
  "text",
  "textarea",
  "radio",
  "checkbox",
  "select",
  "date",
  "number",
  "money",
  "file_reference",
  "yes_no",
];

const answerSources: AnswerSource[] = [
  "user",
  "prefill",
  "document_extraction",
  "ai_suggestion",
  "admin",
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

function asStatus(value: unknown): QuestionnaireStatus {
  const status = asString(value);
  return status && questionnaireStatuses.includes(status as QuestionnaireStatus)
    ? (status as QuestionnaireStatus)
    : "not_started";
}

function asQuestionType(value: unknown): QuestionType {
  const type = asString(value);
  return type && questionTypes.includes(type as QuestionType)
    ? (type as QuestionType)
    : "text";
}

function asAnswerSource(value: unknown): AnswerSource {
  const source = asString(value);
  return source && answerSources.includes(source as AnswerSource)
    ? (source as AnswerSource)
    : "user";
}

function normalizeCompletion(value: unknown) {
  const numeric = asNumber(value) ?? 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function normalizeSession(raw: unknown): QuestionnaireSession {
  const record = isRecord(raw) ? raw : {};
  return {
    id:
      asString(record.id) ||
      asString(record.sessionId) ||
      asString(record.session_id) ||
      "questionnaire-session",
    status: asStatus(record.status),
    completionPercentage: normalizeCompletion(
      record.completionPercentage ?? record.completion_percentage,
    ),
    currentSection:
      asString(record.currentSection) ||
      asString(record.current_section) ||
      null,
  };
}

function normalizeOption(raw: unknown): QuestionOption | null {
  if (!isRecord(raw)) {
    return null;
  }

  const value = asString(raw.value) || asString(raw.code) || asString(raw.id);
  const label = asString(raw.label) || asString(raw.name) || value;

  if (!value || !label) {
    return null;
  }

  return {
    value,
    label,
    description: asString(raw.description),
  };
}

function normalizeValidation(raw: unknown) {
  if (!isRecord(raw)) {
    return undefined;
  }

  return {
    minLength: asNumber(raw.minLength) ?? asNumber(raw.min_length),
    maxLength: asNumber(raw.maxLength) ?? asNumber(raw.max_length),
    min: asNumber(raw.min),
    max: asNumber(raw.max),
    pattern: asString(raw.pattern),
    requiredMessage:
      asString(raw.requiredMessage) || asString(raw.required_message),
  };
}

function normalizeAnswer(raw: unknown): Answer | null {
  if (!isRecord(raw)) {
    return null;
  }

  return {
    id: asString(raw.id) || asString(raw.answerId) || asString(raw.answer_id) || "answer",
    value: raw.value ?? null,
    source: asAnswerSource(raw.source),
    confidence:
      asNumber(raw.confidence) ??
      asNumber(raw.confidenceScore) ??
      asNumber(raw.confidence_score) ??
      null,
    requiresReview:
      asBoolean(raw.requiresReview) ?? asBoolean(raw.requires_review),
    updatedAt: asString(raw.updatedAt) || asString(raw.updated_at),
  };
}

function normalizeQuestion(raw: unknown): Question | null {
  if (!isRecord(raw)) {
    return null;
  }

  const code = asString(raw.code) || asString(raw.id);
  const label = asString(raw.label) || asString(raw.title) || code;

  if (!code || !label) {
    return null;
  }

  const options = Array.isArray(raw.options)
    ? raw.options.flatMap((item) => {
        const option = normalizeOption(item);
        return option ? [option] : [];
      })
    : undefined;

  return {
    id: asString(raw.id) || code,
    code,
    label,
    helpText:
      asString(raw.helpText) ||
      asString(raw.help_text) ||
      asString(raw.description),
    type: asQuestionType(raw.type),
    required: asBoolean(raw.required) ?? false,
    visible: asBoolean(raw.visible) ?? true,
    isCritical:
      asBoolean(raw.isCritical) ??
      asBoolean(raw.is_critical) ??
      false,
    options,
    validation: normalizeValidation(raw.validation),
    answer: normalizeAnswer(raw.answer),
  };
}

function normalizeSection(raw: unknown, index: number): QuestionnaireSection | null {
  if (!isRecord(raw)) {
    return null;
  }

  const code = asString(raw.code) || asString(raw.id) || `section_${index + 1}`;
  const questions = Array.isArray(raw.questions)
    ? raw.questions.flatMap((item) => {
        const question = normalizeQuestion(item);
        return question ? [question] : [];
      })
    : [];

  return {
    code,
    title: asString(raw.title) || asString(raw.label) || code,
    description: asString(raw.description),
    order: asNumber(raw.order) ?? index + 1,
    visible: asBoolean(raw.visible) ?? true,
    questions,
  };
}

function normalizeProfilePreview(raw: unknown): CaseProfilePreview | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  return {
    hasPublicSectorWork:
      asBoolean(raw.hasPublicSectorWork) ??
      asBoolean(raw.has_public_sector_work) ??
      null,
    hasTeacherHistory:
      asBoolean(raw.hasTeacherHistory) ??
      asBoolean(raw.has_teacher_history) ??
      null,
    hasSpecialRegimeSignal:
      asBoolean(raw.hasSpecialRegimeSignal) ??
      asBoolean(raw.has_special_regime_signal) ??
      null,
    hasMissingWeeksClaim:
      asBoolean(raw.hasMissingWeeksClaim) ??
      asBoolean(raw.has_missing_weeks_claim) ??
      null,
    hasReliquidationSignal:
      asBoolean(raw.hasReliquidationSignal) ??
      asBoolean(raw.has_reliquidation_signal) ??
      null,
    requiresReview:
      asBoolean(raw.requiresReview) ?? asBoolean(raw.requires_review),
    confidence:
      asNumber(raw.confidence) ??
      asNumber(raw.confidenceScore) ??
      asNumber(raw.confidence_score) ??
      null,
    missingDocuments: asStringArray(
      raw.missingDocuments ?? raw.missing_documents,
    ),
  };
}

export function normalizeQuestionnaire(raw: unknown): QuestionnaireResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta del cuestionario no tiene el formato esperado.",
      status: 500,
      code: "INVALID_QUESTIONNAIRE_RESPONSE",
    });
  }

  const sections = Array.isArray(data.sections)
    ? data.sections.flatMap((item, index) => {
        const section = normalizeSection(item, index);
        return section ? [section] : [];
      })
    : [];

  const template = isRecord(data.template) ? data.template : {};

  return {
    caseId: asString(data.caseId) || asString(data.case_id) || "",
    session: normalizeSession(data.session),
    template: {
      code:
        asString(template.code) ||
        asString(data.templateCode) ||
        asString(data.template_code) ||
        "case_questionnaire",
      version:
        asNumber(template.version) ??
        asNumber(data.templateVersion) ??
        asNumber(data.template_version) ??
        1,
    },
    sections: sections.sort((left, right) => left.order - right.order),
    profilePreview: normalizeProfilePreview(
      data.profilePreview ?? data.profile_preview,
    ),
  };
}

function normalizeWarning(raw: unknown) {
  if (!isRecord(raw)) {
    return null;
  }

  const message = asString(raw.message);
  if (!message) {
    return null;
  }

  return {
    code: asString(raw.code) || "QUESTIONNAIRE_WARNING",
    message,
  };
}

function normalizeWarnings(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const warning = normalizeWarning(item);
    return warning ? [warning] : [];
  });
}

function normalizeSaveResponse(raw: unknown): SaveAnswersResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta de guardado no tiene el formato esperado.",
      status: 500,
      code: "INVALID_QUESTIONNAIRE_SAVE_RESPONSE",
    });
  }

  return {
    saved: asBoolean(data.saved) ?? true,
    session: normalizeSession(data.session),
    changedQuestions: asStringArray(
      data.changedQuestions ?? data.changed_questions,
    ),
    newlyVisibleQuestions: asStringArray(
      data.newlyVisibleQuestions ?? data.newly_visible_questions,
    ),
    hiddenQuestions: asStringArray(data.hiddenQuestions ?? data.hidden_questions),
    profilePreview: normalizeProfilePreview(
      data.profilePreview ?? data.profile_preview,
    ),
    warnings: normalizeWarnings(data.warnings),
  };
}

function normalizeSubmitResponse(raw: unknown): SubmitQuestionnaireResponse {
  const data = unwrapApiData(raw);

  if (!isRecord(data)) {
    throw new ApiError({
      message: "La respuesta de envio no tiene el formato esperado.",
      status: 500,
      code: "INVALID_QUESTIONNAIRE_SUBMIT_RESPONSE",
    });
  }

  const status = asString(data.status);
  const profileRecord = isRecord(data.profile) ? data.profile : {};
  const profile = normalizeProfilePreview(profileRecord) || {};
  const nextStep = isRecord(data.nextStep ?? data.next_step)
    ? (data.nextStep ?? data.next_step) as RawRecord
    : undefined;

  return {
    status: status === "requires_review" ? "requires_review" : "completed",
    completedAt:
      asString(data.completedAt) ||
      asString(data.completed_at) ||
      new Date().toISOString(),
    profile: {
      ...profile,
      caseId:
        asString(profileRecord.caseId) ||
        asString(profileRecord.case_id) ||
        asString(data.caseId) ||
        asString(data.case_id) ||
        "",
      currentStatus:
        asString(profileRecord.currentStatus) ||
        asString(profileRecord.current_status),
      criticalFacts: asStringArray(
        profileRecord.criticalFacts ?? profileRecord.critical_facts,
      ),
    },
    nextStep: nextStep
      ? {
          code: asString(nextStep.code) || "next",
          label: asString(nextStep.label) || "Continuar",
          href: asString(nextStep.href),
        }
      : undefined,
  };
}

export function getQuestionnaireErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      INVALID_ANSWER_VALUE: "Revisa esta respuesta antes de continuar.",
      MISSING_REQUIRED_ANSWERS: "Faltan algunas preguntas obligatorias.",
      CASE_ACCESS_DENIED: "No tienes permiso para acceder a este expediente.",
      MISSING_CONSENT:
        "Antes de continuar debes completar las autorizaciones necesarias.",
      CONSENT_REQUIRED:
        "Antes de continuar debes completar las autorizaciones necesarias.",
      CASE_NOT_FOUND: "No encontramos este expediente.",
      QUESTIONNAIRE_ALREADY_COMPLETED:
        "Este cuestionario ya fue enviado. Puedes revisar el resumen.",
      STALE_ANSWER_VERSION:
        "Hay cambios mas recientes. Actualizamos la informacion para evitar conflictos.",
      AI_PROVIDER_ERROR:
        "No pudimos generar algunas sugerencias automaticas, pero puedes continuar con el cuestionario base.",
      UNAUTHORIZED: "Tu sesion no tiene permisos para modificar este expediente.",
    };

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intenta nuevamente.";
}

export async function getQuestionnaire(caseId: string): Promise<QuestionnaireResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/questionnaire`,
  );

  return normalizeQuestionnaire(response);
}

export async function startQuestionnaire(caseId: string): Promise<QuestionnaireResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/questionnaire/start`,
    {
      method: "POST",
    },
  );

  return normalizeQuestionnaire(response);
}

export async function saveQuestionnaireAnswers(
  caseId: string,
  payload: SaveAnswersRequest,
): Promise<SaveAnswersResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/questionnaire/answers`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeSaveResponse(response);
}

export async function submitQuestionnaire(
  caseId: string,
  payload: SubmitQuestionnaireRequest,
): Promise<SubmitQuestionnaireResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/questionnaire/submit`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeSubmitResponse(response);
}

export async function getAdminQuestionnaire(caseId: string): Promise<QuestionnaireResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/admin/cases/${caseId}/questionnaire`,
  );

  return normalizeQuestionnaire(response);
}

export async function submitAdminQuestionnaireDecision(
  caseId: string,
  payload: AdminQuestionnaireDecisionPayload,
): Promise<QuestionnaireResponse> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/admin/cases/${caseId}/questionnaire/decision`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeQuestionnaire(response);
}

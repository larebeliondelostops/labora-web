import type {
  Question,
  QuestionnaireResponse,
  QuestionnaireSection,
  QuestionValue,
} from "@/src/modules/questionnaire/api/questionnaire.types";

export type QuestionnaireAnswers = Record<string, unknown>;
export type QuestionnaireFieldErrors = Record<string, string>;

export function isEmptyAnswer(value: unknown) {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

export function collectInitialAnswers(data?: QuestionnaireResponse | null) {
  const answers: QuestionnaireAnswers = {};

  data?.sections.forEach((section) => {
    section.questions.forEach((question) => {
      if (question.answer && question.answer.value !== undefined) {
        answers[question.code] = question.answer.value;
      }
    });
  });

  return answers;
}

export function getVisibleSections(data?: QuestionnaireResponse | null) {
  return (data?.sections || [])
    .filter((section) => section.visible)
    .map((section) => ({
      ...section,
      questions: section.questions.filter((question) => question.visible),
    }))
    .filter((section) => section.questions.length > 0);
}

function isValidDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function isFutureDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date.getTime() > today.getTime();
}

function getStringLength(value: unknown) {
  return typeof value === "string" ? value.trim().length : 0;
}

function getNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function normalizeQuestionValue(
  question: Question,
  value: unknown,
): QuestionValue {
  if (value === undefined || value === "") {
    return null;
  }

  if (question.type === "number" || question.type === "money") {
    return getNumericValue(value) ?? null;
  }

  if (question.type === "checkbox") {
    return Array.isArray(value)
      ? value.flatMap((item) => (typeof item === "string" ? [item] : []))
      : [];
  }

  if (question.type === "yes_no") {
    return typeof value === "boolean" ? value : null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  return null;
}

export function validateQuestionAnswer(question: Question, value: unknown) {
  if (!question.visible) {
    return null;
  }

  if (question.required && isEmptyAnswer(value)) {
    return question.validation?.requiredMessage || "Este dato es necesario para continuar.";
  }

  if (isEmptyAnswer(value)) {
    return null;
  }

  if (question.type === "date") {
    if (!isValidDate(value)) {
      return "Revisa el formato de la fecha.";
    }

    if (typeof value === "string" && isFutureDate(value)) {
      return "La fecha no puede estar en el futuro.";
    }
  }

  if (question.type === "textarea") {
    const minLength =
      question.validation?.minLength ?? (question.isCritical ? 10 : undefined);
    if (minLength && getStringLength(value) < minLength) {
      return "Cuentanos un poco mas para poder analizar el caso.";
    }
  }

  if (
    (question.type === "money" || question.type === "number") &&
    getNumericValue(value) !== undefined
  ) {
    const numeric = getNumericValue(value);
    if (numeric === undefined) {
      return null;
    }

    if (question.type === "money" && numeric < 0) {
      return "Ingresa un valor positivo.";
    }

    if (question.validation?.min !== undefined && numeric < question.validation.min) {
      return `El valor minimo permitido es ${question.validation.min}.`;
    }

    if (question.validation?.max !== undefined && numeric > question.validation.max) {
      return `El valor maximo permitido es ${question.validation.max}.`;
    }
  }

  if (question.validation?.minLength && getStringLength(value) < question.validation.minLength) {
    return `Ingresa al menos ${question.validation.minLength} caracteres.`;
  }

  if (question.validation?.maxLength && getStringLength(value) > question.validation.maxLength) {
    return `Usa maximo ${question.validation.maxLength} caracteres.`;
  }

  if (question.validation?.pattern && typeof value === "string") {
    try {
      const pattern = new RegExp(question.validation.pattern);
      if (!pattern.test(value)) {
        return "Revisa el formato de esta respuesta.";
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function validateSectionAnswers(
  section: QuestionnaireSection,
  answers: QuestionnaireAnswers,
) {
  return section.questions.reduce<QuestionnaireFieldErrors>((errors, question) => {
    const error = validateQuestionAnswer(question, answers[question.code]);
    if (error) {
      errors[question.code] = error;
    }

    return errors;
  }, {});
}

export function getSectionProgress(
  section: QuestionnaireSection,
  answers: QuestionnaireAnswers,
) {
  const visibleQuestions = section.questions.filter((question) => question.visible);
  const requiredQuestions = visibleQuestions.filter((question) => question.required);
  const base = requiredQuestions.length ? requiredQuestions : visibleQuestions;

  if (base.length === 0) {
    return 100;
  }

  const answered = base.filter((question) => !isEmptyAnswer(answers[question.code])).length;
  return Math.round((answered / base.length) * 100);
}

export function formatAnswerValue(question: Question, value: unknown) {
  if (isEmptyAnswer(value)) {
    return "Sin responder";
  }

  if (question.type === "yes_no") {
    return value === true ? "Si" : "No";
  }

  if (question.type === "checkbox" && Array.isArray(value)) {
    return value
      .map((item) => question.options?.find((option) => option.value === item)?.label || item)
      .join(", ");
  }

  if (question.type === "radio" || question.type === "select") {
    const text = typeof value === "string" ? value : String(value);
    return question.options?.find((option) => option.value === text)?.label || text;
  }

  if (question.type === "money") {
    const numeric = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(numeric)) {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(numeric);
    }
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

export function getCriticalAnsweredQuestions(
  sections: QuestionnaireSection[],
  answers: QuestionnaireAnswers,
) {
  return sections.flatMap((section) =>
    section.questions.filter(
      (question) => question.visible && question.isCritical && !isEmptyAnswer(answers[question.code]),
    ),
  );
}

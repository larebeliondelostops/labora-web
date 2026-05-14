import type {
  CaseHolder,
  CaseNextAction,
  CaseTypeRequested,
  DocumentType,
  SituationType,
} from "@/src/modules/cases/api/cases.types";

export const documentTypeLabels: Record<DocumentType, string> = {
  CC: "Cedula de ciudadania",
  CE: "Cedula de extranjeria",
  PA: "Pasaporte",
  NIT: "NIT",
  OTHER: "Otro",
};

export const caseTypeLabels: Record<CaseTypeRequested, string> = {
  labor_history_analysis: "Analisis de historia laboral",
  pension_liquidation_review: "Validacion de liquidacion pensional",
  pension_reliquidation: "Reliquidacion pensional",
  missing_weeks_review: "Revision de semanas o tiempos no reconocidos",
  public_service_time_review: "Revision de tiempos de servicio publico",
  teacher_magisterio_case: "Caso docente / magisterio",
  special_regime_case: "Regimen especial",
  administrative_claim: "Reclamacion administrativa",
  lawsuit_draft_preparation: "Borrador de demanda",
  not_sure: "No estoy seguro",
};

export const situationTypeLabels: Record<SituationType, string> = {
  not_pensioned_yet: "Aun no estoy pensionado",
  pensioned_with_doubts: "Ya estoy pensionado, pero tengo dudas",
  request_denied: "Me negaron una solicitud",
  recognized_with_possible_error: "Me reconocieron pension, pero creo que hay error",
  reliquidation_needed: "Quiero pedir reliquidacion",
  missing_weeks_or_time: "Creo que faltan semanas o tiempos",
  employer_default_or_omission: "Hubo mora u omision del empleador",
  regime_transfer_issue: "Tuve traslados entre fondos",
  other: "Otra situacion",
  not_sure: "No estoy seguro",
};

export const nextActionLabels: Record<CaseNextAction, string> = {
  complete_case: "Completar expediente",
  upload_documents: "Subir documentos",
  start_preanalysis: "Continuar validacion preliminar",
  view_preanalysis: "Ver preanalisis",
  unlock_full_analysis: "Desbloquear analisis completo",
  view_report: "Ver informe",
  request_review: "Solicitar revision profesional",
  none: "Sin acciones pendientes",
};

export function getHolderFullName(holder: Pick<CaseHolder, "firstName" | "lastName">) {
  return [holder.firstName, holder.lastName].filter(Boolean).join(" ").trim();
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function maskDocument(value?: string | null) {
  if (!value) {
    return "Sin documento";
  }

  const clean = value.trim();

  if (clean.length <= 4 || clean.includes("*")) {
    return clean;
  }

  return `${"*".repeat(Math.max(clean.length - 4, 2))}${clean.slice(-4)}`;
}

export function getInitials(holder: Pick<CaseHolder, "firstName" | "lastName">) {
  const initials = [holder.firstName, holder.lastName]
    .filter(Boolean)
    .map((part) => part.trim().charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return initials || "EX";
}

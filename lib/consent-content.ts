import type { ConsentComplianceStatus, ConsentType } from "@/types/consent";

export const consentTypeLabels: Record<ConsentType, string> = {
  terms_and_conditions: "Terminos y condiciones",
  personal_data_processing: "Tratamiento de datos personales",
  sensitive_data_processing: "Datos sensibles",
  electronic_means: "Medios electronicos",
  ai_scope_acknowledgement: "Alcance de IA",
};

export const consentTypeDescriptions: Record<ConsentType, string> = {
  terms_and_conditions: "Acepto los terminos y condiciones del servicio.",
  personal_data_processing:
    "Autorizo el tratamiento de mis datos personales para gestionar mi expediente en Labora.",
  sensitive_data_processing:
    "Autorizo el tratamiento de datos laborales, pensionales, salariales, juridicos y demas informacion sensible necesaria para el analisis.",
  electronic_means:
    "Acepto el uso de medios electronicos para comunicaciones, documentos, aceptaciones y trazabilidad del proceso.",
  ai_scope_acknowledgement:
    "Entiendo que Labora puede usar analisis asistido por IA y que los resultados juridicos pueden requerir validacion profesional antes de una actuacion formal.",
};

export const consentStatusLabels: Record<ConsentComplianceStatus, string> = {
  not_started: "Pendiente",
  in_progress: "En progreso",
  completed: "Completo",
  blocked: "Bloqueado",
  requires_review: "Requiere revision",
  error: "Error",
};

export function getConsentTypeLabel(type: ConsentType): string {
  return consentTypeLabels[type] || type;
}

export function getApiConsentTypeOptions(): ConsentType[] {
  return Object.keys(consentTypeLabels) as ConsentType[];
}

export function getConsentDescription(type: ConsentType, fallback?: string): string {
  return consentTypeDescriptions[type] || fallback || "Autorizacion requerida por Labora.";
}

export function getShortHash(hash?: string): string {
  if (!hash) {
    return "Sin hash";
  }

  return hash.length > 12 ? `${hash.slice(0, 12)}...` : hash;
}

export function formatConsentDate(value?: string): string {
  if (!value) {
    return "Pendiente";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function emitConsentEvent(name: string, payload?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(name, { detail: payload || {} }));
}

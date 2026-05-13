import type { CaseStatus } from "@/src/modules/cases/api/cases.types";

export type CaseStatusTone = "neutral" | "success" | "warning" | "error" | "deep" | "info";

export interface CaseStatusMeta {
  label: string;
  tone: CaseStatusTone;
  message: string;
}

export const caseStatusMeta: Record<CaseStatus, CaseStatusMeta> = {
  draft: {
    label: "Borrador",
    tone: "neutral",
    message: "Completa los datos para continuar.",
  },
  created: {
    label: "Creado",
    tone: "success",
    message: "Tu expediente fue creado.",
  },
  ready_for_documents: {
    label: "Listo para documentos",
    tone: "success",
    message: "Sube tus documentos para continuar.",
  },
  documents_pending: {
    label: "Documentos pendientes",
    tone: "warning",
    message: "Aun faltan documentos.",
  },
  documents_uploaded: {
    label: "Documentos cargados",
    tone: "success",
    message: "Tus documentos fueron recibidos.",
  },
  preanalysis_pending: {
    label: "Preanalisis pendiente",
    tone: "warning",
    message: "Estamos preparando una revision preliminar.",
  },
  preanalysis_ready: {
    label: "Preanalisis listo",
    tone: "success",
    message: "Ya puedes revisar el resultado preliminar.",
  },
  preview_locked: {
    label: "Vista previa bloqueada",
    tone: "deep",
    message: "Desbloquea el analisis completo con el pago.",
  },
  paid_unlocked: {
    label: "Desbloqueado",
    tone: "success",
    message: "El analisis completo esta habilitado.",
  },
  analysis_in_progress: {
    label: "En analisis",
    tone: "info",
    message: "Estamos procesando tu caso.",
  },
  completed: {
    label: "Completado",
    tone: "success",
    message: "Resultado completo disponible.",
  },
  requires_review: {
    label: "Requiere revision",
    tone: "warning",
    message: "Un experto debe revisar este caso.",
  },
  blocked: {
    label: "Bloqueado",
    tone: "error",
    message: "Hay un bloqueo que debes resolver.",
  },
  closed: {
    label: "Cerrado",
    tone: "neutral",
    message: "Este expediente fue cerrado.",
  },
  archived: {
    label: "Archivado",
    tone: "neutral",
    message: "Este expediente esta archivado.",
  },
  error: {
    label: "Error",
    tone: "error",
    message: "Ocurrio un problema.",
  },
};

export function getCaseStatusMeta(status: CaseStatus): CaseStatusMeta {
  return caseStatusMeta[status] || caseStatusMeta.error;
}

import type { ReportStatus } from "@/src/modules/reports/api/reports.types";

export type ReportStatusTone = "neutral" | "success" | "warning" | "danger" | "info" | "deep";

export interface ReportStatusMeta {
  label: string;
  tone: ReportStatusTone;
  message: string;
}

export const reportStatusMeta: Record<ReportStatus, ReportStatusMeta> = {
  not_started: {
    label: "No iniciado",
    tone: "neutral",
    message: "Aun no se ha generado este informe.",
  },
  in_progress: {
    label: "Generando",
    tone: "info",
    message: "Estamos generando tu informe. Este proceso puede tardar unos minutos.",
  },
  completed: {
    label: "Listo",
    tone: "success",
    message: "Tu informe esta listo para revisar y descargar.",
  },
  blocked: {
    label: "Bloqueado",
    tone: "deep",
    message: "El informe se desbloquea cuando el pago o el analisis esten completos.",
  },
  requires_review: {
    label: "Requiere revision",
    tone: "warning",
    message: "Este informe requiere revision antes de su entrega final.",
  },
  error: {
    label: "Error",
    tone: "danger",
    message: "No pudimos generar el informe. Intenta nuevamente o contacta soporte.",
  },
  draft: {
    label: "Borrador",
    tone: "neutral",
    message: "El informe esta en borrador.",
  },
  queued: {
    label: "En cola",
    tone: "info",
    message: "La generacion esta en cola.",
  },
  generating: {
    label: "Generando",
    tone: "info",
    message: "Estamos generando tu informe. Este proceso puede tardar unos minutos.",
  },
  ready: {
    label: "Listo",
    tone: "success",
    message: "Tu informe esta listo para revisar y descargar.",
  },
  approved: {
    label: "Aprobado",
    tone: "success",
    message: "El informe fue aprobado.",
  },
  rejected: {
    label: "Rechazado",
    tone: "danger",
    message: "El informe fue rechazado por revision interna.",
  },
  failed: {
    label: "Fallido",
    tone: "danger",
    message: "No pudimos generar el informe. Intenta nuevamente o contacta soporte.",
  },
};

export function getReportStatusMeta(status: ReportStatus): ReportStatusMeta {
  return reportStatusMeta[status] || reportStatusMeta.error;
}

export function isReportReady(status: ReportStatus) {
  return status === "completed" || status === "ready" || status === "approved";
}

export function isReportProcessing(status: ReportStatus) {
  return status === "in_progress" || status === "queued" || status === "generating";
}

export function isReportBlocked(status: ReportStatus) {
  return status === "blocked" || status === "not_started";
}

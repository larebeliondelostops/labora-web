import type {
  CaseNextAction,
  CaseStatus,
} from "@/src/modules/cases/api/cases.types";

interface NextActionMeta {
  label: string;
  description: string;
  href: (caseId: string) => string;
}

export const nextActionMeta: Record<CaseNextAction, NextActionMeta> = {
  complete_case: {
    label: "Completar expediente",
    description: "Revisa los datos basicos antes de avanzar.",
    href: (caseId) => `/app/cases/${caseId}/edit`,
  },
  upload_documents: {
    label: "Subir documentos",
    description: "Tu expediente esta listo. Ahora puedes subir tu historia laboral y soportes.",
    href: (caseId) => `/app/cases/${caseId}/documents`,
  },
  start_preanalysis: {
    label: "Continuar validacion preliminar",
    description: "Tus documentos fueron recibidos. Revisa la IA documental preliminar para continuar.",
    href: (caseId) => `/app/cases/${caseId}/pre-analysis`,
  },
  view_preanalysis: {
    label: "Ver preanalisis",
    description: "Revisa el resultado preliminar preparado por Labora.",
    href: (caseId) => `/app/cases/${caseId}/pre-analysis`,
  },
  unlock_full_analysis: {
    label: "Desbloquear analisis completo",
    description: "Activa el analisis completo, informes y calculos disponibles.",
    href: (caseId) => `/app/cases/${caseId}/checkout`,
  },
  view_report: {
    label: "Ver informe",
    description: "Consulta el informe completo de tu expediente.",
    href: (caseId) => `/app/cases/${caseId}/report`,
  },
  request_review: {
    label: "Solicitar revision profesional",
    description: "Pide que un profesional revise el expediente.",
    href: (caseId) => `/app/cases/${caseId}/history`,
  },
  none: {
    label: "Sin acciones pendientes",
    description: "Tu expediente no requiere una accion en este momento.",
    href: (caseId) => `/app/cases/${caseId}`,
  },
};

export const progressSteps = [
  { id: "created", label: "Expediente creado" },
  { id: "documents", label: "Documentos" },
  { id: "preanalysis", label: "IA preliminar" },
  { id: "validation", label: "Validacion" },
  { id: "preview", label: "Vista previa" },
  { id: "payment", label: "Pago" },
  { id: "analysis", label: "Analisis completo" },
  { id: "report", label: "Informe" },
  { id: "legal_actions", label: "Escritos" },
  { id: "delivery", label: "Entrega final" },
] as const;

export type CaseProgressStepId = (typeof progressSteps)[number]["id"];
export type CaseProgressState = "pending" | "current" | "completed" | "blocked" | "error";

const statusProgressIndex: Record<CaseStatus, number> = {
  draft: 0,
  created: 0,
  ready_for_documents: 1,
  documents_pending: 1,
  documents_uploaded: 2,
  preanalysis_pending: 2,
  preanalysis_ready: 4,
  preview_locked: 5,
  paid_unlocked: 6,
  analysis_in_progress: 6,
  completed: 9,
  requires_review: 3,
  blocked: 0,
  closed: 9,
  archived: 9,
  error: 0,
};

export function getNextActionHref(action: CaseNextAction, caseId: string) {
  return nextActionMeta[action]?.href(caseId) || `/app/cases/${caseId}`;
}

export function getProgressStates(status: CaseStatus): Record<CaseProgressStepId, CaseProgressState> {
  const currentIndex = statusProgressIndex[status] ?? 0;

  return progressSteps.reduce(
    (acc, step, index) => {
      let state: CaseProgressState = "pending";

      if (status === "error") {
        state = index === currentIndex ? "error" : "pending";
      } else if (status === "blocked") {
        state = index === currentIndex ? "blocked" : "pending";
      } else if (index < currentIndex) {
        state = "completed";
      } else if (index === currentIndex) {
        state = "current";
      }

      acc[step.id] = state;
      return acc;
    },
    {} as Record<CaseProgressStepId, CaseProgressState>,
  );
}

export function deriveNextAction(status: CaseStatus): CaseNextAction {
  if (status === "draft" || status === "created") {
    return "complete_case";
  }

  if (status === "ready_for_documents" || status === "documents_pending") {
    return "upload_documents";
  }

  if (status === "documents_uploaded" || status === "preanalysis_pending") {
    return "start_preanalysis";
  }

  if (status === "preanalysis_ready") {
    return "view_preanalysis";
  }

  if (status === "preview_locked") {
    return "unlock_full_analysis";
  }

  if (status === "completed") {
    return "view_report";
  }

  if (status === "requires_review") {
    return "request_review";
  }

  return "none";
}

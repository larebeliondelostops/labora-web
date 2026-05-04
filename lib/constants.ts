import { CaseStatus } from "@/types/case";

export const caseStatusLabels: Record<CaseStatus, string> = {
  draft: "Borrador",
  pending_payment: "Pago pendiente",
  payment_approved: "Pago aprobado",
  documents_pending: "Documentos pendientes",
  documents_uploaded: "Documentos cargados",
  document_validation: "Validacion documental",
  questionnaire_pending: "Cuestionario pendiente",
  analysis_pending: "Analisis pendiente",
  analysis_processing: "Analisis en proceso",
  results_available: "Resultado disponible",
  legal_draft_generated: "Borrador generado",
  professional_review: "Revision profesional",
  completed: "Completado",
  closed: "Cerrado",
};

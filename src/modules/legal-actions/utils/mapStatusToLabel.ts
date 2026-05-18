import type {
  DraftSectionStatus,
  EligibilityStatus,
  LegalActionStatus,
  LegalActionType,
  LegalDraftStatus,
  ProfessionalReviewLevel,
  QualityOverallStatus,
} from "@/src/modules/legal-actions/api/legal-actions.types";

export const legalActionTypeLabels: Record<LegalActionType, string> = {
  technical_report_download: "Descargar informe tecnico",
  executive_summary: "Generar resumen ejecutivo",
  petition: "Generar derecho de peticion",
  administrative_claim: "Generar reclamacion administrativa",
  reliquidation_request: "Solicitar reliquidacion",
  administrative_appeal: "Generar recurso",
  lawsuit_draft: "Generar borrador de demanda",
  professional_review_request: "Solicitar revision profesional",
};

export const legalActionTypeDescriptions: Record<LegalActionType, string> = {
  technical_report_download:
    "Accede al informe completo que sustenta las recomendaciones del caso.",
  executive_summary:
    "Prepara una version breve del analisis para revisar el panorama del expediente.",
  petition:
    "Solicita informacion, correcciones o soportes ante la entidad correspondiente.",
  administrative_claim:
    "Presenta una reclamacion formal con hechos, anexos e inconsistencias.",
  reliquidation_request:
    "Estructura una solicitud de reliquidacion con base en el calculo disponible.",
  administrative_appeal:
    "Prepara un recurso frente a una decision administrativa identificada.",
  lawsuit_draft:
    "Construye un borrador tecnico-juridico para una eventual salida judicial.",
  professional_review_request:
    "Solicita que un profesional revise el expediente o el borrador antes de usarlo.",
};

export const eligibilityLabels: Record<EligibilityStatus, string> = {
  available: "Disponible",
  recommended: "Recomendada",
  not_recommended: "No recomendada",
  blocked: "Bloqueada",
  requires_more_data: "Faltan datos",
  requires_professional_review: "Requiere revision",
};

export const professionalReviewLabels: Record<ProfessionalReviewLevel, string> = {
  none: "Sin revision requerida",
  optional: "Revision opcional",
  recommended: "Revision recomendada",
  mandatory: "Revision obligatoria",
};

export const legalActionStatusLabels: Record<LegalActionStatus, string> = {
  not_started: "Sin iniciar",
  in_progress: "En progreso",
  generated: "Borrador generado",
  requires_review: "Requiere revision",
  blocked: "Bloqueada",
  completed: "Completada",
  cancelled: "Cancelada",
  error: "Con error",
};

export const draftStatusLabels: Record<LegalDraftStatus, string> = {
  created: "Creado",
  generating: "Generando",
  ready_for_edit: "Listo para editar",
  editing: "En edicion",
  quality_check_pending: "Revisando calidad",
  quality_check_failed: "Calidad con errores",
  quality_check_passed: "Calidad aprobada",
  requires_review: "Requiere revision",
  approved: "Aprobado",
  export_ready: "Listo para exportar",
  exported: "Exportado",
  failed: "Fallido",
  archived: "Archivado",
};

export const draftSectionStatusLabels: Record<DraftSectionStatus, string> = {
  pending: "Pendiente",
  generating: "Generando",
  generated: "Generada",
  edited: "Editada",
  approved: "Aprobada",
  needs_data: "Necesita datos",
  low_confidence: "Baja confianza",
  failed: "Fallida",
};

export const qualityStatusLabels: Record<QualityOverallStatus, string> = {
  passed: "Listo para descarga",
  passed_with_warnings: "Listo con observaciones",
  failed: "No recomendable presentar aun",
  requires_review: "Requiere revision",
};

export function isJudicialAction(actionType?: LegalActionType) {
  return actionType === "lawsuit_draft";
}

export function actionNeedsAcknowledgement(
  actionType?: LegalActionType,
  level?: ProfessionalReviewLevel,
) {
  return (
    actionType === "lawsuit_draft" ||
    level === "recommended" ||
    level === "mandatory"
  );
}

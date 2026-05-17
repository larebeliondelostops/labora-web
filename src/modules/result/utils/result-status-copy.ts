import type {
  FinalViabilityLevel,
  RecommendedRoute,
  ResultAction,
  ResultStatus,
} from "@/src/modules/result/api/result.types";

export const viabilityCopy: Record<FinalViabilityLevel, string> = {
  high: "Viabilidad alta",
  medium: "Viabilidad media",
  low: "Viabilidad baja",
  incomplete: "Informacion incompleta",
  not_applicable: "No aplica",
};

export const resultStatusCopy: Record<ResultStatus, string> = {
  not_started: "Sin resultado",
  in_progress: "Analisis en proceso",
  completed: "Resultado completo",
  blocked: "Resultado bloqueado",
  requires_review: "Requiere revision",
  approved: "Resultado aprobado",
  rejected: "Resultado no aprobado",
  error: "Error tecnico",
};

export const routeTypeCopy: Record<RecommendedRoute["routeType"], string> = {
  no_action: "No hacer nada por ahora",
  collect_more_documents: "Reunir mas soportes",
  administrative_claim: "Presentar reclamacion administrativa",
  reliquidation_request: "Solicitar reliquidacion",
  petition_right: "Generar derecho de peticion",
  legal_claim_draft: "Generar borrador de demanda",
  professional_review: "Solicitar revision profesional",
  low_viability: "Ruta de baja viabilidad",
  incomplete_case: "Completar expediente",
};

export const actionEventByType: Record<ResultAction["type"], string> = {
  generate_report: "result_generate_report_clicked",
  generate_executive_summary: "result_generate_report_clicked",
  generate_legal_action: "result_generate_legal_action_clicked",
  upload_missing_documents: "result_missing_document_upload_clicked",
  request_professional_review: "result_professional_review_clicked",
  go_to_payment: "result_cta_clicked",
  retry_analysis: "result_cta_clicked",
};

export const reportSectionOrder = [
  "cover",
  "executive_summary",
  "case_context",
  "relevant_facts",
  "labor_timeline",
  "applicable_regime",
  "applied_rules",
  "calculation_summary",
  "calculation_detail",
  "inconsistency_matrix",
  "conclusions",
  "recommended_route",
  "missing_documents",
  "evidence_index",
  "warnings_scope",
  "traceability_seal",
];

export const reportSectionTitles: Record<string, string> = {
  cover: "Portada",
  executive_summary: "Resumen ejecutivo",
  case_context: "Contexto del caso",
  relevant_facts: "Hechos relevantes",
  labor_timeline: "Cronologia laboral",
  applicable_regime: "Regimen aplicable",
  applied_rules: "Reglas aplicadas",
  calculation_summary: "Resumen de calculo",
  calculation_detail: "Detalle de calculo",
  inconsistency_matrix: "Matriz de inconsistencias",
  conclusions: "Conclusiones",
  recommended_route: "Ruta recomendada",
  missing_documents: "Documentos faltantes",
  evidence_index: "Indice de evidencias",
  warnings_scope: "Advertencias y alcance",
  traceability_seal: "Sello de trazabilidad",
};

export function getSectionOrder(sectionKey: string, fallbackIndex = 999) {
  const index = reportSectionOrder.indexOf(sectionKey);
  return index >= 0 ? index : fallbackIndex;
}

export function getSectionTitle(sectionKey: string) {
  return reportSectionTitles[sectionKey] || sectionKey.replaceAll("_", " ");
}

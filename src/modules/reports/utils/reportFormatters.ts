import type { ReportType } from "@/src/modules/reports/api/reports.types";

export const reportTypeLabels: Record<ReportType, string> = {
  executive: "Informe ejecutivo",
  technical: "Informe tecnico",
  calculation: "Informe de calculo",
  inconsistency_matrix: "Matriz de inconsistencias",
  full: "Informe completo",
};

export const reportTypeDescriptions: Record<ReportType, string> = {
  executive: "Lectura clara para entender hallazgos, viabilidad y siguientes pasos.",
  technical: "Estructura juridica verificable con hechos, reglas, soportes y conclusiones.",
  calculation: "Escenarios, diferencias estimadas, variables, supuestos y limitaciones.",
  inconsistency_matrix: "Tabla accionable de inconsistencias, confianza, impacto y evidencia.",
  full: "Documento completo con secciones, trazabilidad, evidencias y advertencias.",
};

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "Sin fecha";
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

export function formatPercent(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Sin dato";
  }

  const normalized = value > 1 ? value : value * 100;
  return `${Math.round(normalized)}%`;
}

export function formatCOP(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Sin dato";
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatReportType(reportType: string) {
  return reportType in reportTypeLabels
    ? reportTypeLabels[reportType as ReportType]
    : "Informe";
}

import type {
  AdminCaseDetail,
  AdminDashboardSummary,
  AdminDocument,
  AdminUserOption,
  AuditEvent,
  CalculationReview,
  CaseQueueItem,
  ExtractionSummary,
  LegalAnalysisReview,
  LegalDraftReview,
  ReportReview,
} from "@/src/modules/admin/api/admin.types";

const now = new Date("2026-05-19T13:30:00.000Z").toISOString();

export const adminUsersMock: AdminUserOption[] = [
  { id: "u-admin", name: "Ana Serrano", role: "Coordinacion admin" },
  { id: "u-doc", name: "Camilo Rojas", role: "Revisor documental" },
  { id: "u-legal", name: "Laura Medina", role: "Revisora juridica" },
  { id: "u-calc", name: "Mateo Giraldo", role: "Revisor de calculo" },
  { id: "u-support", name: "Sofia Parra", role: "Soporte" },
];

export const caseQueueMock: CaseQueueItem[] = [
  {
    caseId: "case-1001",
    caseNumber: "LAB-2026-1001",
    holderName: "Jose Herrera",
    holderEmail: "jherrera@example.com",
    documentNumberMasked: "CC ***4321",
    currentStage: "Revision documental",
    adminStatus: "requires_review",
    priority: "urgent",
    assignedTo: { id: "u-doc", name: "Camilo Rojas" },
    paymentStatus: "pendiente",
    documentStatus: "OCR con alertas",
    analysisStatus: "bloqueado",
    hasLowConfidenceAi: true,
    hasBlockingIssue: true,
    slaDueAt: "2026-05-19T21:00:00.000Z",
    lastActivityAt: now,
  },
  {
    caseId: "case-1002",
    caseNumber: "LAB-2026-1002",
    holderName: "Maria Fernanda Lopez",
    holderEmail: "mflopez@example.com",
    documentNumberMasked: "CC ***1188",
    currentStage: "Consola juridica",
    adminStatus: "in_progress",
    priority: "high",
    assignedTo: { id: "u-legal", name: "Laura Medina" },
    paymentStatus: "confirmado",
    documentStatus: "validado",
    analysisStatus: "requiere revision",
    hasLowConfidenceAi: true,
    hasBlockingIssue: false,
    slaDueAt: "2026-05-20T17:00:00.000Z",
    lastActivityAt: "2026-05-19T12:10:00.000Z",
  },
  {
    caseId: "case-1003",
    caseNumber: "LAB-2026-1003",
    holderName: "Oscar Valencia",
    holderEmail: "ovalencia@example.com",
    documentNumberMasked: "CC ***8890",
    currentStage: "Calculo",
    adminStatus: "in_progress",
    priority: "normal",
    assignedTo: { id: "u-calc", name: "Mateo Giraldo" },
    paymentStatus: "confirmado",
    documentStatus: "validado",
    analysisStatus: "listo para calculo",
    hasLowConfidenceAi: false,
    hasBlockingIssue: false,
    slaDueAt: "2026-05-22T20:00:00.000Z",
    lastActivityAt: "2026-05-19T10:40:00.000Z",
  },
  {
    caseId: "case-1004",
    caseNumber: "LAB-2026-1004",
    holderName: "Paula Restrepo",
    holderEmail: "prestrepo@example.com",
    documentNumberMasked: "CC ***6720",
    currentStage: "Informe final",
    adminStatus: "completed",
    priority: "low",
    assignedTo: null,
    paymentStatus: "desbloqueo admin",
    documentStatus: "validado",
    analysisStatus: "aprobado",
    hasLowConfidenceAi: false,
    hasBlockingIssue: false,
    slaDueAt: null,
    lastActivityAt: "2026-05-18T22:20:00.000Z",
  },
];

const auditPreview: AuditEvent[] = [
  {
    id: "audit-1",
    occurredAt: "2026-05-19T12:42:00.000Z",
    actor: "Camilo Rojas",
    actorRole: "Revisor documental",
    action: "Marco documento con observaciones",
    entity: "Documento historia laboral",
    previousState: "ocr_pending",
    newState: "valid_with_observations",
    ip: "181.48.***.12",
    metadataSummary: "Calidad OCR 71%, pagina 4 requiere contraste.",
  },
  {
    id: "audit-2",
    occurredAt: "2026-05-19T11:18:00.000Z",
    actor: "Labora IA",
    actorRole: "Sistema",
    action: "Genero alerta de baja confianza",
    entity: "Extraccion semanas cotizadas",
    previousState: null,
    newState: "requires_review",
    ip: null,
    metadataSummary: "Semanas 1997-1999 con lectura parcial.",
  },
];

export const caseDetailMock: AdminCaseDetail = {
  caseId: "case-1001",
  caseNumber: "LAB-2026-1001",
  holder: {
    name: "Jose Herrera",
    documentType: "CC",
    documentNumberMasked: "***4321",
    email: "jherrera@example.com",
    phoneMasked: "***2048",
  },
  currentStage: "Revision documental",
  adminStatus: "requires_review",
  priority: "urgent",
  createdAt: "2026-05-17T15:12:00.000Z",
  lastActivityAt: now,
  payment: {
    status: "pendiente",
    fullAnalysisUnlocked: false,
    paidAt: null,
  },
  documentsSummary: {
    total: 5,
    valid: 2,
    warnings: 2,
    invalid: 1,
  },
  analysisSummary: {
    status: "requiere revision humana",
    viability: "posible inconsistencia en semanas",
    mainFinding: "El periodo 1997-1999 aparece incompleto frente a aportes reportados.",
    confidenceScore: 0.64,
  },
  assignments: [
    {
      id: "as-1",
      userId: "u-doc",
      userName: "Camilo Rojas",
      role: "Revisor documental",
      type: "documental",
      assignedAt: "2026-05-18T14:15:00.000Z",
    },
  ],
  internalNotes: [
    {
      id: "note-1",
      noteType: "Riesgo documental",
      visibility: "internal",
      body: "El certificado del empleador antiguo no coincide con la historia laboral. No exponer esta nota al usuario.",
      author: {
        id: "u-doc",
        name: "Camilo Rojas",
        role: "Revisor documental",
      },
      createdAt: "2026-05-19T09:40:00.000Z",
      relatedEntity: "documents",
    },
  ],
  aiAlerts: [
    {
      id: "alert-1",
      source: "OCR historia laboral",
      severity: "critical",
      confidenceScore: 0.52,
      title: "Lectura parcial en periodos antiguos",
      description: "La IA no pudo confirmar semanas cotizadas entre 1997 y 1999 con suficiente confianza.",
      recommendation: "Validar contra documento fuente y solicitar soporte si no hay evidencia legible.",
      resolved: false,
      createdAt: "2026-05-19T11:18:00.000Z",
    },
    {
      id: "alert-2",
      source: "Regla juridica",
      severity: "medium",
      confidenceScore: 0.72,
      title: "Posible transicion pensional",
      description: "Se detectan fechas que podrian activar analisis de regimen de transicion.",
      recommendation: "Confirmar edad y semanas a la fecha de corte.",
      resolved: false,
      createdAt: "2026-05-19T10:32:00.000Z",
    },
  ],
  auditPreview,
  nextActions: [
    "Corregir semanas 1997-1999",
    "Resolver alerta OCR critica",
    "Solicitar soporte del empleador si la fuente no es suficiente",
  ],
};

export const dashboardMock: AdminDashboardSummary = {
  metrics: [
    { label: "Expedientes abiertos", value: 48, delta: "+8 esta semana", tone: "green" },
    { label: "Requieren revision", value: 17, delta: "6 criticos", tone: "amber" },
    { label: "Bloqueados", value: 5, delta: "2 por documentos", tone: "red" },
    { label: "Listos para entrega", value: 9, delta: "3 con pago confirmado", tone: "blue" },
    { label: "Alertas IA baja confianza", value: 12, delta: "4 criticas", tone: "red" },
  ],
  casesByStage: [
    { stage: "documents", label: "Documentos", total: 14, blocked: 3 },
    { stage: "extraction", label: "Extraccion", total: 9, blocked: 1 },
    { stage: "legal", label: "Juridico", total: 11, blocked: 1 },
    { stage: "calculation", label: "Calculo", total: 7, blocked: 0 },
    { stage: "reports", label: "Informes", total: 7, blocked: 0 },
  ],
  reviewQueue: [
    { id: "q-1", label: "Revision documental", count: 8, href: "/admin/cases?documentStatus=requires_review", tone: "amber" },
    { id: "q-2", label: "Revision juridica", count: 5, href: "/admin/tasks", tone: "blue" },
    { id: "q-3", label: "Calculos pendientes", count: 4, href: "/admin/tasks", tone: "green" },
    { id: "q-4", label: "Informes por aprobar", count: 6, href: "/admin/tasks", tone: "red" },
  ],
  slaAlerts: [
    {
      id: "sla-1",
      caseId: "case-1001",
      caseNumber: "LAB-2026-1001",
      title: "Revision documental vence hoy",
      dueAt: "2026-05-19T21:00:00.000Z",
      severity: "critical",
    },
    {
      id: "sla-2",
      caseId: "case-1002",
      caseNumber: "LAB-2026-1002",
      title: "Validacion juridica en 24 horas",
      dueAt: "2026-05-20T17:00:00.000Z",
      severity: "warning",
    },
  ],
  lowConfidenceAlerts: caseDetailMock.aiAlerts,
  recentActivity: [
    {
      id: "act-1",
      caseId: "case-1001",
      caseNumber: "LAB-2026-1001",
      actor: "Camilo Rojas",
      action: "agrego una observacion documental",
      occurredAt: "2026-05-19T12:42:00.000Z",
    },
    {
      id: "act-2",
      caseId: "case-1002",
      caseNumber: "LAB-2026-1002",
      actor: "Laura Medina",
      action: "devolvio el analisis juridico",
      occurredAt: "2026-05-19T12:10:00.000Z",
    },
  ],
};

export const documentsMock: AdminDocument[] = [
  {
    id: "doc-1",
    caseId: "case-1001",
    name: "Historia laboral Colpensiones.pdf",
    type: "Historia laboral",
    status: "valid_with_observations",
    uploadedAt: "2026-05-18T15:20:00.000Z",
    pages: 11,
    qualityScore: 0.78,
    ocrConfidence: 0.71,
    sourceUrl: null,
    ocrText: "Periodo 1997-01 a 1999-12 con lectura parcial. Empleador: Textiles Andinos.",
    observations: ["Pagina 4 con contraste bajo", "Verificar semanas de 1998"],
  },
  {
    id: "doc-2",
    caseId: "case-1001",
    name: "Cedula titular.pdf",
    type: "Identidad",
    status: "valid",
    uploadedAt: "2026-05-18T15:26:00.000Z",
    pages: 1,
    qualityScore: 0.96,
    ocrConfidence: 0.94,
    sourceUrl: null,
    ocrText: "Documento de identidad legible. Datos coinciden con titular.",
    observations: [],
  },
  {
    id: "doc-3",
    caseId: "case-1001",
    name: "Certificado empleador antiguo.jpg",
    type: "Soporte laboral",
    status: "requires_reload",
    uploadedAt: "2026-05-18T16:01:00.000Z",
    pages: 2,
    qualityScore: 0.42,
    ocrConfidence: 0.38,
    sourceUrl: null,
    ocrText: "Texto ilegible en sello y fecha de retiro.",
    observations: ["Solicitar nueva carga en PDF o foto con mejor luz"],
  },
];

export const extractionMock: ExtractionSummary = {
  confidenceScore: 0.68,
  issues: [
    "Salarios 1998-03 y 1998-04 tienen fuente de baja confianza.",
    "Existe vacio de cotizacion entre 1999-02 y 1999-05.",
  ],
  items: [
    {
      id: "ext-1",
      group: "periods",
      field: "Periodo trabajado",
      value: "1997-01 a 1999-12",
      confidence: 0.62,
      source: "ocr",
      documentName: "Historia laboral Colpensiones.pdf",
      page: 4,
      affectsCalculation: true,
    },
    {
      id: "ext-2",
      group: "employers",
      field: "Empleador",
      value: "Textiles Andinos Ltda",
      confidence: 0.74,
      source: "document",
      documentName: "Certificado empleador antiguo.jpg",
      page: 1,
      affectsCalculation: false,
    },
    {
      id: "ext-3",
      group: "weeks",
      field: "Semanas cotizadas",
      value: "103.4",
      confidence: 0.57,
      source: "ocr",
      documentName: "Historia laboral Colpensiones.pdf",
      page: 5,
      affectsCalculation: true,
    },
    {
      id: "ext-4",
      group: "salaries",
      field: "IBC promedio",
      value: "$1.420.000",
      confidence: 0.81,
      source: "page",
      documentName: "Historia laboral Colpensiones.pdf",
      page: 8,
      affectsCalculation: true,
    },
  ],
};

export const legalAnalysisMock: LegalAnalysisReview = {
  classification: "Reliquidacion / semanas omitidas",
  route: "Reclamacion administrativa previa",
  detectedRegime: "Prima media",
  specialSignals: ["Posible regimen de transicion", "Empleador privado", "Historia laboral con vacios"],
  preliminaryConclusion:
    "Hay indicios de semanas no reconocidas que pueden afectar el analisis pensional.",
  fullConclusion:
    "La conclusion completa queda bloqueada para entrega al usuario hasta confirmar pago o desbloqueo administrativo autorizado.",
  confidenceScore: 0.66,
  rules: [
    {
      id: "rule-1",
      title: "Historia laboral con inconsistencia verificable",
      description: "La diferencia entre soporte del empleador y semanas reportadas supera el umbral operativo.",
      source: "rule",
      confidence: 0.88,
      status: "triggered",
    },
    {
      id: "rule-2",
      title: "Transicion pensional",
      description: "La IA sugiere revisar fecha de corte, pero faltan soportes completos.",
      source: "ai",
      confidence: 0.61,
      status: "triggered",
    },
    {
      id: "rule-3",
      title: "Servidor publico",
      description: "No se encontraron senales suficientes en los documentos aportados.",
      source: "rule",
      confidence: 0.91,
      status: "discarded",
    },
  ],
  findings: [
    "El soporte laboral antiguo indica relacion activa en meses no reconocidos.",
    "La fuente principal no permite validar todos los periodos por baja calidad.",
  ],
  normativeSources: [
    "Ley 100 de 1993",
    "Decreto 758 de 1990",
    "Jurisprudencia sobre deber de custodia de historia laboral",
  ],
  aiSummary:
    "Resumen IA: probable omision de semanas antiguas. Requiere validacion humana antes de aprobar.",
  alerts: caseDetailMock.aiAlerts,
};

export const calculationsMock: CalculationReview = {
  confidenceScore: 0.73,
  scenarios: [
    {
      id: "sc-1",
      label: "Escenario reconocido por entidad",
      value: "1.214 semanas",
      detail: "Base de historia laboral cargada por el usuario.",
      tone: "gray",
    },
    {
      id: "sc-2",
      label: "Escenario correcto estimado",
      value: "1.318 semanas",
      detail: "Incluye periodos pendientes de validacion.",
      tone: "green",
    },
    {
      id: "sc-3",
      label: "Diferencia economica estimada",
      value: "$286.000 / mes",
      detail: "Sujeta a validacion de IBC.",
      tone: "amber",
    },
    {
      id: "sc-4",
      label: "Retroactivo aproximado",
      value: "$18.4M",
      detail: "Estimacion preliminar no entregable sin pago.",
      tone: "blue",
    },
  ],
  variables: [
    { name: "Semanas reconocidas", value: "1.214", source: "Historia laboral" },
    { name: "Semanas estimadas", value: "1.318", source: "OCR + correccion admin" },
    { name: "IBC base", value: "$1.420.000", source: "Extraccion salario" },
  ],
  includedPeriods: ["1997-01 a 1999-12", "2001-03 a 2004-08"],
  excludedPeriods: ["1999-02 a 1999-05 por soporte ilegible"],
  assumptions: ["Se usa IBC promedio cuando el soporte mensual no es legible."],
  warnings: ["El calculo debe recalcularse si se corrige la extraccion de semanas."],
};

export const reportsMock: ReportReview = {
  reports: [
    {
      id: "rep-1",
      title: "Informe ejecutivo",
      type: "executive",
      version: 2,
      status: "requires_review",
      approvedBy: null,
      approvedAt: null,
      paymentRequired: false,
      diffSummary: "Se agrego advertencia sobre soporte laboral antiguo.",
      preview:
        "Resumen ejecutivo con hallazgos preliminares, alertas de confianza y siguiente accion recomendada.",
    },
    {
      id: "rep-2",
      title: "Informe completo tecnico-juridico",
      type: "full",
      version: 1,
      status: "draft",
      approvedBy: null,
      approvedAt: null,
      paymentRequired: true,
      diffSummary: null,
      preview:
        "Analisis completo con calculo, fundamentos y estrategia. Bloqueado para entrega hasta confirmar pago.",
    },
  ],
};

export const legalDraftsMock: LegalDraftReview = {
  drafts: [
    {
      id: "draft-1",
      title: "Derecho de peticion a Colpensiones",
      type: "petition",
      status: "requires_review",
      version: 3,
      updatedAt: "2026-05-19T08:50:00.000Z",
      checklist: [
        { label: "Partes identificadas", passed: true },
        { label: "Hechos coherentes", passed: true },
        { label: "Pretensiones soportadas", passed: true },
        { label: "Calculo consistente", passed: false },
        { label: "Anexos mencionados", passed: true },
        { label: "Competencia revisada", passed: true },
        { label: "Datos pendientes marcados", passed: false },
        { label: "Revision profesional recomendada", passed: true },
      ],
      preview:
        "Solicitud de correccion de historia laboral y reconocimiento de semanas omitidas con anexos.",
    },
    {
      id: "draft-2",
      title: "Reclamacion administrativa",
      type: "administrative_claim",
      status: "needs_professional_review",
      version: 1,
      updatedAt: "2026-05-18T19:20:00.000Z",
      checklist: [
        { label: "Partes identificadas", passed: true },
        { label: "Hechos coherentes", passed: false },
        { label: "Pretensiones soportadas", passed: true },
        { label: "Calculo consistente", passed: false },
        { label: "Anexos mencionados", passed: true },
        { label: "Competencia revisada", passed: false },
        { label: "Datos pendientes marcados", passed: true },
        { label: "Revision profesional recomendada", passed: true },
      ],
      preview:
        "Borrador de reclamacion con asuntos pendientes de coherencia y competencia.",
    },
  ],
};

export const auditMock: AuditEvent[] = [
  ...auditPreview,
  {
    id: "audit-3",
    occurredAt: "2026-05-18T15:26:00.000Z",
    actor: "Jose Herrera",
    actorRole: "Usuario",
    action: "Cargo documento",
    entity: "Cedula titular.pdf",
    previousState: null,
    newState: "uploaded",
    ip: "181.48.***.12",
    metadataSummary: "Archivo PDF, 1 pagina.",
  },
  {
    id: "audit-4",
    occurredAt: "2026-05-18T14:15:00.000Z",
    actor: "Ana Serrano",
    actorRole: "Coordinacion admin",
    action: "Asigno expediente",
    entity: "LAB-2026-1001",
    previousState: "sin asignar",
    newState: "Camilo Rojas",
    ip: "190.85.***.44",
    metadataSummary: "Asignacion documental por SLA proximo.",
  },
];

export function getMockCaseDetail(caseId: string): AdminCaseDetail {
  const queueCase = caseQueueMock.find((item) => item.caseId === caseId);

  if (!queueCase) {
    return { ...caseDetailMock, caseId };
  }

  return {
    ...caseDetailMock,
    caseId,
    caseNumber: queueCase.caseNumber,
    holder: {
      ...caseDetailMock.holder,
      name: queueCase.holderName,
      email: queueCase.holderEmail || caseDetailMock.holder.email,
      documentNumberMasked:
        queueCase.documentNumberMasked || caseDetailMock.holder.documentNumberMasked,
    },
    currentStage: queueCase.currentStage,
    adminStatus: queueCase.adminStatus,
    priority: queueCase.priority,
    payment: {
      ...caseDetailMock.payment,
      status: queueCase.paymentStatus || caseDetailMock.payment.status,
      fullAnalysisUnlocked:
        queueCase.paymentStatus === "confirmado" ||
        queueCase.paymentStatus === "desbloqueo admin",
      paidAt: queueCase.paymentStatus === "confirmado" ? "2026-05-18T21:00:00.000Z" : null,
    },
  };
}

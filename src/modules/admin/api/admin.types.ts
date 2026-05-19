export type AdminStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "requires_review"
  | "error";

export type CasePriority = "low" | "normal" | "high" | "urgent";

export type AiSeverity = "low" | "medium" | "high" | "critical";

export type AdminPermission =
  | "admin.dashboard.read"
  | "admin.cases.read"
  | "admin.cases.assign"
  | "admin.cases.status"
  | "admin.notes.create"
  | "admin.documents.review"
  | "admin.extraction.edit"
  | "admin.legal.review"
  | "admin.calculations.review"
  | "admin.reports.review"
  | "admin.drafts.review"
  | "admin.audit.read"
  | "admin.settings.manage";

export type AdminAssignment = {
  id: string;
  userId: string;
  userName: string;
  role: string;
  type: "owner" | "documental" | "legal" | "calculation" | "support";
  assignedAt: string;
};

export type InternalNote = {
  id: string;
  noteType: string;
  visibility: "internal" | "publishable" | "published_to_user";
  body: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  relatedEntity?: string | null;
};

export type AiAlert = {
  id: string;
  source: string;
  severity: AiSeverity;
  confidenceScore?: number | null;
  title: string;
  description: string;
  recommendation?: string | null;
  resolved: boolean;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  occurredAt: string;
  actor: string;
  actorRole: string;
  action: string;
  entity: string;
  previousState?: string | null;
  newState?: string | null;
  ip?: string | null;
  metadataSummary?: string | null;
};

export type CaseQueueItem = {
  caseId: string;
  caseNumber: string;
  holderName: string;
  holderEmail?: string | null;
  documentNumberMasked?: string | null;
  currentStage: string;
  adminStatus: AdminStatus;
  priority: CasePriority;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  paymentStatus?: string | null;
  documentStatus?: string | null;
  analysisStatus?: string | null;
  hasLowConfidenceAi: boolean;
  hasBlockingIssue: boolean;
  slaDueAt?: string | null;
  lastActivityAt?: string | null;
};

export type CaseQueueResponse = {
  items: CaseQueueItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type AdminCaseFilters = {
  query?: string;
  adminStatus?: string;
  stage?: string;
  priority?: string;
  assignment?: "mine" | "unassigned" | "all";
  paymentStatus?: string;
  documentStatus?: string;
  lowConfidenceAi?: boolean;
  blocked?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type AdminCaseDetail = {
  caseId: string;
  caseNumber: string;
  holder: {
    name: string;
    documentType?: string;
    documentNumberMasked?: string;
    email?: string;
    phoneMasked?: string;
  };
  currentStage: string;
  adminStatus: AdminStatus;
  priority: CasePriority;
  createdAt: string;
  lastActivityAt: string;
  payment: {
    status: string;
    fullAnalysisUnlocked: boolean;
    paidAt?: string | null;
  };
  documentsSummary: {
    total: number;
    valid: number;
    warnings: number;
    invalid: number;
  };
  analysisSummary?: {
    status: string;
    viability?: string;
    mainFinding?: string;
    confidenceScore?: number;
  };
  assignments: AdminAssignment[];
  internalNotes: InternalNote[];
  aiAlerts: AiAlert[];
  auditPreview: AuditEvent[];
  nextActions: string[];
};

export type DashboardMetric = {
  label: string;
  value: number;
  delta?: string;
  tone: "green" | "amber" | "red" | "blue" | "gray";
};

export type StageSummary = {
  stage: string;
  label: string;
  total: number;
  blocked: number;
};

export type ReviewQueueItem = {
  id: string;
  label: string;
  count: number;
  href: string;
  tone: "green" | "amber" | "red" | "blue" | "gray";
};

export type SlaAlert = {
  id: string;
  caseId: string;
  caseNumber: string;
  title: string;
  dueAt: string;
  severity: "warning" | "critical";
};

export type RecentActivity = {
  id: string;
  caseId: string;
  caseNumber: string;
  actor: string;
  action: string;
  occurredAt: string;
};

export type AdminDashboardSummary = {
  metrics: DashboardMetric[];
  casesByStage: StageSummary[];
  reviewQueue: ReviewQueueItem[];
  slaAlerts: SlaAlert[];
  lowConfidenceAlerts: AiAlert[];
  recentActivity: RecentActivity[];
};

export type AdminDocument = {
  id: string;
  caseId: string;
  name: string;
  type: string;
  status:
    | "missing"
    | "ocr_pending"
    | "ocr_failed"
    | "illegible"
    | "valid"
    | "requires_reload"
    | "valid_with_observations";
  uploadedAt?: string | null;
  pages?: number;
  qualityScore?: number | null;
  ocrConfidence?: number | null;
  ocrText?: string | null;
  sourceUrl?: string | null;
  observations?: string[];
};

export type DocumentReviewPayload = {
  decision: "valid" | "valid_with_observations" | "reload" | "additional_support";
  observations: string;
  requiresReload: boolean;
  requiresAdditionalSupport: boolean;
  requestedDocuments: string;
  blocksCase: boolean;
};

export type ExtractionItem = {
  id: string;
  group:
    | "periods"
    | "employers"
    | "weeks"
    | "salaries"
    | "novelties"
    | "gaps"
    | "inconsistencies";
  field: string;
  value: string;
  confidence: number;
  source: "document" | "page" | "ocr" | "user" | "admin";
  documentName: string;
  page?: number;
  affectsCalculation: boolean;
};

export type ExtractionCorrectionPayload = {
  itemId: string;
  newValue: string;
  source: string;
  reason: string;
};

export type ExtractionSummary = {
  confidenceScore: number;
  items: ExtractionItem[];
  issues: string[];
};

export type LegalRule = {
  id: string;
  title: string;
  description: string;
  source: "rule" | "ai";
  confidence?: number | null;
  status: "triggered" | "discarded";
};

export type LegalAnalysisReview = {
  classification: string;
  route: string;
  detectedRegime: string;
  specialSignals: string[];
  preliminaryConclusion: string;
  fullConclusion?: string | null;
  confidenceScore: number;
  rules: LegalRule[];
  findings: string[];
  normativeSources: string[];
  aiSummary: string;
  alerts: AiAlert[];
};

export type CalculationScenario = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "green" | "amber" | "red" | "blue" | "gray";
};

export type CalculationReview = {
  confidenceScore: number;
  scenarios: CalculationScenario[];
  variables: Array<{ name: string; value: string; source: string }>;
  includedPeriods: string[];
  excludedPeriods: string[];
  assumptions: string[];
  warnings: string[];
};

export type ReportReview = {
  reports: Array<{
    id: string;
    title: string;
    type: "executive" | "technical" | "full";
    version: number;
    status: "draft" | "requires_review" | "approved" | "visible_to_user";
    approvedBy?: string | null;
    approvedAt?: string | null;
    paymentRequired: boolean;
    diffSummary?: string | null;
    preview: string;
  }>;
};

export type LegalDraftReview = {
  drafts: Array<{
    id: string;
    title: string;
    type: string;
    status: "draft" | "requires_review" | "approved" | "needs_professional_review";
    version: number;
    checklist: Array<{ label: string; passed: boolean }>;
    preview: string;
    updatedAt: string;
  }>;
};

export type AdminUserOption = {
  id: string;
  name: string;
  role: string;
};

export type AdminMutationResult = {
  ok: boolean;
  message: string;
};

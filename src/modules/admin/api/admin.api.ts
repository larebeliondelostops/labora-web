import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import {
  adminUsersMock,
  auditMock,
  calculationsMock,
  caseQueueMock,
  dashboardMock,
  documentsMock,
  extractionMock,
  getMockCaseDetail,
  legalAnalysisMock,
  legalDraftsMock,
  reportsMock,
} from "@/src/modules/admin/api/admin.mock";
import type {
  AdminCaseDetail,
  AdminCaseFilters,
  AdminDashboardSummary,
  AdminDocument,
  AdminMutationResult,
  AdminUserOption,
  AuditEvent,
  CalculationReview,
  CaseQueueItem,
  CaseQueueResponse,
  DocumentReviewPayload,
  ExtractionCorrectionPayload,
  ExtractionSummary,
  LegalAnalysisReview,
  LegalDraftReview,
  ReportReview,
} from "@/src/modules/admin/api/admin.types";

type ListEnvelope<T> =
  | T[]
  | {
      items?: T[];
      data?: T[];
      results?: T[];
      total?: number;
      page?: number;
      pageSize?: number;
      limit?: number;
      pagination?: {
        total?: number;
        page?: number;
        pageSize?: number;
        limit?: number;
      };
    };

function shouldUseMock(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function getItems<T>(response: ListEnvelope<T> | ApiEnvelope<ListEnvelope<T>>): T[] {
  const data = unwrapApiData(response);

  if (Array.isArray(data)) {
    return data;
  }

  return data.items || data.data || data.results || [];
}

function getPagination<T>(
  response: ListEnvelope<T> | ApiEnvelope<ListEnvelope<T>>,
  fallbackTotal: number,
) {
  const data = unwrapApiData(response);

  if (Array.isArray(data)) {
    return {
      page: 1,
      pageSize: data.length || 20,
      total: data.length,
    };
  }

  return {
    page: data.pagination?.page || data.page || 1,
    pageSize: data.pagination?.pageSize || data.pagination?.limit || data.pageSize || data.limit || 20,
    total: data.pagination?.total || data.total || fallbackTotal,
  };
}

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "" || value === "all") {
      return;
    }

    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

function applyMockFilters(items: CaseQueueItem[], filters: AdminCaseFilters) {
  const query = filters.query?.trim().toLowerCase();

  return items.filter((item) => {
    if (
      query &&
      ![
        item.caseNumber,
        item.holderName,
        item.holderEmail || "",
        item.documentNumberMasked || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (filters.adminStatus && filters.adminStatus !== "all" && item.adminStatus !== filters.adminStatus) {
      return false;
    }

    if (filters.priority && filters.priority !== "all" && item.priority !== filters.priority) {
      return false;
    }

    if (filters.stage && filters.stage !== "all" && !item.currentStage.toLowerCase().includes(filters.stage.toLowerCase())) {
      return false;
    }

    if (filters.paymentStatus && filters.paymentStatus !== "all" && item.paymentStatus !== filters.paymentStatus) {
      return false;
    }

    if (filters.documentStatus && filters.documentStatus !== "all" && item.documentStatus !== filters.documentStatus) {
      return false;
    }

    if (filters.assignment === "unassigned" && item.assignedTo) {
      return false;
    }

    if (filters.lowConfidenceAi && !item.hasLowConfidenceAi) {
      return false;
    }

    if (filters.blocked && !item.hasBlockingIssue) {
      return false;
    }

    return true;
  });
}

async function mutationOrMock(
  request: () => Promise<AdminMutationResult | ApiEnvelope<AdminMutationResult>>,
  message: string,
): Promise<AdminMutationResult> {
  try {
    return unwrapApiData(await request()) || {
      ok: true,
      message,
    };
  } catch (error) {
    if (shouldUseMock(error)) {
      return {
        ok: true,
        message,
      };
    }

    throw error;
  }
}

export function getAdminErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      ADMIN_PERMISSION_DENIED: "No tienes permisos para realizar esta accion.",
      CASE_NOT_FOUND: "No encontramos este expediente. Puede haber sido cerrado o eliminado.",
      INVALID_STATUS_TRANSITION: "Este cambio de estado no esta permitido.",
      BLOCKING_ALERTS_OPEN: "Hay alertas bloqueantes sin resolver. Revisalas antes de aprobar.",
      PAYMENT_REQUIRED_FOR_FULL_DELIVERY:
        "El analisis completo requiere pago confirmado antes de entrega.",
      CORRECTION_REQUIRES_REASON: "Debes indicar el motivo de la correccion.",
      TEMPORARY_PROCESSING_ERROR: "Hubo un fallo temporal. Intenta de nuevo.",
    };

    if (error.status === 401) {
      return "Tu sesion expiro. Inicia sesion para continuar.";
    }

    if (error.status === 403) {
      return "No tienes permisos para realizar esta accion.";
    }

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intenta de nuevo.";
}

export const adminDashboardApi = {
  async getSummary(): Promise<AdminDashboardSummary> {
    try {
      const response = await apiFetch<AdminDashboardSummary | ApiEnvelope<AdminDashboardSummary>>(
        "/admin/dashboard/summary",
      );
      return unwrapApiData(response);
    } catch (error) {
      if (shouldUseMock(error)) {
        return dashboardMock;
      }

      throw error;
    }
  },
};

export const adminCasesApi = {
  async getCases(filters: AdminCaseFilters = {}): Promise<CaseQueueResponse> {
    const query = buildQuery({
      q: filters.query,
      adminStatus: filters.adminStatus,
      stage: filters.stage,
      priority: filters.priority,
      assignment: filters.assignment,
      paymentStatus: filters.paymentStatus,
      documentStatus: filters.documentStatus,
      lowConfidenceAi: filters.lowConfidenceAi,
      blocked: filters.blocked,
      from: filters.from,
      to: filters.to,
      page: filters.page || 1,
      pageSize: filters.pageSize || 20,
    });

    try {
      const response = await apiFetch<ListEnvelope<CaseQueueItem> | ApiEnvelope<ListEnvelope<CaseQueueItem>>>(
        `/admin/cases${query}`,
      );
      const items = getItems(response);

      return {
        items,
        pagination: getPagination(response, items.length),
      };
    } catch (error) {
      if (shouldUseMock(error)) {
        const items = applyMockFilters(caseQueueMock, filters);

        return {
          items,
          pagination: {
            page: filters.page || 1,
            pageSize: filters.pageSize || 20,
            total: items.length,
          },
        };
      }

      throw error;
    }
  },

  async getCase(caseId: string): Promise<AdminCaseDetail> {
    try {
      const response = await apiFetch<AdminCaseDetail | ApiEnvelope<AdminCaseDetail>>(
        `/admin/cases/${caseId}`,
      );
      return unwrapApiData(response);
    } catch (error) {
      if (shouldUseMock(error)) {
        return getMockCaseDetail(caseId);
      }

      throw error;
    }
  },

  async changeStatus(
    caseId: string,
    payload: { status: string; reason: string; blocksCase: boolean },
  ): Promise<AdminMutationResult> {
    return mutationOrMock(
      () =>
        apiFetch<AdminMutationResult | ApiEnvelope<AdminMutationResult>>(
          `/admin/cases/${caseId}/status`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        ),
      "Estado actualizado.",
    );
  },
};

export const adminAssignmentsApi = {
  async getUsers(): Promise<AdminUserOption[]> {
    try {
      const response = await apiFetch<ListEnvelope<AdminUserOption> | ApiEnvelope<ListEnvelope<AdminUserOption>>>(
        "/admin/users",
      );
      return getItems(response);
    } catch (error) {
      if (shouldUseMock(error)) {
        return adminUsersMock;
      }

      throw error;
    }
  },

  async assignCase(
    caseId: string,
    payload: { assigneeId: string; assignmentType: string; reason: string; priority?: string },
  ): Promise<AdminMutationResult> {
    return mutationOrMock(
      () =>
        apiFetch<AdminMutationResult | ApiEnvelope<AdminMutationResult>>(
          `/admin/cases/${caseId}/assign`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      "Expediente asignado.",
    );
  },
};

export const adminNotesApi = {
  async createNote(
    caseId: string,
    payload: {
      noteType: string;
      body: string;
      relatedEntity?: string;
      visibility: string;
    },
  ): Promise<AdminMutationResult> {
    return mutationOrMock(
      () =>
        apiFetch<AdminMutationResult | ApiEnvelope<AdminMutationResult>>(
          `/admin/cases/${caseId}/notes`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      "Nota interna creada.",
    );
  },
};

export const adminDocumentsApi = {
  async getDocuments(caseId: string): Promise<AdminDocument[]> {
    try {
      const response = await apiFetch<ListEnvelope<AdminDocument> | ApiEnvelope<ListEnvelope<AdminDocument>>>(
        `/admin/cases/${caseId}/documents`,
      );
      return getItems(response);
    } catch (error) {
      if (shouldUseMock(error)) {
        return documentsMock.map((document) => ({ ...document, caseId }));
      }

      throw error;
    }
  },

  async reviewDocument(
    caseId: string,
    documentId: string,
    payload: DocumentReviewPayload,
  ): Promise<AdminMutationResult> {
    return mutationOrMock(
      () =>
        apiFetch<AdminMutationResult | ApiEnvelope<AdminMutationResult>>(
          `/admin/cases/${caseId}/documents/${documentId}/review`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      "Revision documental guardada.",
    );
  },
};

export const adminExtractionApi = {
  async getExtraction(caseId: string): Promise<ExtractionSummary> {
    try {
      const response = await apiFetch<ExtractionSummary | ApiEnvelope<ExtractionSummary>>(
        `/admin/cases/${caseId}/extraction`,
      );
      return unwrapApiData(response);
    } catch (error) {
      if (shouldUseMock(error)) {
        return extractionMock;
      }

      throw error;
    }
  },

  async correctItem(
    caseId: string,
    payload: ExtractionCorrectionPayload,
  ): Promise<AdminMutationResult> {
    return mutationOrMock(
      () =>
        apiFetch<AdminMutationResult | ApiEnvelope<AdminMutationResult>>(
          `/admin/cases/${caseId}/extraction/items/${payload.itemId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        ),
      "Correccion guardada. La correccion puede disparar recalculo del caso.",
    );
  },
};

export const adminLegalAnalysisApi = {
  async getLegalAnalysis(caseId: string): Promise<LegalAnalysisReview> {
    try {
      const response = await apiFetch<LegalAnalysisReview | ApiEnvelope<LegalAnalysisReview>>(
        `/admin/cases/${caseId}/legal-analysis`,
      );
      return unwrapApiData(response);
    } catch (error) {
      if (shouldUseMock(error)) {
        return legalAnalysisMock;
      }

      throw error;
    }
  },

  async reviewLegalAnalysis(
    caseId: string,
    payload: { decision: string; comment: string; requiresHumanReview: boolean },
  ): Promise<AdminMutationResult> {
    return mutationOrMock(
      () =>
        apiFetch<AdminMutationResult | ApiEnvelope<AdminMutationResult>>(
          `/admin/cases/${caseId}/legal-analysis/review`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      "Revision juridica guardada.",
    );
  },
};

export const adminCalculationsApi = {
  async getCalculations(caseId: string): Promise<CalculationReview> {
    try {
      const response = await apiFetch<CalculationReview | ApiEnvelope<CalculationReview>>(
        `/admin/cases/${caseId}/calculations`,
      );
      return unwrapApiData(response);
    } catch (error) {
      if (shouldUseMock(error)) {
        return calculationsMock;
      }

      throw error;
    }
  },

  async reviewCalculations(
    caseId: string,
    payload: { decision: string; comment: string; blocking: boolean },
  ): Promise<AdminMutationResult> {
    return mutationOrMock(
      () =>
        apiFetch<AdminMutationResult | ApiEnvelope<AdminMutationResult>>(
          `/admin/cases/${caseId}/calculations/review`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      "Revision de calculo guardada.",
    );
  },
};

export const adminReportsApi = {
  async getReports(caseId: string): Promise<ReportReview> {
    try {
      const response = await apiFetch<ReportReview | ApiEnvelope<ReportReview>>(
        `/admin/cases/${caseId}/reports`,
      );
      return unwrapApiData(response);
    } catch (error) {
      if (shouldUseMock(error)) {
        return reportsMock;
      }

      throw error;
    }
  },

  async approveReport(
    caseId: string,
    reportId: string,
    payload: { comment: string; markVisibleToUser: boolean },
  ): Promise<AdminMutationResult> {
    return mutationOrMock(
      () =>
        apiFetch<AdminMutationResult | ApiEnvelope<AdminMutationResult>>(
          `/admin/cases/${caseId}/reports/${reportId}/approve`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      "Informe aprobado.",
    );
  },
};

export const adminLegalDraftsApi = {
  async getLegalDrafts(caseId: string): Promise<LegalDraftReview> {
    try {
      const response = await apiFetch<LegalDraftReview | ApiEnvelope<LegalDraftReview>>(
        `/admin/cases/${caseId}/legal-drafts`,
      );
      return unwrapApiData(response);
    } catch (error) {
      if (shouldUseMock(error)) {
        return legalDraftsMock;
      }

      throw error;
    }
  },

  async reviewLegalDraft(
    caseId: string,
    draftId: string,
    payload: { decision: string; comment: string; professionalReviewRequired: boolean },
  ): Promise<AdminMutationResult> {
    return mutationOrMock(
      () =>
        apiFetch<AdminMutationResult | ApiEnvelope<AdminMutationResult>>(
          `/admin/cases/${caseId}/legal-drafts/${draftId}/review`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        ),
      "Revision de escrito guardada.",
    );
  },
};

export const adminAuditApi = {
  async getAuditEvents(caseId: string): Promise<AuditEvent[]> {
    try {
      const response = await apiFetch<ListEnvelope<AuditEvent> | ApiEnvelope<ListEnvelope<AuditEvent>>>(
        `/admin/cases/${caseId}/audit-events`,
      );
      return getItems(response);
    } catch (error) {
      if (shouldUseMock(error)) {
        return auditMock;
      }

      throw error;
    }
  },
};

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  adminAssignmentsApi,
  adminAuditApi,
  adminCalculationsApi,
  adminCasesApi,
  adminDashboardApi,
  adminDocumentsApi,
  adminExtractionApi,
  adminLegalAnalysisApi,
  adminLegalDraftsApi,
  adminNotesApi,
  adminReportsApi,
  getAdminErrorMessage,
} from "@/src/modules/admin/api/admin.api";
import type {
  AdminCaseDetail,
  AdminCaseFilters,
  AdminDashboardSummary,
  AdminDocument,
  AdminMutationResult,
  AdminUserOption,
  AuditEvent,
  CalculationReview,
  CaseQueueResponse,
  DocumentReviewPayload,
  ExtractionCorrectionPayload,
  ExtractionSummary,
  LegalAnalysisReview,
  LegalDraftReview,
  ReportReview,
} from "@/src/modules/admin/api/admin.types";

type ResourceState<T> = {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type MutationState = {
  isLoading: boolean;
  error: string | null;
  lastResult: AdminMutationResult | null;
};

function useAdminResource<T>(
  loader: () => Promise<T>,
  enabled = true,
): ResourceState<T> & {
  refetch: () => Promise<T | null>;
  refresh: () => Promise<T | null>;
  setData: (value: T) => void;
} {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    isLoading: enabled,
    isRefreshing: false,
    error: null,
  });
  const inFlight = useRef(false);
  const dataRef = useRef<T | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!enabled || inFlight.current) {
        return dataRef.current;
      }

      inFlight.current = true;
      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await loader();
        dataRef.current = data;
        setState({
          data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
        return data;
      } catch (requestError) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getAdminErrorMessage(requestError),
        }));
        return null;
      } finally {
        inFlight.current = false;
      }
    },
    [enabled, loader],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    setData: (value: T) => {
      dataRef.current = value;
      setState({
        data: value,
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
    },
  };
}

function useAdminMutation<TPayload>(
  action: (payload: TPayload) => Promise<AdminMutationResult>,
) {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
    lastResult: null,
  });

  const run = useCallback(
    async (payload: TPayload) => {
      setState({
        isLoading: true,
        error: null,
        lastResult: null,
      });

      try {
        const result = await action(payload);
        setState({
          isLoading: false,
          error: null,
          lastResult: result,
        });
        return result;
      } catch (requestError) {
        const message = getAdminErrorMessage(requestError);
        setState({
          isLoading: false,
          error: message,
          lastResult: null,
        });
        throw requestError;
      }
    },
    [action],
  );

  return {
    ...state,
    run,
    clear: () =>
      setState({
        isLoading: false,
        error: null,
        lastResult: null,
      }),
  };
}

export function useAdminDashboard() {
  const loader = useCallback(() => adminDashboardApi.getSummary(), []);
  return useAdminResource<AdminDashboardSummary>(loader);
}

export function useAdminCases(filters: AdminCaseFilters) {
  const stableFilters = useMemo(() => filters, [filters]);
  const loader = useCallback(
    () => adminCasesApi.getCases(stableFilters),
    [stableFilters],
  );
  return useAdminResource<CaseQueueResponse>(loader);
}

export function useAdminCase(caseId: string) {
  const loader = useCallback(() => adminCasesApi.getCase(caseId), [caseId]);
  return useAdminResource<AdminCaseDetail>(loader, Boolean(caseId));
}

export function useAdminUsers() {
  const loader = useCallback(() => adminAssignmentsApi.getUsers(), []);
  return useAdminResource<AdminUserOption[]>(loader);
}

export function useAdminDocuments(caseId: string) {
  const loader = useCallback(() => adminDocumentsApi.getDocuments(caseId), [caseId]);
  return useAdminResource<AdminDocument[]>(loader, Boolean(caseId));
}

export function useAdminExtraction(caseId: string) {
  const loader = useCallback(() => adminExtractionApi.getExtraction(caseId), [caseId]);
  return useAdminResource<ExtractionSummary>(loader, Boolean(caseId));
}

export function useAdminLegalAnalysis(caseId: string) {
  const loader = useCallback(
    () => adminLegalAnalysisApi.getLegalAnalysis(caseId),
    [caseId],
  );
  return useAdminResource<LegalAnalysisReview>(loader, Boolean(caseId));
}

export function useAdminCalculations(caseId: string) {
  const loader = useCallback(
    () => adminCalculationsApi.getCalculations(caseId),
    [caseId],
  );
  return useAdminResource<CalculationReview>(loader, Boolean(caseId));
}

export function useAdminReports(caseId: string) {
  const loader = useCallback(() => adminReportsApi.getReports(caseId), [caseId]);
  return useAdminResource<ReportReview>(loader, Boolean(caseId));
}

export function useAdminLegalDrafts(caseId: string) {
  const loader = useCallback(
    () => adminLegalDraftsApi.getLegalDrafts(caseId),
    [caseId],
  );
  return useAdminResource<LegalDraftReview>(loader, Boolean(caseId));
}

export function useAdminAudit(caseId: string) {
  const loader = useCallback(() => adminAuditApi.getAuditEvents(caseId), [caseId]);
  return useAdminResource<AuditEvent[]>(loader, Boolean(caseId));
}

export function useAssignCase(caseId: string) {
  return useAdminMutation<{
    assigneeId: string;
    assignmentType: string;
    reason: string;
    priority?: string;
  }>((payload) => adminAssignmentsApi.assignCase(caseId, payload));
}

export function useChangeCaseStatus(caseId: string) {
  return useAdminMutation<{
    status: string;
    reason: string;
    blocksCase: boolean;
  }>((payload) => adminCasesApi.changeStatus(caseId, payload));
}

export function useCreateInternalNote(caseId: string) {
  return useAdminMutation<{
    noteType: string;
    body: string;
    relatedEntity?: string;
    visibility: string;
  }>((payload) => adminNotesApi.createNote(caseId, payload));
}

export function useReviewDocument(caseId: string, documentId: string) {
  return useAdminMutation<DocumentReviewPayload>((payload) =>
    adminDocumentsApi.reviewDocument(caseId, documentId, payload),
  );
}

export function useCorrectExtraction(caseId: string) {
  return useAdminMutation<ExtractionCorrectionPayload>((payload) =>
    adminExtractionApi.correctItem(caseId, payload),
  );
}

export function useReviewLegalAnalysis(caseId: string) {
  return useAdminMutation<{
    decision: string;
    comment: string;
    requiresHumanReview: boolean;
  }>((payload) => adminLegalAnalysisApi.reviewLegalAnalysis(caseId, payload));
}

export function useReviewCalculations(caseId: string) {
  return useAdminMutation<{
    decision: string;
    comment: string;
    blocking: boolean;
  }>((payload) => adminCalculationsApi.reviewCalculations(caseId, payload));
}

export function useApproveAdminReport(caseId: string, reportId: string) {
  return useAdminMutation<{
    comment: string;
    markVisibleToUser: boolean;
  }>((payload) => adminReportsApi.approveReport(caseId, reportId, payload));
}

export function useReviewLegalDraft(caseId: string, draftId: string) {
  return useAdminMutation<{
    decision: string;
    comment: string;
    professionalReviewRequired: boolean;
  }>((payload) => adminLegalDraftsApi.reviewLegalDraft(caseId, draftId, payload));
}

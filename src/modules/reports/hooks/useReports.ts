"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  approveReport,
  createReport,
  downloadExport,
  exportReport,
  getReport,
  getReportErrorMessage,
  getReportVersions,
  getReports,
  rejectReport,
  requestReportRegeneration,
} from "@/src/modules/reports/api/reports.api";
import type {
  AdminReviewDecisionResponse,
  CreateReportRequest,
  CreateReportResponse,
  DownloadExportResponse,
  ExportReportRequest,
  ExportReportResponse,
  ReportDetailResponse,
  ReportStatus,
  ReportVersionsResponse,
  ReportsListResponse,
} from "@/src/modules/reports/api/reports.types";

type AsyncState<T> = {
  data: T;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type NullableAsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type MutationState = {
  isLoading: boolean;
  error: string | null;
};

const processingStatuses: ReportStatus[] = ["in_progress", "queued", "generating"];

function shouldPollStatus(status?: ReportStatus) {
  return Boolean(status && processingStatuses.includes(status));
}

function makeEmptyReports(): ReportsListResponse {
  return {
    items: [],
    pagination: { page: 1, limit: 20, total: 0 },
  };
}

export function useReports(caseId: string, options: { poll?: boolean } = {}) {
  const { poll = true } = options;
  const [state, setState] = useState<AsyncState<ReportsListResponse>>({
    data: makeEmptyReports(),
    isLoading: Boolean(caseId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!caseId || requestInFlight.current) {
        return null;
      }

      requestInFlight.current = true;
      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await getReports(caseId);
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
          error: getReportErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [caseId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const shouldPoll = useMemo(
    () => state.data.items.some((item) => shouldPollStatus(item.status)),
    [state.data.items],
  );

  useEffect(() => {
    if (!poll || !shouldPoll) {
      return;
    }

    const timer = window.setInterval(() => {
      load(true);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [load, poll, shouldPoll]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    setData: (data: ReportsListResponse) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
  };
}

export function useReport(reportId: string, options: { poll?: boolean } = {}) {
  const { poll = true } = options;
  const [state, setState] = useState<NullableAsyncState<ReportDetailResponse>>({
    data: null,
    isLoading: Boolean(reportId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!reportId || requestInFlight.current) {
        return null;
      }

      requestInFlight.current = true;
      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await getReport(reportId);
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
          error: getReportErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [reportId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const shouldPoll = useMemo(() => {
    if (!state.data) {
      return false;
    }

    return (
      shouldPollStatus(state.data.status) ||
      state.data.availableExports.some((item) => item.status === "queued" || item.status === "generating")
    );
  }, [state.data]);

  useEffect(() => {
    if (!poll || !shouldPoll) {
      return;
    }

    const timer = window.setInterval(() => {
      load(true);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [load, poll, shouldPoll]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    setData: (data: ReportDetailResponse) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
  };
}

function useMutation<TPayload, TResult>(
  action: (payload: TPayload) => Promise<TResult>,
) {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (payload: TPayload) => {
      setState({ isLoading: true, error: null });

      try {
        return await action(payload);
      } catch (requestError) {
        const message = getReportErrorMessage(requestError);
        setState({ isLoading: false, error: message });
        throw requestError;
      } finally {
        setState((current) => ({ ...current, isLoading: false }));
      }
    },
    [action],
  );

  return {
    ...state,
    mutate,
    clearError: () => setState((current) => ({ ...current, error: null })),
  };
}

export function useCreateReport(caseId: string) {
  const action = useCallback(
    (payload: CreateReportRequest) => createReport(caseId, payload),
    [caseId],
  );
  const mutation = useMutation<CreateReportRequest, CreateReportResponse>(action);

  return {
    ...mutation,
    create: mutation.mutate,
  };
}

export function useExportReport(reportId: string) {
  const action = useCallback(
    (payload: ExportReportRequest) => exportReport(reportId, payload),
    [reportId],
  );
  const mutation = useMutation<ExportReportRequest, ExportReportResponse>(action);

  return {
    ...mutation,
    exportFile: mutation.mutate,
  };
}

export function useDownloadExport() {
  const mutation = useMutation<string, DownloadExportResponse>(downloadExport);

  return {
    ...mutation,
    download: mutation.mutate,
  };
}

export function useReportVersions(reportId: string) {
  const [state, setState] = useState<AsyncState<ReportVersionsResponse>>({
    data: { items: [] },
    isLoading: Boolean(reportId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!reportId || requestInFlight.current) {
        return null;
      }

      requestInFlight.current = true;
      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await getReportVersions(reportId);
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
          error: getReportErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [reportId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
  };
}

export function useApproveReport(reportId: string) {
  const action = useCallback(
    (comment?: string) => approveReport(reportId, comment),
    [reportId],
  );
  const mutation = useMutation<string | undefined, AdminReviewDecisionResponse>(action);

  return {
    ...mutation,
    approve: mutation.mutate,
  };
}

export function useRejectReport(reportId: string) {
  const action = useCallback(
    (comment?: string) => rejectReport(reportId, comment),
    [reportId],
  );
  const mutation = useMutation<string | undefined, AdminReviewDecisionResponse>(action);

  return {
    ...mutation,
    reject: mutation.mutate,
  };
}

export function useAdminReportReview(reportId: string) {
  const [comment, setComment] = useState("");
  const [lastDecision, setLastDecision] = useState<AdminReviewDecisionResponse | null>(null);
  const approveMutation = useMutation<string | undefined, AdminReviewDecisionResponse>(
    (payload) => approveReport(reportId, payload),
  );
  const rejectMutation = useMutation<string | undefined, AdminReviewDecisionResponse>(
    (payload) => rejectReport(reportId, payload),
  );
  const regenerateMutation = useMutation<string | undefined, AdminReviewDecisionResponse>(
    (payload) => requestReportRegeneration(reportId, payload),
  );

  const runDecision = useCallback(
    async (
      action: (payload?: string) => Promise<AdminReviewDecisionResponse>,
    ) => {
      const decision = await action(comment.trim() || undefined);
      setLastDecision(decision);
      return decision;
    },
    [comment],
  );

  return {
    comment,
    setComment,
    lastDecision,
    approve: () => runDecision(approveMutation.mutate),
    reject: () => runDecision(rejectMutation.mutate),
    regenerate: () => runDecision(regenerateMutation.mutate),
    isLoading:
      approveMutation.isLoading ||
      rejectMutation.isLoading ||
      regenerateMutation.isLoading,
    error:
      approveMutation.error ||
      rejectMutation.error ||
      regenerateMutation.error,
    clearError: () => {
      approveMutation.clearError();
      rejectMutation.clearError();
      regenerateMutation.clearError();
    },
  };
}

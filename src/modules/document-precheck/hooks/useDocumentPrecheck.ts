"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiError } from "@/lib/api";
import {
  getDocumentPrechecks,
  getOcrPreview,
  getPrecheckErrorMessage,
  startDocumentPrecheck,
  startOcrPreview,
  submitAdminPrecheckDecision,
} from "@/src/modules/document-precheck/api/document-precheck.api";
import type {
  AdminPrecheckDecisionPayload,
  DocumentPrecheckDto,
  DocumentPrecheckStatus,
  OcrPreviewSummaryDto,
  StartOcrPreviewOptions,
} from "@/src/modules/document-precheck/api/document-precheck.types";

export const TERMINAL_PRECHECK_STATUSES: DocumentPrecheckStatus[] = [
  "completed",
  "blocked",
  "requires_review",
  "error",
];

function isTerminal(status?: DocumentPrecheckStatus) {
  return Boolean(status && TERMINAL_PRECHECK_STATUSES.includes(status));
}

type AsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

export function useStartDocumentPrecheck({
  caseId,
  documentId,
  onStarted,
}: {
  caseId: string;
  documentId: string;
  onStarted?: (precheck: DocumentPrecheckDto) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (force = false) => {
      if (!caseId || !documentId) {
        setError("No encontramos el expediente o documento para iniciar la revision.");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const precheck = await startDocumentPrecheck(caseId, documentId, force);
        onStarted?.(precheck);
        return precheck;
      } catch (requestError) {
        const message = getPrecheckErrorMessage(requestError);
        setError(message);
        throw requestError;
      } finally {
        setIsLoading(false);
      }
    },
    [caseId, documentId, onStarted],
  );

  return { start, isLoading, error };
}

export function usePrecheckPolling({
  enabled,
  status,
  onPoll,
}: {
  enabled: boolean;
  status?: DocumentPrecheckStatus;
  onPoll: () => Promise<void>;
}) {
  const failureCount = useRef(0);

  useEffect(() => {
    if (!enabled || isTerminal(status)) {
      return;
    }

    let canceled = false;
    let timer: number | undefined;

    const schedule = () => {
      const delay = Math.min(4000 + failureCount.current * 1500, 10000);
      timer = window.setTimeout(async () => {
        if (canceled) {
          return;
        }

        try {
          await onPoll();
          failureCount.current = 0;
        } catch {
          failureCount.current += 1;
        }

        if (!canceled) {
          schedule();
        }
      }, delay);
    };

    schedule();

    return () => {
      canceled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [enabled, onPoll, status]);
}

export function useDocumentPrecheck(caseId: string, documentId: string) {
  const [state, setState] = useState<AsyncState<DocumentPrecheckDto>>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!caseId || !documentId || requestInFlight.current) {
        return;
      }

      requestInFlight.current = true;
      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const response = await getDocumentPrechecks(caseId, documentId, true);
        setState({
          data: response.items[0] || null,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (requestError) {
        if (
          requestError instanceof ApiError &&
          (requestError.status === 404 || requestError.code === "DOCUMENT_PRECHECK_NOT_FOUND")
        ) {
          setState({
            data: null,
            isLoading: false,
            isRefreshing: false,
            error: null,
          });
          return;
        }

        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getPrecheckErrorMessage(requestError),
        }));
        throw requestError;
      } finally {
        requestInFlight.current = false;
      }
    },
    [caseId, documentId],
  );

  useEffect(() => {
    load(false).catch(() => undefined);
  }, [load]);

  usePrecheckPolling({
    enabled: Boolean(caseId && documentId && state.data && !state.error),
    status: state.data?.status,
    onPoll: () => load(true),
  });

  const startMutation = useStartDocumentPrecheck({
    caseId,
    documentId,
    onStarted: (precheck) => {
      setState({
        data: precheck,
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
    },
  });

  return {
    ...state,
    isPolling: Boolean(state.data && !isTerminal(state.data.status)),
    hasPrecheck: Boolean(state.data),
    refetch: () => load(false),
    refresh: () => load(true),
    start: startMutation.start,
    isStarting: startMutation.isLoading,
    startError: startMutation.error,
  };
}

export function useOcrPreview(documentId: string, enabled = true) {
  const [state, setState] = useState<AsyncState<OcrPreviewSummaryDto>>({
    data: null,
    isLoading: enabled,
    isRefreshing: false,
    error: null,
  });

  const load = useCallback(
    async (silent = false) => {
      if (!documentId || !enabled) {
        return;
      }

      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await getOcrPreview(documentId);
        setState({ data, isLoading: false, isRefreshing: false, error: null });
      } catch (requestError) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getPrecheckErrorMessage(requestError),
        }));
      }
    },
    [documentId, enabled],
  );

  const start = useCallback(
    async (options: StartOcrPreviewOptions = {}) => {
      setState((current) => ({ ...current, isRefreshing: true, error: null }));

      try {
        const data = await startOcrPreview(documentId, options);
        setState({ data, isLoading: false, isRefreshing: false, error: null });
        return data;
      } catch (requestError) {
        const message = getPrecheckErrorMessage(requestError);
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: message,
        }));
        throw requestError;
      }
    },
    [documentId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    start,
  };
}

export function useAdminPrecheckDecision(precheckId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (payload: AdminPrecheckDecisionPayload) => {
      setIsLoading(true);
      setError(null);

      try {
        return await submitAdminPrecheckDecision(precheckId, payload);
      } catch (requestError) {
        const message = getPrecheckErrorMessage(requestError);
        setError(message);
        throw requestError;
      } finally {
        setIsLoading(false);
      }
    },
    [precheckId],
  );

  return useMemo(() => ({ mutate, isLoading, error }), [error, isLoading, mutate]);
}

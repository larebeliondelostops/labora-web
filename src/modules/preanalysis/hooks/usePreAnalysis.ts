"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getPreAnalysis,
  getPreAnalysisErrorMessage,
  getPreAnalysisStatus,
  retryPreAnalysis,
  startPreAnalysis,
} from "@/src/modules/preanalysis/api/preanalysis.api";
import type {
  PreAnalysisResultDto,
  PreAnalysisStatus,
  PreAnalysisStatusDto,
} from "@/src/modules/preanalysis/api/preanalysis.types";

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

const activeStatuses: PreAnalysisStatus[] = ["queued", "in_progress"];

function isActiveStatus(status?: PreAnalysisStatus) {
  return Boolean(status && activeStatuses.includes(status));
}

export function usePreAnalysis(caseId: string) {
  const [state, setState] = useState<NullableAsyncState<PreAnalysisResultDto>>({
    data: null,
    isLoading: Boolean(caseId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!caseId || requestInFlight.current) {
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
        const data = await getPreAnalysis(caseId);
        setState({
          data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (requestError) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getPreAnalysisErrorMessage(requestError),
        }));
      } finally {
        requestInFlight.current = false;
      }
    },
    [caseId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    ...state,
    setData: (data: PreAnalysisResultDto) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
    refetch: () => load(false),
    refresh: () => load(true),
  };
}

export function usePreAnalysisStatus(caseId: string, enabled = true) {
  const [state, setState] = useState<NullableAsyncState<PreAnalysisStatusDto>>({
    data: null,
    isLoading: Boolean(caseId) && enabled,
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!caseId || !enabled || requestInFlight.current) {
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
        const data = await getPreAnalysisStatus(caseId);
        setState({
          data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (requestError) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getPreAnalysisErrorMessage(requestError),
        }));
      } finally {
        requestInFlight.current = false;
      }
    },
    [caseId, enabled],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!enabled || !isActiveStatus(state.data?.status)) {
      return;
    }

    const timer = window.setInterval(() => {
      load(true);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [enabled, load, state.data?.status]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
  };
}

function usePreAnalysisMutation(
  action: (caseId: string) => Promise<PreAnalysisResultDto>,
) {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (caseId: string) => {
      setState({ isLoading: true, error: null });

      try {
        return await action(caseId);
      } catch (requestError) {
        const message = getPreAnalysisErrorMessage(requestError);
        setState({ isLoading: false, error: message });
        throw requestError;
      } finally {
        setState((current) => ({ ...current, isLoading: false }));
      }
    },
    [action],
  );

  return {
    mutate,
    isLoading: state.isLoading,
    error: state.error,
    clearError: () => setState((current) => ({ ...current, error: null })),
  };
}

export function useStartPreAnalysis(caseId: string) {
  const mutation = usePreAnalysisMutation(startPreAnalysis);

  return {
    ...mutation,
    start: () => mutation.mutate(caseId),
  };
}

export function useRetryPreAnalysis(caseId: string) {
  const mutation = usePreAnalysisMutation(retryPreAnalysis);

  return {
    ...mutation,
    retry: () => mutation.mutate(caseId),
  };
}

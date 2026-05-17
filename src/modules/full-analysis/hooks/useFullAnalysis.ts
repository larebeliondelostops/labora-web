"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCalculations,
  getConfidence,
  getFullAnalysis,
  getInconsistencies,
  getRulesResults,
  getScenarios,
  mapFullAnalysisError,
  retryFullAnalysis,
  startFullAnalysis,
} from "@/src/modules/full-analysis/api/full-analysis.api";
import type {
  AnalysisInconsistency,
  CalculationResult,
  ConfidenceResponse,
  FullAnalysis,
  FullAnalysisStatus,
  LegalRuleResult,
  Paginated,
  RulesQuery,
  Scenario,
} from "@/src/modules/full-analysis/api/full-analysis.types";

type AsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type MutationState = {
  isLoading: boolean;
  error: string | null;
};

const processingStatuses: FullAnalysisStatus[] = [
  "queued",
  "in_progress",
  "rules_running",
  "calculations_running",
  "scenario_comparison_running",
  "confidence_evaluation_running",
];

function shouldPoll(status?: FullAnalysisStatus) {
  return Boolean(status && processingStatuses.includes(status));
}

export function useFullAnalysis(caseId: string) {
  const [state, setState] = useState<AsyncState<FullAnalysis>>({
    data: null,
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
        const data = await getFullAnalysis(caseId);
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
          error: mapFullAnalysisError(requestError),
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

  useEffect(() => {
    if (!shouldPoll(state.data?.status)) {
      return;
    }

    const timer = window.setInterval(() => {
      load(true);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [load, state.data?.status]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    setData: (data: FullAnalysis) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
  };
}

function useFullAnalysisMutation<TResult>(
  action: () => Promise<TResult>,
) {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async () => {
    setState({ isLoading: true, error: null });

    try {
      return await action();
    } catch (requestError) {
      const message = mapFullAnalysisError(requestError);
      setState({ isLoading: false, error: message });
      throw requestError;
    } finally {
      setState((current) => ({ ...current, isLoading: false }));
    }
  }, [action]);

  return {
    ...state,
    mutate,
    clearError: () => setState((current) => ({ ...current, error: null })),
  };
}

export function useStartFullAnalysis(caseId: string) {
  const action = useCallback(
    () => startFullAnalysis(caseId, { reason: "user_request" }),
    [caseId],
  );
  const mutation = useFullAnalysisMutation(action);

  return {
    ...mutation,
    start: mutation.mutate,
  };
}

export function useRetryFullAnalysis(caseId: string) {
  const action = useCallback(
    () => retryFullAnalysis(caseId, { reason: "user_retry" }),
    [caseId],
  );
  const mutation = useFullAnalysisMutation(action);

  return {
    ...mutation,
    retry: mutation.mutate,
  };
}

function useTabResource<T>(
  enabled: boolean,
  loader: () => Promise<T>,
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: enabled,
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!enabled || requestInFlight.current) {
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
        const data = await loader();
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
          error: mapFullAnalysisError(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
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
  };
}

export function useRulesResults(
  caseId: string,
  enabled: boolean,
  params: RulesQuery = {},
) {
  const loader = useCallback(
    () => getRulesResults(caseId, params),
    [caseId, params.filter],
  );

  return useTabResource<Paginated<LegalRuleResult>>(enabled, loader);
}

export function useCalculations(caseId: string, enabled: boolean) {
  const loader = useCallback(() => getCalculations(caseId), [caseId]);

  return useTabResource<Paginated<CalculationResult>>(enabled, loader);
}

export function useScenarios(caseId: string, enabled: boolean) {
  const loader = useCallback(() => getScenarios(caseId), [caseId]);

  return useTabResource<{ items: Scenario[] }>(enabled, loader);
}

export function useInconsistencies(caseId: string, enabled: boolean) {
  const loader = useCallback(() => getInconsistencies(caseId), [caseId]);

  return useTabResource<{ items: AnalysisInconsistency[] }>(enabled, loader);
}

export function useConfidence(caseId: string, enabled: boolean) {
  const loader = useCallback(() => getConfidence(caseId), [caseId]);

  return useTabResource<ConfidenceResponse>(enabled, loader);
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCaseResult,
  mapResultError,
} from "@/src/modules/result/api/result.api";
import type {
  CaseResultResponse,
  ResultStatus,
} from "@/src/modules/result/api/result.types";

type ResultState = {
  data: CaseResultResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

const pollingStatuses: ResultStatus[] = ["in_progress"];

function shouldPoll(status?: ResultStatus) {
  return Boolean(status && pollingStatuses.includes(status));
}

export function useCaseResult(caseId: string) {
  const [state, setState] = useState<ResultState>({
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
        const data = await getCaseResult(caseId);
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
          error: mapResultError(requestError),
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
    }, 5000);

    return () => window.clearInterval(timer);
  }, [load, state.data?.status]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    setData: (data: CaseResultResponse) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
  };
}

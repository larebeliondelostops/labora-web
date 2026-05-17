"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createCasePreview,
  getCasePreview,
  getCasePaywall,
  getPreviewErrorMessage,
} from "@/src/modules/paywall-preview/api/preview.api";
import type { CreatePreviewPayload } from "@/src/modules/paywall-preview/api/preview.types";
import type {
  PreviewErrorState,
  PreviewResponse,
} from "@/src/modules/paywall-preview/api/preview.types";
import { ApiError } from "@/lib/api";

type PreviewAsyncState = {
  data: PreviewResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: PreviewErrorState | null;
};

const maxPollingAttempts = 12;
const pollingIntervalMs = 7000;

export function usePreview(caseId: string) {
  const [state, setState] = useState<PreviewAsyncState>({
    data: null,
    isLoading: Boolean(caseId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);
  const pollingAttempts = useRef(0);

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
        const data = await getCasePreview(caseId);
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
          error: {
            message: getPreviewErrorMessage(requestError),
            code: requestError instanceof ApiError ? requestError.code : undefined,
            status: requestError instanceof ApiError ? requestError.status : undefined,
          },
        }));
      } finally {
        requestInFlight.current = false;
      }
    },
    [caseId],
  );

  const createOrRefresh = useCallback(
    async (payload: CreatePreviewPayload = {}) => {
      if (!caseId) {
        return null;
      }

      setState((current) => ({
        ...current,
        isRefreshing: true,
        error: null,
      }));

      try {
        const data = await createCasePreview(caseId, payload);
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
          error: {
            message: getPreviewErrorMessage(requestError),
            code: requestError instanceof ApiError ? requestError.code : undefined,
            status: requestError instanceof ApiError ? requestError.status : undefined,
          },
        }));
        return null;
      }
    },
    [caseId],
  );

  const refreshPaywall = useCallback(async () => {
    if (!caseId) {
      return;
    }

    try {
      await getCasePaywall(caseId);
    } catch {
      // Paywall config is a companion refresh; preview remains the source of truth.
    }
  }, [caseId]);

  useEffect(() => {
    pollingAttempts.current = 0;
    load(false);
  }, [load]);

  useEffect(() => {
    if (state.data?.status !== "in_progress") {
      return;
    }

    if (pollingAttempts.current >= maxPollingAttempts) {
      return;
    }

    const timer = window.setInterval(() => {
      if (pollingAttempts.current >= maxPollingAttempts) {
        window.clearInterval(timer);
        return;
      }

      pollingAttempts.current += 1;
      load(true);
    }, pollingIntervalMs);

    return () => window.clearInterval(timer);
  }, [load, state.data?.status]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    createOrRefresh,
    refreshPaywall,
  };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  confirmExtraction,
  createExtractionEmployer,
  createExtractionLaborPeriod,
  getExtraction,
  getExtractionCorrections,
  getExtractionErrorMessage,
  getExtractionIssues,
  ignoreExtractionEntity,
  updateExtractionFields,
  updateExtractionIssue,
} from "@/src/modules/extraction/api/extraction.api";
import type {
  ConfirmExtractionPayload,
  ConfirmExtractionResponse,
  CorrectionItem,
  CreateEmployerPayload,
  CreateLaborPeriodPayload,
  Employer,
  ExtractionIssue,
  ExtractionIssueStatus,
  ExtractionResponse,
  IgnoreEntityPayload,
  LaborPeriod,
  UpdateExtractionFieldsPayload,
} from "@/src/modules/extraction/api/extraction.types";

type AsyncState<T> = {
  data: T;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

type AsyncListResource<T> = AsyncState<T[]> & {
  refetch: () => void;
  refresh: () => void;
};

type NullableAsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

export function useExtraction(caseId: string) {
  const [state, setState] = useState<NullableAsyncState<ExtractionResponse>>({
    data: null,
    isLoading: true,
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
        const data = await getExtraction(caseId);
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
          error: getExtractionErrorMessage(requestError),
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

  useEffect(() => {
    if (state.data?.status !== "in_progress") {
      return;
    }

    const timer = window.setInterval(() => {
      load(true);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [load, state.data?.status]);

  return {
    ...state,
    setData: (data: ExtractionResponse) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
    refetch: () => load(false),
    refresh: () => load(true),
  };
}

function useMutation<TPayload, TResult>(
  action: (payload: TPayload) => Promise<TResult>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutate = useCallback(
    async (payload: TPayload) => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const result = await action(payload);
        setSuccess("Cambios guardados correctamente.");
        return result;
      } catch (requestError) {
        const message = getExtractionErrorMessage(requestError);
        setError(message);
        throw requestError;
      } finally {
        setIsLoading(false);
      }
    },
    [action],
  );

  return useMemo(
    () => ({
      mutate,
      isLoading,
      error,
      success,
      clearFeedback: () => {
        setError(null);
        setSuccess(null);
      },
    }),
    [error, isLoading, mutate, success],
  );
}

export function useUpdateExtractionField(caseId: string) {
  return useMutation<UpdateExtractionFieldsPayload, ExtractionResponse | void>(
    useCallback((payload) => updateExtractionFields(caseId, payload), [caseId]),
  );
}

export function useCreateExtractionEmployer(caseId: string) {
  return useMutation<CreateEmployerPayload, Employer>(
    useCallback((payload) => createExtractionEmployer(caseId, payload), [caseId]),
  );
}

export function useCreateExtractionLaborPeriod(caseId: string) {
  return useMutation<CreateLaborPeriodPayload, LaborPeriod>(
    useCallback((payload) => createExtractionLaborPeriod(caseId, payload), [caseId]),
  );
}

export function useIgnoreExtractionEntity(caseId: string) {
  return useMutation<
    { entityType: string; entityId: string; payload: IgnoreEntityPayload },
    void
  >(
    useCallback(
      ({ entityType, entityId, payload }) =>
        ignoreExtractionEntity(caseId, entityType, entityId, payload),
      [caseId],
    ),
  );
}

export function useUpdateExtractionIssue(caseId: string) {
  return useMutation<
    { issueId: string; status: ExtractionIssueStatus; reason?: string },
    ExtractionIssue
  >(
    useCallback(
      ({ issueId, status, reason }) =>
        updateExtractionIssue(caseId, issueId, { status, reason }),
      [caseId],
    ),
  );
}

export function useConfirmExtraction(caseId: string) {
  return useMutation<ConfirmExtractionPayload, ConfirmExtractionResponse>(
    useCallback((payload) => confirmExtraction(caseId, payload), [caseId]),
  );
}

function useAsyncList<T>(loader: () => Promise<T[]>, enabled: boolean): AsyncListResource<T> {
  const [state, setState] = useState<AsyncState<T[]>>({
    data: [],
    isLoading: enabled,
    isRefreshing: false,
    error: null,
  });

  const load = useCallback(
    async (silent = false) => {
      if (!enabled) {
        return;
      }

      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await loader();
        setState({ data, isLoading: false, isRefreshing: false, error: null });
      } catch (requestError) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getExtractionErrorMessage(requestError),
        }));
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

export function useExtractionCorrections(caseId: string, enabled = true) {
  return useAsyncList<CorrectionItem>(
    useCallback(() => getExtractionCorrections(caseId), [caseId]),
    Boolean(caseId) && enabled,
  );
}

export function useExtractionIssues(caseId: string, enabled = true) {
  return useAsyncList<ExtractionIssue>(
    useCallback(() => getExtractionIssues(caseId), [caseId]),
    Boolean(caseId) && enabled,
  );
}

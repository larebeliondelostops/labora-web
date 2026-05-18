"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createDraft,
  createLegalAction,
  exportDraft,
  getAdminLegalDraft,
  getAdminLegalDrafts,
  getAvailableLegalActions,
  getDraft,
  getLegalAction,
  getLegalActionsErrorMessage,
  regenerateDraftSection,
  runQualityCheck,
  submitAdminReviewDecision,
  submitDraftForReview,
  updateDraft,
} from "@/src/modules/legal-actions/api/legal-actions.api";
import type {
  AdminLegalDraftsResponse,
  AdminReviewDecisionRequest,
  AvailableLegalActionsResponse,
  CreateDraftRequest,
  CreateDraftResponse,
  CreateLegalActionRequest,
  CreateLegalActionResponse,
  ExportDraftRequest,
  LegalActionDetail,
  LegalDraft,
  RegenerateSectionRequest,
  SubmitReviewRequest,
  UpdateDraftRequest,
} from "@/src/modules/legal-actions/api/legal-actions.types";
import { shouldPollDraft } from "@/src/modules/legal-actions/hooks/useDraftPolling";

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

function emptyAvailableLegalActions(caseId: string): AvailableLegalActionsResponse {
  return {
    case_id: caseId,
    ready: false,
    readiness: [],
    actions: [],
    missing_attachments: [],
    warnings: [],
  };
}

function emptyAdminDrafts(): AdminLegalDraftsResponse {
  return {
    items: [],
    total: 0,
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
        const message = getLegalActionsErrorMessage(requestError);
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

export function useAvailableLegalActions(caseId: string) {
  const [state, setState] = useState<AsyncState<AvailableLegalActionsResponse>>({
    data: emptyAvailableLegalActions(caseId),
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
        const data = await getAvailableLegalActions(caseId);
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
          error: getLegalActionsErrorMessage(requestError),
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

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
  };
}

export function useLegalAction(actionId: string) {
  const [state, setState] = useState<NullableAsyncState<LegalActionDetail>>({
    data: null,
    isLoading: Boolean(actionId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!actionId || requestInFlight.current) {
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
        const data = await getLegalAction(actionId);
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
          error: getLegalActionsErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [actionId],
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

export function useDraft(draftId: string, options: { poll?: boolean } = {}) {
  const { poll = true } = options;
  const [state, setState] = useState<NullableAsyncState<LegalDraft>>({
    data: null,
    isLoading: Boolean(draftId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!draftId || requestInFlight.current) {
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
        const data = await getDraft(draftId);
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
          error: getLegalActionsErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [draftId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const shouldPoll = useMemo(() => shouldPollDraft(state.data), [state.data]);

  useEffect(() => {
    if (!poll || !shouldPoll) {
      return;
    }

    const timer = window.setInterval(() => {
      load(true);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [load, poll, shouldPoll]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    setData: (data: LegalDraft) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
  };
}

export function useCreateLegalAction(caseId: string) {
  const action = useCallback(
    (payload: CreateLegalActionRequest) => createLegalAction(caseId, payload),
    [caseId],
  );
  const mutation = useMutation<CreateLegalActionRequest, CreateLegalActionResponse>(action);

  return {
    ...mutation,
    create: mutation.mutate,
  };
}

export function useCreateDraft(actionId: string) {
  const action = useCallback(
    (payload: CreateDraftRequest) => createDraft(actionId, payload),
    [actionId],
  );
  const mutation = useMutation<CreateDraftRequest, CreateDraftResponse>(action);

  return {
    ...mutation,
    create: mutation.mutate,
  };
}

export function useDraftActions(draftId: string) {
  const saveMutation = useMutation<UpdateDraftRequest, LegalDraft>((payload) =>
    updateDraft(draftId, payload),
  );
  const qualityMutation = useMutation<void, LegalDraft>(() =>
    runQualityCheck(draftId),
  );
  const exportMutation = useMutation<ExportDraftRequest, LegalDraft>((payload) =>
    exportDraft(draftId, payload),
  );
  const reviewMutation = useMutation<SubmitReviewRequest, LegalDraft>((payload) =>
    submitDraftForReview(draftId, payload),
  );

  const regenerate = useCallback(
    (sectionId: string, payload: RegenerateSectionRequest) =>
      regenerateDraftSection(draftId, sectionId, payload),
    [draftId],
  );
  const regenerateMutation = useMutation<
    { sectionId: string; payload: RegenerateSectionRequest },
    LegalDraft
  >(({ sectionId, payload }) => regenerate(sectionId, payload));

  return {
    save: saveMutation.mutate,
    runQuality: qualityMutation.mutate,
    exportFile: exportMutation.mutate,
    submitReview: reviewMutation.mutate,
    regenerateSection: regenerateMutation.mutate,
    isLoading:
      saveMutation.isLoading ||
      qualityMutation.isLoading ||
      exportMutation.isLoading ||
      reviewMutation.isLoading ||
      regenerateMutation.isLoading,
    error:
      saveMutation.error ||
      qualityMutation.error ||
      exportMutation.error ||
      reviewMutation.error ||
      regenerateMutation.error,
    clearError: () => {
      saveMutation.clearError();
      qualityMutation.clearError();
      exportMutation.clearError();
      reviewMutation.clearError();
      regenerateMutation.clearError();
    },
  };
}

export function useAdminLegalDrafts(params: {
  status?: string;
  actionType?: string;
  query?: string;
}) {
  const [state, setState] = useState<AsyncState<AdminLegalDraftsResponse>>({
    data: emptyAdminDrafts(),
    isLoading: true,
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);
  const serializedParams = JSON.stringify(params);

  const load = useCallback(
    async (silent = false) => {
      if (requestInFlight.current) {
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
        const parsedParams = JSON.parse(serializedParams) as typeof params;
        const data = await getAdminLegalDrafts(parsedParams);
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
          error: getLegalActionsErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [serializedParams],
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

export function useAdminLegalDraft(draftId: string) {
  const [state, setState] = useState<NullableAsyncState<LegalDraft>>({
    data: null,
    isLoading: Boolean(draftId),
    isRefreshing: false,
    error: null,
  });

  const load = useCallback(
    async (silent = false) => {
      if (!draftId) {
        return null;
      }

      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await getAdminLegalDraft(draftId);
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
          error: getLegalActionsErrorMessage(requestError),
        }));
        return null;
      }
    },
    [draftId],
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

export function useAdminReviewDecision(draftId: string) {
  const mutation = useMutation<AdminReviewDecisionRequest, LegalDraft>((payload) =>
    submitAdminReviewDecision(draftId, payload),
  );

  return {
    ...mutation,
    decide: mutation.mutate,
  };
}

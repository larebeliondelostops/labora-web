"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  approveProfessionalReview,
  cancelProfessionalReview,
  createReviewComment,
  generateProfessionalReviewAiSummary,
  getCaseProfessionalReview,
  getProfessionalReview,
  getProfessionalReviewErrorMessage,
  listProfessionalReviews,
  rejectProfessionalReview,
  requestClientAction,
  requestProfessionalReview,
  resolveReviewComment,
  uploadRequestedDocument,
  uploadReviewedFile,
} from "@/src/modules/professional-review/api/professional-review.api";
import type {
  ApproveReviewBody,
  CreateReviewCommentBody,
  ProfessionalReviewDetail,
  ProfessionalReviewsResponse,
  RequestClientActionBody,
  RequestProfessionalReviewBody,
  RequestProfessionalReviewResponse,
  ReviewComment,
  ReviewFilters,
  RequestedDocument,
  ReviewedFile,
  UploadRequestedDocumentBody,
  UploadReviewedFileBody,
} from "@/src/modules/professional-review/api/professional-review.types";

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

const activeStatuses = [
  "payment_pending",
  "requested",
  "queued",
  "assigned",
  "in_review",
  "changes_requested",
  "client_action_required",
  "ready_for_approval",
] as const;

function shouldPoll(review?: ProfessionalReviewDetail | null) {
  return Boolean(
    review &&
      activeStatuses.includes(
        review.status as (typeof activeStatuses)[number],
      ),
  );
}

function emptyList(): ProfessionalReviewsResponse {
  return {
    items: [],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
  };
}

function useReviewMutation<TPayload, TResult>(
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
        const message = getProfessionalReviewErrorMessage(requestError);
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

export function useCaseProfessionalReview(
  caseId: string,
  options: { poll?: boolean } = {},
) {
  const { poll = true } = options;
  const [state, setState] = useState<NullableAsyncState<ProfessionalReviewDetail>>({
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
        const data = await getCaseProfessionalReview(caseId);
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
          error: getProfessionalReviewErrorMessage(requestError),
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
    if (!poll || !shouldPoll(state.data)) {
      return;
    }

    const timer = window.setInterval(() => {
      load(true);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [load, poll, state.data]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    setData: (data: ProfessionalReviewDetail | null) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
  };
}

export function useProfessionalReview(
  reviewId: string,
  options: { poll?: boolean } = {},
) {
  const { poll = true } = options;
  const [state, setState] = useState<NullableAsyncState<ProfessionalReviewDetail>>({
    data: null,
    isLoading: Boolean(reviewId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!reviewId || requestInFlight.current) {
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
        const data = await getProfessionalReview(reviewId);
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
          error: getProfessionalReviewErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [reviewId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!poll || !shouldPoll(state.data)) {
      return;
    }

    const timer = window.setInterval(() => {
      load(true);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [load, poll, state.data]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    setData: (data: ProfessionalReviewDetail) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
  };
}

export function useProfessionalReviews(filters: ReviewFilters) {
  const serializedFilters = useMemo(() => JSON.stringify(filters), [filters]);
  const [state, setState] = useState<AsyncState<ProfessionalReviewsResponse>>({
    data: emptyList(),
    isLoading: true,
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

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
        const parsedFilters = JSON.parse(serializedFilters) as ReviewFilters;
        const data = await listProfessionalReviews(parsedFilters);
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
          error: getProfessionalReviewErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [serializedFilters],
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

export function useCreateProfessionalReview(caseId: string) {
  const mutation = useReviewMutation<
    RequestProfessionalReviewBody,
    RequestProfessionalReviewResponse
  >((payload) => requestProfessionalReview(caseId, payload));

  return {
    ...mutation,
    request: mutation.mutate,
  };
}

export function useProfessionalReviewActions(reviewId: string) {
  const commentMutation = useReviewMutation<CreateReviewCommentBody, ReviewComment>(
    (payload) => createReviewComment(reviewId, payload),
  );
  const resolveCommentMutation = useReviewMutation<string, ReviewComment>((commentId) =>
    resolveReviewComment(reviewId, commentId),
  );
  const clientActionMutation = useReviewMutation<
    RequestClientActionBody,
    ProfessionalReviewDetail
  >((payload) => requestClientAction(reviewId, payload));
  const reviewedFileMutation = useReviewMutation<UploadReviewedFileBody, ReviewedFile>(
    (payload) => uploadReviewedFile(reviewId, payload),
  );
  const requestedDocumentMutation = useReviewMutation<
    UploadRequestedDocumentBody,
    RequestedDocument
  >((payload) => uploadRequestedDocument(reviewId, payload));
  const approveMutation = useReviewMutation<ApproveReviewBody, ProfessionalReviewDetail>(
    (payload) => approveProfessionalReview(reviewId, payload),
  );
  const rejectMutation = useReviewMutation<
    { reason: string; note?: string },
    ProfessionalReviewDetail
  >((payload) => rejectProfessionalReview(reviewId, payload));
  const cancelMutation = useReviewMutation<string | undefined, ProfessionalReviewDetail>(
    (reason) => cancelProfessionalReview(reviewId, reason),
  );
  const aiSummaryMutation = useReviewMutation<void, ProfessionalReviewDetail>(() =>
    generateProfessionalReviewAiSummary(reviewId),
  );

  const mutations = [
    commentMutation,
    resolveCommentMutation,
    clientActionMutation,
    reviewedFileMutation,
    requestedDocumentMutation,
    approveMutation,
    rejectMutation,
    cancelMutation,
    aiSummaryMutation,
  ];

  return {
    createComment: commentMutation.mutate,
    resolveComment: resolveCommentMutation.mutate,
    requestClientAction: clientActionMutation.mutate,
    uploadReviewedFile: reviewedFileMutation.mutate,
    uploadRequestedDocument: requestedDocumentMutation.mutate,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    cancel: cancelMutation.mutate,
    generateAiSummary: aiSummaryMutation.mutate,
    isLoading: mutations.some((mutation) => mutation.isLoading),
    error: mutations.find((mutation) => mutation.error)?.error || null,
    clearError: () => mutations.forEach((mutation) => mutation.clearError()),
  };
}

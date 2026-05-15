"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getAdminQuestionnaire,
  getQuestionnaire,
  getQuestionnaireErrorMessage,
  saveQuestionnaireAnswers,
  startQuestionnaire,
  submitAdminQuestionnaireDecision,
  submitQuestionnaire,
} from "@/src/modules/questionnaire/api/questionnaire.api";
import type {
  AdminQuestionnaireDecisionPayload,
  QuestionnaireResponse,
  QuestionnaireWarning,
  SaveAnswersRequest,
  SaveAnswersResponse,
  SubmitQuestionnaireResponse,
} from "@/src/modules/questionnaire/api/questionnaire.types";

type AsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

function makeClientRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function shouldRefreshAfterSave(response: SaveAnswersResponse) {
  return Boolean(
    response.newlyVisibleQuestions?.length ||
      response.hiddenQuestions?.length ||
      response.changedQuestions.length,
  );
}

export function useQuestionnaire(caseId: string) {
  const [state, setState] = useState<AsyncState<QuestionnaireResponse>>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<QuestionnaireWarning[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] =
    useState<SubmitQuestionnaireResponse | null>(null);
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
        const data = await getQuestionnaire(caseId);
        setState({
          data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (error) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getQuestionnaireErrorMessage(error),
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

  const start = useCallback(async () => {
    setIsStarting(true);
    setSubmitResult(null);
    setSaveError(null);

    try {
      const data = await startQuestionnaire(caseId);
      setState({
        data,
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
      return data;
    } catch (error) {
      const message = getQuestionnaireErrorMessage(error);
      setState((current) => ({ ...current, error: message }));
      throw error;
    } finally {
      setIsStarting(false);
    }
  }, [caseId]);

  const saveAnswers = useCallback(
    async (
      answers: SaveAnswersRequest["answers"],
      options: { refreshOnVisibilityChange?: boolean } = {},
    ) => {
      if (!state.data?.session.id || answers.length === 0) {
        return null;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await saveQuestionnaireAnswers(caseId, {
          sessionId: state.data.session.id,
          answers,
          clientRequestId: makeClientRequestId(),
        });

        setWarnings(response.warnings || []);
        setState((current) => {
          if (!current.data) {
            return current;
          }

          return {
            ...current,
            data: {
              ...current.data,
              session: response.session,
              profilePreview:
                response.profilePreview || current.data.profilePreview,
            },
          };
        });

        if (
          options.refreshOnVisibilityChange !== false &&
          shouldRefreshAfterSave(response)
        ) {
          load(true);
        }

        return response;
      } catch (error) {
        const message = getQuestionnaireErrorMessage(error);
        setSaveError(message);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [caseId, load, state.data?.session.id],
  );

  const submit = useCallback(
    async (confirmAccuracy: boolean) => {
      if (!state.data?.session.id) {
        return null;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await submitQuestionnaire(caseId, {
          sessionId: state.data.session.id,
          confirmAccuracy,
        });
        setSubmitResult(response);
        setState((current) => {
          if (!current.data) {
            return current;
          }

          return {
            ...current,
            data: {
              ...current.data,
              session: {
                ...current.data.session,
                status: response.status,
                completionPercentage: 100,
              },
              profilePreview: response.profile,
            },
          };
        });

        return response;
      } catch (error) {
        const message = getQuestionnaireErrorMessage(error);
        setSubmitError(message);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [caseId, state.data?.session.id],
  );

  return {
    ...state,
    warnings,
    refetch: () => load(false),
    refresh: () => load(true),
    start,
    isStarting,
    saveAnswers,
    isSaving,
    saveError,
    submit,
    isSubmitting,
    submitError,
    submitResult,
  };
}

export function useAdminQuestionnaireReview(caseId: string) {
  const [state, setState] = useState<AsyncState<QuestionnaireResponse>>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!caseId) {
        return;
      }

      setState((current) => ({
        ...current,
        isLoading: silent ? current.isLoading : true,
        isRefreshing: silent,
        error: null,
      }));

      try {
        const data = await getAdminQuestionnaire(caseId);
        setState({
          data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (error) {
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getQuestionnaireErrorMessage(error),
        }));
      }
    },
    [caseId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const decide = useCallback(
    async (payload: AdminQuestionnaireDecisionPayload) => {
      setIsMutating(true);
      setMutationError(null);

      try {
        const data = await submitAdminQuestionnaireDecision(caseId, payload);
        setState({
          data,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
        return data;
      } catch (error) {
        const message = getQuestionnaireErrorMessage(error);
        setMutationError(message);
        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [caseId],
  );

  return useMemo(
    () => ({
      ...state,
      refetch: () => load(false),
      refresh: () => load(true),
      decide,
      isMutating,
      mutationError,
    }),
    [decide, isMutating, load, mutationError, state],
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createPaymentOrder,
  getOrderReceipt,
  getPaymentErrorMessage,
  getPaymentFlow,
  startPaymentCheckout,
} from "@/src/modules/payments/api/payments.api";
import type {
  CheckoutRequest,
  CreateOrderRequest,
  PaymentDto,
  PaymentFlowCaseStatus,
  PaymentFlowDto,
  PaymentOrderDto,
  PaymentReceiptDto,
} from "@/src/modules/payments/api/payments.types";

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

const activeStatuses: PaymentFlowCaseStatus[] = [
  "payment_order_created",
  "payment_pending",
  "payment_approved",
  "payment_requires_review",
];

function shouldPoll(flow?: PaymentFlowDto | null) {
  if (!flow || flow.isUnlocked) {
    return false;
  }

  return activeStatuses.includes(flow.caseStatus);
}

export function usePaymentFlow(caseId: string, options: { poll?: boolean } = {}) {
  const { poll = true } = options;
  const [state, setState] = useState<AsyncState<PaymentFlowDto>>({
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
        const data = await getPaymentFlow(caseId);
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
          error: getPaymentErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [caseId],
  );

  useEffect(() => {
    pollingAttempts.current = 0;
    load(false);
  }, [load]);

  useEffect(() => {
    if (!poll || !shouldPoll(state.data) || pollingAttempts.current >= 24) {
      return;
    }

    const timer = window.setInterval(() => {
      if (pollingAttempts.current >= 24 || !shouldPoll(state.data)) {
        window.clearInterval(timer);
        return;
      }

      pollingAttempts.current += 1;
      load(true);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [load, poll, state.data]);

  return {
    ...state,
    refetch: () => load(false),
    refresh: () => load(true),
    setData: (data: PaymentFlowDto) =>
      setState({ data, isLoading: false, isRefreshing: false, error: null }),
  };
}

function usePaymentMutation<TPayload, TResult>(
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
        const message = getPaymentErrorMessage(requestError);
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

export function useCreatePaymentOrder(caseId: string) {
  const mutation = usePaymentMutation<CreateOrderRequest, PaymentOrderDto>(
    (payload) => createPaymentOrder(caseId, payload),
  );

  return {
    ...mutation,
    create: mutation.mutate,
  };
}

export function useStartPaymentCheckout() {
  const mutation = usePaymentMutation<CheckoutRequest, PaymentDto>(
    startPaymentCheckout,
  );

  return {
    ...mutation,
    start: mutation.mutate,
  };
}

export function usePaymentReceipt(orderId?: string | null) {
  const [state, setState] = useState<AsyncState<PaymentReceiptDto>>({
    data: null,
    isLoading: Boolean(orderId),
    isRefreshing: false,
    error: null,
  });
  const requestInFlight = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!orderId || requestInFlight.current) {
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
        const data = await getOrderReceipt(orderId);
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
          error: getPaymentErrorMessage(requestError),
        }));
        return null;
      } finally {
        requestInFlight.current = false;
      }
    },
    [orderId],
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

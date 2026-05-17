"use client";

import { useCallback, useState } from "react";

import {
  createCheckoutSession,
  getPreviewErrorMessage,
} from "@/src/modules/paywall-preview/api/preview.api";
import type { CheckoutSessionResponse } from "@/src/modules/paywall-preview/api/preview.types";

type CheckoutState = {
  isSubmitting: boolean;
  error: string | null;
};

export function useCheckoutSession(caseId: string) {
  const [state, setState] = useState<CheckoutState>({
    isSubmitting: false,
    error: null,
  });

  const startCheckout = useCallback(
    async (returnUrl: string): Promise<CheckoutSessionResponse> => {
      setState({ isSubmitting: true, error: null });

      try {
        return await createCheckoutSession({ caseId, returnUrl });
      } catch (requestError) {
        const message = getPreviewErrorMessage(requestError);
        setState({ isSubmitting: false, error: message });
        throw requestError;
      } finally {
        setState((current) => ({ ...current, isSubmitting: false }));
      }
    },
    [caseId],
  );

  return {
    ...state,
    startCheckout,
    clearError: () => setState((current) => ({ ...current, error: null })),
  };
}

"use client";

import { useState } from "react";

import { getCaseErrorMessage, updateCase } from "@/src/modules/cases/api/cases.api";
import type {
  LaboraCase,
  UpdateCasePayload,
} from "@/src/modules/cases/api/cases.types";

export function useUpdateCase(caseId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(payload: UpdateCasePayload): Promise<LaboraCase> {
    setIsLoading(true);
    setError(null);

    try {
      return await updateCase(caseId, payload);
    } catch (requestError) {
      const message = getCaseErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    update,
    isLoading,
    error,
    setError,
  };
}

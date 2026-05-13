"use client";

import { useState } from "react";

import {
  createCase,
  getCaseErrorMessage,
  submitCase,
} from "@/src/modules/cases/api/cases.api";
import type {
  CreateCasePayload,
  LaboraCase,
} from "@/src/modules/cases/api/cases.types";

export function useCreateCase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(payload: CreateCasePayload, options?: { submit?: boolean }) {
    setIsLoading(true);
    setError(null);

    try {
      const created = await createCase(payload);

      if (options?.submit) {
        const submitted = await submitCase(created.id);
        return submitted || created;
      }

      return created;
    } catch (requestError) {
      const message = getCaseErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    create,
    isLoading,
    error,
    setError,
  };
}

export type CreateCaseResult = LaboraCase;

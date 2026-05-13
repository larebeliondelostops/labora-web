"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getCaseErrorMessage,
  getCaseHistory,
} from "@/src/modules/cases/api/cases.api";
import type { CaseHistoryItem } from "@/src/modules/cases/api/cases.types";

export function useCaseHistory(caseId: string, enabled = true) {
  const [data, setData] = useState<CaseHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caseId || !enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setData(await getCaseHistory(caseId));
    } catch (requestError) {
      setError(getCaseErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [caseId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    refetch: load,
  };
}

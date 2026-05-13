"use client";

import { useCallback, useEffect, useState } from "react";

import { getCaseErrorMessage, getCases } from "@/src/modules/cases/api/cases.api";
import type {
  CaseListParams,
  CaseListResponse,
} from "@/src/modules/cases/api/cases.types";

export function useCases(params: CaseListParams) {
  const [data, setData] = useState<CaseListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setData(await getCases(params));
    } catch (requestError) {
      setError(getCaseErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [params]);

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

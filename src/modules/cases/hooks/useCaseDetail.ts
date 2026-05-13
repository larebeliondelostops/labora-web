"use client";

import { useCallback, useEffect, useState } from "react";

import { getCase, getCaseErrorMessage } from "@/src/modules/cases/api/cases.api";
import type { LaboraCase } from "@/src/modules/cases/api/cases.types";

export function useCaseDetail(caseId: string) {
  const [data, setData] = useState<LaboraCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caseId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setData(await getCase(caseId));
    } catch (requestError) {
      setError(getCaseErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

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

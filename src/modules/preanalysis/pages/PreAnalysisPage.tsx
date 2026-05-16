"use client";

import { useEffect, useMemo } from "react";

import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import {
  InlineError,
  LoadingSkeleton,
} from "@/src/modules/documents/components/document-components";
import {
  PreAnalysisStatusGuard,
} from "@/src/modules/preanalysis/components/preanalysis-components";
import {
  usePreAnalysis,
  useRetryPreAnalysis,
  useStartPreAnalysis,
} from "@/src/modules/preanalysis/hooks/usePreAnalysis";
import type {
  MissingDocumentDto,
  PreAnalysisResultDto,
} from "@/src/modules/preanalysis/api/preanalysis.types";

function PageHeaderFallback({ caseId }: { caseId: string }) {
  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
        Expediente digital
      </p>
      <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
        Expediente {caseId}
      </h1>
      <p className="mt-1 text-sm text-labora-gray">Analisis preliminar gratuito</p>
    </header>
  );
}

function makeEmptyResult(caseId: string): PreAnalysisResultDto {
  return {
    id: "",
    caseId,
    status: "not_started",
    issues: [],
    missingDocuments: [],
    warnings: [],
  };
}

function trackPreAnalysisEvent(
  eventName: string,
  payload: {
    caseId: string;
    preAnalysisId?: string;
    status?: string;
    trafficLight?: string;
    viabilityLevel?: string;
  },
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("labora:analytics", {
      detail: {
        event: eventName,
        payload,
      },
    }),
  );
}

function createAnalyticsPayload(caseId: string, result?: PreAnalysisResultDto | null) {
  return {
    caseId,
    preAnalysisId: result?.id || undefined,
    status: result?.status,
    trafficLight: result?.trafficLight,
    viabilityLevel: result?.viabilityLevel,
  };
}

export function PreAnalysisPage({ caseId }: { caseId: string }) {
  const caseDetail = useCaseDetail(caseId);
  const preAnalysis = usePreAnalysis(caseId);
  const startPreAnalysis = useStartPreAnalysis(caseId);
  const retryPreAnalysis = useRetryPreAnalysis(caseId);
  const result = preAnalysis.data || makeEmptyResult(caseId);
  const analyticsPayload = useMemo(
    () => createAnalyticsPayload(caseId, preAnalysis.data),
    [caseId, preAnalysis.data],
  );

  useEffect(() => {
    trackPreAnalysisEvent("pre_analysis_page_viewed", analyticsPayload);
  }, [analyticsPayload]);

  useEffect(() => {
    if (result.status === "queued" || result.status === "in_progress") {
      trackPreAnalysisEvent("pre_analysis_processing_viewed", analyticsPayload);
    }

    if (result.status === "completed") {
      trackPreAnalysisEvent("pre_analysis_result_viewed", analyticsPayload);
    }

    if (result.status === "error") {
      trackPreAnalysisEvent("pre_analysis_error_viewed", analyticsPayload);
    }

    if (result.status === "blocked") {
      trackPreAnalysisEvent("pre_analysis_blocked_viewed", analyticsPayload);
    }
  }, [analyticsPayload, result.status]);

  async function handleStart() {
    if (result.status === "queued" || result.status === "in_progress") {
      preAnalysis.refetch();
      return;
    }

    trackPreAnalysisEvent("pre_analysis_started_clicked", analyticsPayload);
    const nextResult = await startPreAnalysis.start();
    preAnalysis.setData(nextResult);
  }

  async function handleRetry() {
    trackPreAnalysisEvent("pre_analysis_retry_clicked", analyticsPayload);
    const nextResult = await retryPreAnalysis.retry();
    preAnalysis.setData(nextResult);
  }

  function handleUnlockClick() {
    trackPreAnalysisEvent("pre_analysis_unlock_clicked", analyticsPayload);
  }

  function handleMissingDocumentClick(_document?: MissingDocumentDto) {
    trackPreAnalysisEvent("pre_analysis_missing_document_clicked", analyticsPayload);
  }

  if (caseDetail.isLoading || preAnalysis.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  return (
    <section className="space-y-5 pb-28 md:pb-0">
      {caseDetail.data ? (
        <CaseHeader
          caseNumber={caseDetail.data.caseNumber}
          status={caseDetail.data.status}
          holderFullName={getHolderFullName(caseDetail.data.holder)}
          updatedAt={caseDetail.data.updatedAt}
        />
      ) : (
        <PageHeaderFallback caseId={caseId} />
      )}

      {caseDetail.error && !caseDetail.data ? (
        <InlineError message={caseDetail.error} onRetry={caseDetail.refetch} />
      ) : null}

      <PreAnalysisStatusGuard
        caseId={caseId}
        result={result}
        error={preAnalysis.error}
        onStart={handleStart}
        onRetry={handleRetry}
        onRefresh={preAnalysis.refetch}
        onUnlockClick={handleUnlockClick}
        onMissingDocumentClick={handleMissingDocumentClick}
        isStarting={startPreAnalysis.isLoading}
        isRetrying={retryPreAnalysis.isLoading}
        startError={startPreAnalysis.error}
        retryError={retryPreAnalysis.error}
      />
    </section>
  );
}

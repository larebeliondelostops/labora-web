"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import {
  CalculationsTab,
  CaseAnalysisHeader,
  ConfidenceTab,
  DataErrorPanel,
  EmptyPanel,
  ExecutiveResultTab,
  FullAnalysisBlockedState,
  FullAnalysisErrorState,
  FullAnalysisFooterMeta,
  FullAnalysisProcessing,
  FullAnalysisReviewState,
  FullAnalysisSkeleton,
  FullAnalysisStartCard,
  FullAnalysisTabs,
  InconsistenciesTab,
  RulesTab,
  ScenariosTab,
} from "@/src/modules/full-analysis/components/full-analysis-components";
import type { FullAnalysisTab } from "@/src/modules/full-analysis/components/full-analysis-components";
import {
  useCalculations,
  useConfidence,
  useFullAnalysis,
  useInconsistencies,
  useRetryFullAnalysis,
  useRulesResults,
  useScenarios,
  useStartFullAnalysis,
} from "@/src/modules/full-analysis/hooks/useFullAnalysis";
import type { RulesQuery } from "@/src/modules/full-analysis/api/full-analysis.types";

const validTabs: FullAnalysisTab[] = [
  "resumen",
  "reglas",
  "calculos",
  "escenarios",
  "matriz",
  "confianza",
];

const processingStatuses = [
  "queued",
  "in_progress",
  "rules_running",
  "calculations_running",
  "scenario_comparison_running",
  "confidence_evaluation_running",
];

function isFullAnalysisTab(value: string | null): value is FullAnalysisTab {
  return Boolean(value && validTabs.includes(value as FullAnalysisTab));
}

function isProcessingStatus(status?: string) {
  return Boolean(status && processingStatuses.includes(status));
}

function trackFullAnalysisEvent(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("labora:analytics", {
      detail: {
        event,
        payload,
      },
    }),
  );
}

export function FullAnalysisPage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: FullAnalysisTab = isFullAnalysisTab(tabParam)
    ? tabParam
    : "resumen";
  const [ruleFilter, setRuleFilter] = useState<RulesQuery["filter"]>("all");
  const analysisResource = useFullAnalysis(caseId);
  const startMutation = useStartFullAnalysis(caseId);
  const retryMutation = useRetryFullAnalysis(caseId);
  const caseDetail = useCaseDetail(caseId);
  const analysis = analysisResource.data;
  const isCompleted = analysis?.status === "completed";
  const canLoadTabData = Boolean(isCompleted || analysis?.status === "requires_review");

  const rules = useRulesResults(
    caseId,
    canLoadTabData && activeTab === "reglas",
    { filter: ruleFilter },
  );
  const calculations = useCalculations(
    caseId,
    canLoadTabData && activeTab === "calculos",
  );
  const scenarios = useScenarios(
    caseId,
    canLoadTabData && activeTab === "escenarios",
  );
  const inconsistencies = useInconsistencies(
    caseId,
    canLoadTabData && activeTab === "matriz",
  );
  const confidence = useConfidence(
    caseId,
    canLoadTabData && activeTab === "confianza",
  );

  const analyticsPayload = useMemo(
    () => ({
      caseId,
      analysisId: analysis?.id,
      status: analysis?.status,
      tab: activeTab,
      version: analysis?.version,
    }),
    [activeTab, analysis?.id, analysis?.status, analysis?.version, caseId],
  );

  useEffect(() => {
    trackFullAnalysisEvent("full_analysis_page_viewed", analyticsPayload);
  }, [analyticsPayload]);

  useEffect(() => {
    if (!analysis) {
      return;
    }

    if (isProcessingStatus(analysis.status)) {
      trackFullAnalysisEvent("full_analysis_progress_viewed", analyticsPayload);
    }

    if (analysis.status === "completed") {
      trackFullAnalysisEvent("full_analysis_completed_viewed", analyticsPayload);
      router.prefetch(`/app/cases/${caseId}/report`);
    }

    if (analysis.status === "requires_review") {
      trackFullAnalysisEvent("full_analysis_requires_review_viewed", analyticsPayload);
    }
  }, [analyticsPayload, analysis, caseId, router]);

  useEffect(() => {
    const eventByTab: Record<FullAnalysisTab, string> = {
      resumen: "full_analysis_completed_viewed",
      reglas: "full_analysis_rules_tab_viewed",
      calculos: "full_analysis_calculations_tab_viewed",
      escenarios: "full_analysis_scenarios_tab_viewed",
      matriz: "full_analysis_inconsistencies_tab_viewed",
      confianza: "full_analysis_confidence_tab_viewed",
    };

    if (analysis?.status === "completed" || analysis?.status === "requires_review") {
      trackFullAnalysisEvent(eventByTab[activeTab], analyticsPayload);
    }
  }, [activeTab, analyticsPayload, analysis?.status]);

  async function handleStart() {
    trackFullAnalysisEvent("full_analysis_start_clicked", analyticsPayload);

    try {
      const response = await startMutation.start();
      analysisResource.setData(response.analysis);
      trackFullAnalysisEvent("full_analysis_started_success", {
        ...analyticsPayload,
        status: response.analysis.status,
      });
    } catch {
      trackFullAnalysisEvent("full_analysis_started_failed", analyticsPayload);
    }
  }

  async function handleRetry() {
    trackFullAnalysisEvent("full_analysis_retry_clicked", analyticsPayload);
    const response = await retryMutation.retry();
    analysisResource.setData(response.analysis);
  }

  if (analysisResource.isLoading || caseDetail.isLoading) {
    return <FullAnalysisSkeleton />;
  }

  if (analysisResource.error && !analysis) {
    return (
      <FullAnalysisErrorState
        caseId={caseId}
        message={analysisResource.error}
        canRetry
        onRetry={analysisResource.refetch}
      />
    );
  }

  if (!analysis) {
    return (
      <EmptyPanel
        title="Aun no se ha iniciado el analisis completo"
        message="Cuando el backend habilite el modulo, podras iniciar el analisis desde aqui."
      />
    );
  }

  if (analysis.status === "blocked") {
    return (
      <section className="space-y-5 pb-24 md:pb-0">
        {caseDetail.data ? (
          <CaseHeader
            caseNumber={caseDetail.data.caseNumber}
            status={caseDetail.data.status}
            holderFullName={getHolderFullName(caseDetail.data.holder)}
            updatedAt={caseDetail.data.updatedAt}
          />
        ) : null}
        <CaseAnalysisHeader caseId={caseId} analysis={analysis} />
        <FullAnalysisBlockedState caseId={caseId} reason={analysis.blockedReason} />
      </section>
    );
  }

  if (analysis.status === "not_started") {
    return (
      <section className="space-y-5 pb-24 md:pb-0">
        {caseDetail.data ? (
          <CaseHeader
            caseNumber={caseDetail.data.caseNumber}
            status={caseDetail.data.status}
            holderFullName={getHolderFullName(caseDetail.data.holder)}
            updatedAt={caseDetail.data.updatedAt}
          />
        ) : null}
        <CaseAnalysisHeader caseId={caseId} analysis={analysis} />
        <FullAnalysisStartCard
          analysis={analysis}
          caseId={caseId}
          onStart={handleStart}
          isStarting={startMutation.isLoading}
          startError={startMutation.error}
        />
      </section>
    );
  }

  if (isProcessingStatus(analysis.status)) {
    return (
      <section className="space-y-5 pb-24 md:pb-0">
        {caseDetail.data ? (
          <CaseHeader
            caseNumber={caseDetail.data.caseNumber}
            status={caseDetail.data.status}
            holderFullName={getHolderFullName(caseDetail.data.holder)}
            updatedAt={caseDetail.data.updatedAt}
          />
        ) : null}
        <CaseAnalysisHeader caseId={caseId} analysis={analysis} />
        <FullAnalysisProcessing analysis={analysis} caseId={caseId} />
      </section>
    );
  }

  if (analysis.status === "failed" || analysis.status === "cancelled") {
    return (
      <section className="space-y-5 pb-24 md:pb-0">
        {caseDetail.data ? (
          <CaseHeader
            caseNumber={caseDetail.data.caseNumber}
            status={caseDetail.data.status}
            holderFullName={getHolderFullName(caseDetail.data.holder)}
            updatedAt={caseDetail.data.updatedAt}
          />
        ) : null}
        <CaseAnalysisHeader caseId={caseId} analysis={analysis} />
        <FullAnalysisErrorState
          caseId={caseId}
          message={analysisResource.error || analysis.warnings[0]?.message}
          canRetry={analysis.canRetry}
          onRetry={handleRetry}
          isRetrying={retryMutation.isLoading}
        />
      </section>
    );
  }

  function renderActiveTab(currentAnalysis: NonNullable<typeof analysis>) {
    if (activeTab === "resumen") {
      return <ExecutiveResultTab analysis={currentAnalysis} caseId={caseId} />;
    }

    if (activeTab === "reglas") {
      return (
        <RulesTab
          data={rules.data}
          isLoading={rules.isLoading}
          error={rules.error}
          onRetry={rules.refetch}
          filter={ruleFilter}
          onFilterChange={setRuleFilter}
        />
      );
    }

    if (activeTab === "calculos") {
      return (
        <CalculationsTab
          data={calculations.data}
          isLoading={calculations.isLoading}
          error={calculations.error}
          onRetry={calculations.refetch}
        />
      );
    }

    if (activeTab === "escenarios") {
      return (
        <ScenariosTab
          data={scenarios.data}
          isLoading={scenarios.isLoading}
          error={scenarios.error}
          onRetry={scenarios.refetch}
        />
      );
    }

    if (activeTab === "matriz") {
      return (
        <InconsistenciesTab
          data={inconsistencies.data}
          isLoading={inconsistencies.isLoading}
          error={inconsistencies.error}
          onRetry={inconsistencies.refetch}
          caseId={caseId}
        />
      );
    }

    return (
      <ConfidenceTab
        data={confidence.data}
        fallback={currentAnalysis.confidence}
        isLoading={confidence.isLoading}
        error={confidence.error}
        onRetry={confidence.refetch}
      />
    );
  }

  return (
    <section className="space-y-5 pb-24 md:pb-0">
      {caseDetail.data ? (
        <CaseHeader
          caseNumber={caseDetail.data.caseNumber}
          status={caseDetail.data.status}
          holderFullName={getHolderFullName(caseDetail.data.holder)}
          updatedAt={caseDetail.data.updatedAt}
        />
      ) : null}
      {caseDetail.error && !caseDetail.data ? (
        <DataErrorPanel message={caseDetail.error} onRetry={caseDetail.refetch} />
      ) : null}
      <CaseAnalysisHeader caseId={caseId} analysis={analysis} />
      {analysis.status === "requires_review" ? (
        <FullAnalysisReviewState analysis={analysis} caseId={caseId} />
      ) : null}
      <FullAnalysisTabs caseId={caseId} activeTab={activeTab} />
      {renderActiveTab(analysis)}
      <FullAnalysisFooterMeta analysis={analysis} />
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calculator,
  ClipboardList,
  FileQuestion,
  FileText,
  Route,
  ScrollText,
} from "lucide-react";
import type { ReactNode } from "react";

import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { cn } from "@/lib/utils";
import { CaseResultHeader } from "@/src/modules/result/components/CaseResultHeader";
import { EconomicEstimateCard } from "@/src/modules/result/components/EconomicEstimateCard";
import { ExecutiveSummaryCard } from "@/src/modules/result/components/ExecutiveSummaryCard";
import { InconsistencyMatrix } from "@/src/modules/result/components/InconsistencyMatrix";
import { LegalDisclaimerAlert } from "@/src/modules/result/components/LegalDisclaimerAlert";
import { MainInconsistencyCard } from "@/src/modules/result/components/MainInconsistencyCard";
import { MissingDocumentsList } from "@/src/modules/result/components/MissingDocumentsList";
import { ProfessionalReviewCTA } from "@/src/modules/professional-review/components/professional-review-components";
import { RecommendedRoutePanel } from "@/src/modules/result/components/RecommendedRoutePanel";
import { ResultActionsBar } from "@/src/modules/result/components/ResultActionsBar";
import { ResultBlockedState } from "@/src/modules/result/components/ResultBlockedState";
import { ResultEmptyState } from "@/src/modules/result/components/ResultEmptyState";
import { ResultErrorState } from "@/src/modules/result/components/ResultErrorState";
import { ResultHero } from "@/src/modules/result/components/ResultHero";
import { ResultKpiGrid } from "@/src/modules/result/components/ResultKpiGrid";
import { ResultLoadingSkeleton } from "@/src/modules/result/components/ResultLoadingSkeleton";
import { emitResultEvent, useResultActions } from "@/src/modules/result/hooks/useResultActions";
import { useCaseResult } from "@/src/modules/result/hooks/useCaseResult";
import type {
  CaseResultResponse,
  ResultCard,
  ResultTone,
} from "@/src/modules/result/api/result.types";
import {
  formatCOP,
  formatScore,
} from "@/src/modules/result/utils/result-formatters";

type ResultTab =
  | "resumen"
  | "inconsistencias"
  | "calculo"
  | "ruta"
  | "documentos"
  | "siguientes";

const tabs: Array<{ id: ResultTab; label: string; icon: ReactNode }> = [
  { id: "resumen", label: "Resumen", icon: <ScrollText className="h-4 w-4" aria-hidden="true" /> },
  { id: "inconsistencias", label: "Inconsistencias", icon: <ClipboardList className="h-4 w-4" aria-hidden="true" /> },
  { id: "calculo", label: "Calculo", icon: <Calculator className="h-4 w-4" aria-hidden="true" /> },
  { id: "ruta", label: "Ruta recomendada", icon: <Route className="h-4 w-4" aria-hidden="true" /> },
  { id: "documentos", label: "Documentos", icon: <FileQuestion className="h-4 w-4" aria-hidden="true" /> },
  { id: "siguientes", label: "Siguientes pasos", icon: <FileText className="h-4 w-4" aria-hidden="true" /> },
];

function isResultTab(value: string | null): value is ResultTab {
  return Boolean(value && tabs.some((tab) => tab.id === value));
}

function toneFromViability(result: CaseResultResponse): ResultTone {
  if (result.finalViability?.level === "high") {
    return "success";
  }

  if (result.finalViability?.level === "medium" || result.finalViability?.level === "incomplete") {
    return "warning";
  }

  if (result.finalViability?.level === "low") {
    return "danger";
  }

  return "neutral";
}

function buildFallbackCards(result: CaseResultResponse): ResultCard[] {
  if (result.cards.length) {
    return result.cards;
  }

  const estimate = result.economicEstimate;
  const cards: ResultCard[] = [
    {
      key: "viability",
      title: "Viabilidad",
      value: result.finalViability?.label || null,
      description: result.finalViability?.rationale || null,
      icon: "viability",
      tone: toneFromViability(result),
    },
    {
      key: "inconsistency",
      title: "Inconsistencia principal",
      value: result.mainInconsistency?.title || null,
      description: result.mainInconsistency?.description || null,
      icon: "inconsistency",
      tone: result.mainInconsistency ? "warning" : "neutral",
    },
    {
      key: "route",
      title: "Ruta recomendada",
      value: result.recommendedRoute?.title || null,
      description: result.recommendedRoute?.description || null,
      icon: "route",
      tone: result.recommendedRoute?.blockers.length ? "warning" : "info",
    },
    {
      key: "missing_documents",
      title: "Documentos faltantes",
      value: `${result.missingDocuments.length}`,
      description:
        result.missingDocuments.length > 0
          ? "Hay soportes pendientes para robustecer el expediente."
          : "No hay documentos faltantes reportados.",
      icon: "missing_documents",
      tone: result.missingDocuments.length > 0 ? "warning" : "success",
    },
  ];

  if (estimate?.hasEconomicEstimate) {
    cards.splice(
      1,
      0,
      {
        key: "estimated_claimable_amount",
        title: "Valor estimado reclamable",
        value: formatCOP(estimate.estimatedClaimableAmount),
        description: "Monto estimado enviado por el backend.",
        icon: "estimated_claimable_amount",
        tone: "info",
      },
      {
        key: "retroactive",
        title: "Retroactivo estimado",
        value: formatCOP(estimate.estimatedRetroactiveAmount),
        description: "Retroactivo aproximado si aplica al caso.",
        icon: "retroactive",
        tone: "info",
      },
    );
  }

  return cards;
}

function hasEconomicAmounts(result: CaseResultResponse) {
  const estimate = result.economicEstimate;

  return Boolean(
    estimate?.hasEconomicEstimate &&
      (estimate.estimatedClaimableAmount !== null ||
        estimate.estimatedRetroactiveAmount !== null ||
        estimate.estimatedMonthlyDifference !== null ||
        estimate.minAmount !== null ||
        estimate.maxAmount !== null),
  );
}

function ResultTabs({
  caseId,
  activeTab,
}: {
  caseId: string;
  activeTab: ResultTab;
}) {
  return (
    <nav
      aria-label="Secciones del resultado completo"
      className="flex gap-2 overflow-x-auto rounded-2xl border border-labora-ui bg-white p-2 shadow-panel"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;

        return (
          <Link
            key={tab.id}
            href={`/app/cases/${caseId}/result?tab=${tab.id}`}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
              active
                ? "bg-labora-green text-white"
                : "text-labora-gray hover:bg-labora-ivory hover:text-labora-deep",
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ResultPage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: ResultTab = isResultTab(tabParam) ? tabParam : "resumen";
  const resultResource = useCaseResult(caseId);
  const caseDetail = useCaseDetail(caseId);
  const result = resultResource.data;
  const { trackAction } = useResultActions(result);
  const cards = useMemo(() => (result ? buildFallbackCards(result) : []), [result]);

  const analyticsPayload = useMemo(
    () => ({
      caseId,
      resultId: result?.resultId,
      status: result?.status,
      routeType: result?.recommendedRoute?.routeType,
      viabilityLevel: result?.finalViability?.level,
      timestamp: new Date().toISOString(),
    }),
    [
      caseId,
      result?.finalViability?.level,
      result?.recommendedRoute?.routeType,
      result?.resultId,
      result?.status,
    ],
  );

  useEffect(() => {
    if (!result) {
      return;
    }

    emitResultEvent("result_page_viewed", analyticsPayload);

    if (result.status === "completed" || result.status === "approved") {
      router.prefetch(`/app/cases/${caseId}/report`);
      router.prefetch(`/app/cases/${caseId}/legal-actions`);
    }
  }, [analyticsPayload, caseId, result, router]);

  useEffect(() => {
    if (!result) {
      return;
    }

    emitResultEvent("result_tab_changed", {
      ...analyticsPayload,
      tab: activeTab,
    });
  }, [activeTab, analyticsPayload, result]);

  if (resultResource.isLoading || caseDetail.isLoading) {
    return <ResultLoadingSkeleton />;
  }

  if (resultResource.error && !result) {
    return (
      <ResultErrorState
        message={resultResource.error}
        onRetry={resultResource.refetch}
      />
    );
  }

  if (!result) {
    return <ResultEmptyState caseId={caseId} />;
  }

  const isViewable =
    result.isVisibleToUser &&
    (result.status === "completed" || result.status === "approved" || result.status === "requires_review");

  const primaryAction = result.availableActions.find(
    (action) => action.enabled && action.href,
  );

  function renderActiveTab(currentResult: CaseResultResponse) {
    if (activeTab === "inconsistencias") {
      return (
        <InconsistencyMatrix
          inconsistencies={currentResult.inconsistencies}
          onExpand={(item) =>
            emitResultEvent("result_inconsistency_expanded", {
              ...analyticsPayload,
              inconsistencyId: item.id,
              inconsistencyType: item.inconsistencyType,
            })
          }
        />
      );
    }

    if (activeTab === "calculo") {
      return <EconomicEstimateCard estimate={currentResult.economicEstimate} />;
    }

    if (activeTab === "ruta") {
      return (
        <RecommendedRoutePanel
          route={currentResult.recommendedRoute}
          actions={currentResult.availableActions}
          onAction={trackAction}
        />
      );
    }

    if (activeTab === "documentos") {
      return (
        <MissingDocumentsList
          documents={currentResult.missingDocuments}
          caseId={caseId}
          onUploadClick={(document) =>
            emitResultEvent("result_missing_document_upload_clicked", {
              ...analyticsPayload,
              documentId: document.id,
              documentName: document.name,
            })
          }
        />
      );
    }

    if (activeTab === "siguientes") {
      return (
        <ResultActionsBar
          actions={currentResult.availableActions}
          onAction={trackAction}
        />
      );
    }

    return (
      <section className="grid gap-5 lg:grid-cols-2">
        <ExecutiveSummaryCard result={currentResult} />
        <MainInconsistencyCard inconsistency={currentResult.mainInconsistency} />
        <RecommendedRoutePanel
          route={currentResult.recommendedRoute}
          actions={currentResult.availableActions}
          onAction={trackAction}
        />
        <EconomicEstimateCard estimate={currentResult.economicEstimate} />
      </section>
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
        <ResultErrorState message={caseDetail.error} onRetry={caseDetail.refetch} />
      ) : null}

      <CaseResultHeader caseId={caseId} result={result} />

      {result.status === "error" ? (
        <ResultErrorState
          message={result.blockers[0]?.message || "El backend reporto un error tecnico."}
          onRetry={resultResource.refetch}
        />
      ) : result.status === "not_started" ? (
        <ResultEmptyState caseId={caseId} />
      ) : !isViewable ? (
        <ResultBlockedState
          result={result}
          caseId={caseId}
          onAction={trackAction}
        />
      ) : (
        <>
          <ResultHero
            result={result}
            onPrimaryAction={() => {
              if (primaryAction) {
                trackAction(primaryAction);
              }
            }}
          />

          <ResultKpiGrid cards={cards} />

          <LegalDisclaimerAlert
            legalDisclaimer={result.legalDisclaimer}
            warnings={result.warnings}
            showEconomicDisclaimer={hasEconomicAmounts(result)}
          />

          <ProfessionalReviewCTA
            caseId={caseId}
            targetType="case_result"
            targetId={result.resultId || caseId}
            recommended={
              result.recommendedRoute?.requiresProfessionalReview ||
              result.status === "requires_review"
            }
            requiresReview={Boolean(result.recommendedRoute?.requiresProfessionalReview)}
            riskLevel={result.finalViability?.level}
          />

          <ResultTabs caseId={caseId} activeTab={activeTab} />

          {renderActiveTab(result)}

          {activeTab !== "siguientes" ? (
            <ResultActionsBar actions={result.availableActions} onAction={trackAction} />
          ) : null}

          <p className="text-xs text-labora-gray">
            Version {result.version ?? "sin dato"} · Score{" "}
            {formatScore(result.finalViability?.score)}
          </p>
        </>
      )}
    </section>
  );
}

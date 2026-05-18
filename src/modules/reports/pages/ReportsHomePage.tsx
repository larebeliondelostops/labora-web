"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LockKeyhole, RefreshCcw, Sparkles } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import type { CaseStatus } from "@/src/modules/cases/api/cases.types";
import { CaseReportsNavigation } from "@/src/modules/reports/components/CaseReportsNavigation";
import { ReportCard } from "@/src/modules/reports/components/ReportCard";
import { ReportStatusBadge } from "@/src/modules/reports/components/ReportStatusBadge";
import { useCreateReport, useReports } from "@/src/modules/reports/hooks/useReports";
import type {
  ReportStatus,
  ReportSummary,
  ReportType,
} from "@/src/modules/reports/api/reports.types";
import {
  reportTypeDescriptions,
  reportTypeLabels,
} from "@/src/modules/reports/utils/reportFormatters";

const reportTypes: ReportType[] = [
  "executive",
  "technical",
  "calculation",
  "inconsistency_matrix",
  "full",
];

const unlockedStatuses: CaseStatus[] = [
  "paid_unlocked",
  "analysis_in_progress",
  "completed",
  "requires_review",
];

const analysisReadyStatuses: CaseStatus[] = ["completed", "requires_review"];

function isUnlocked(status?: CaseStatus) {
  return Boolean(status && unlockedStatuses.includes(status));
}

function isAnalysisReady(status?: CaseStatus) {
  return Boolean(status && analysisReadyStatuses.includes(status));
}

function getPlaceholderStatus(status?: CaseStatus): ReportStatus {
  if (!isUnlocked(status)) {
    return "blocked";
  }

  if (!isAnalysisReady(status)) {
    return "blocked";
  }

  return "not_started";
}

function buildReportCards(items: ReportSummary[], status?: CaseStatus) {
  return reportTypes.map((reportType) => {
    const existing = items.find((item) => item.reportType === reportType);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();

    return {
      id: "",
      caseId: "",
      title: reportTypeLabels[reportType],
      reportType,
      status: getPlaceholderStatus(status),
      createdAt: now,
      updatedAt: now,
    } satisfies ReportSummary;
  });
}

function ModuleStatePanel({
  caseId,
  status,
  hasReports,
}: {
  caseId: string;
  status?: CaseStatus;
  hasReports: boolean;
}) {
  if (!isUnlocked(status)) {
    return (
      <section className="rounded-2xl border border-labora-deep/20 bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Informe bloqueado
              </h2>
              <p className="mt-1 text-sm leading-6 text-labora-gray">
                Para acceder al informe completo debes desbloquear el analisis del expediente.
              </p>
            </div>
          </div>
          <Link
            href={`/app/cases/${caseId}/checkout`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep"
          >
            Ir a pago
          </Link>
        </div>
      </section>
    );
  }

  if (!isAnalysisReady(status)) {
    return (
      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-900 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Sparkles className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-lg font-semibold">Analisis en proceso</h2>
              <p className="mt-1 text-sm leading-6">
                El informe estara disponible cuando termine el analisis completo del expediente.
              </p>
            </div>
          </div>
          <Link
            href={`/app/cases/${caseId}/full-analysis`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100"
          >
            Ver progreso del analisis
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Estado general del modulo
            </h2>
            <ReportStatusBadge status={hasReports ? "ready" : "not_started"} />
          </div>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            {hasReports
              ? "Tu informe esta listo o en proceso. Puedes abrir cada salida disponible."
              : "Aun no hay informes generados para este expediente."}
          </p>
        </div>
      </div>
    </section>
  );
}

export function ReportsHomePage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const caseDetail = useCaseDetail(caseId);
  const reports = useReports(caseId);
  const createReport = useCreateReport(caseId);
  const [busyType, setBusyType] = useState<ReportType | null>(null);

  const cards = useMemo(
    () => buildReportCards(reports.data.items, caseDetail.data?.status),
    [caseDetail.data?.status, reports.data.items],
  );

  async function handleGenerate(reportType: ReportType) {
    setBusyType(reportType);

    try {
      const response = await createReport.create({
        reportType,
        outputMode: "async",
      });
      await reports.refetch();

      if (response.reportId && (response.status === "ready" || response.status === "completed")) {
        router.push(`/app/cases/${caseId}/reports/${response.reportId}`);
      }
    } finally {
      setBusyType(null);
    }
  }

  if (caseDetail.isLoading || reports.isLoading) {
    return (
      <section className="grid gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
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
        <InlineAlert tone="error">{caseDetail.error}</InlineAlert>
      ) : null}

      <CaseReportsNavigation caseId={caseId} />

      <ModuleStatePanel
        caseId={caseId}
        status={caseDetail.data?.status}
        hasReports={reports.data.items.length > 0}
      />

      {reports.error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="text-sm font-semibold">{reports.error}</p>
            </div>
            <button
              type="button"
              onClick={reports.refetch}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        </section>
      ) : null}

      {createReport.error ? (
        <InlineAlert tone="error">{createReport.error}</InlineAlert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((report) => (
          <ReportCard
            key={report.reportType}
            reportType={report.reportType}
            title={report.title}
            description={reportTypeDescriptions[report.reportType]}
            status={report.status}
            updatedAt={report.updatedAt}
            versionNumber={report.versionNumber}
            isBusy={busyType === report.reportType}
            onGenerate={() => handleGenerate(report.reportType)}
            onOpen={
              report.id
                ? () => router.push(`/app/cases/${caseId}/reports/${report.id}`)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import {
  Clock3,
  Edit3,
  FileUp,
  History,
  RotateCcw,
} from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { CaseHistoryTimeline } from "@/src/modules/cases/components/CaseHistoryTimeline";
import { CaseProgressTimeline } from "@/src/modules/cases/components/CaseProgressTimeline";
import { CaseSummaryCard } from "@/src/modules/cases/components/CaseSummaryCard";
import { NextActionCard } from "@/src/modules/cases/components/NextActionCard";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { useCaseHistory } from "@/src/modules/cases/hooks/useCaseHistory";
import { formatDateTime, getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { getCaseStatusMeta } from "@/src/modules/cases/utils/caseStatus";

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
      <p className="text-sm font-semibold">{message}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
        <Link
          href="/app/cases"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700"
        >
          Volver a mis expedientes
        </Link>
      </div>
    </div>
  );
}

export function CaseDetailPage({ caseId }: { caseId: string }) {
  const { data: laboraCase, isLoading, error, refetch } = useCaseDetail(caseId);
  const {
    data: history,
    isLoading: historyLoading,
    error: historyError,
  } = useCaseHistory(caseId, Boolean(laboraCase));

  if (isLoading) {
    return (
      <div className="grid gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !laboraCase) {
    return <ErrorPanel message={error || "No encontramos este expediente."} onRetry={refetch} />;
  }

  const statusMeta = getCaseStatusMeta(laboraCase.status);
  const recentHistory = history.slice(0, 3);

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      <CaseHeader
        caseNumber={laboraCase.caseNumber}
        status={laboraCase.status}
        holderFullName={getHolderFullName(laboraCase.holder)}
        updatedAt={laboraCase.updatedAt}
      />

      <NextActionCard
        nextBestAction={laboraCase.nextBestAction}
        allowedActions={laboraCase.allowedActions}
        caseId={laboraCase.id}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <CaseSummaryCard laboraCase={laboraCase} />
          <CaseProgressTimeline status={laboraCase.status} />
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Estado actual
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">{statusMeta.message}</p>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="font-semibold text-labora-charcoal">Paso</dt>
                <dd className="mt-1 text-labora-gray">{laboraCase.currentStep}</dd>
              </div>
              <div>
                <dt className="font-semibold text-labora-charcoal">Ultima actualizacion</dt>
                <dd className="mt-1 text-labora-gray">{formatDateTime(laboraCase.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Accesos rapidos
            </h2>
            <div className="mt-4 grid gap-2">
              <Link
                href={`/app/cases/${laboraCase.id}/edit`}
                className="flex min-h-11 items-center gap-3 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
              >
                <Edit3 className="h-4 w-4" aria-hidden="true" />
                Editar expediente
              </Link>
              <Link
                href={`/app/cases/${laboraCase.id}/documents`}
                className="flex min-h-11 items-center gap-3 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
              >
                <FileUp className="h-4 w-4" aria-hidden="true" />
                Subir documentos
              </Link>
              <Link
                href={`/app/cases/${laboraCase.id}/history`}
                className="flex min-h-11 items-center gap-3 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
              >
                <History className="h-4 w-4" aria-hidden="true" />
                Ver historial
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-labora-green" aria-hidden="true" />
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Historial reciente
            </h2>
          </div>
          <Link
            href={`/app/cases/${laboraCase.id}/history`}
            className="text-sm font-semibold text-labora-deep hover:text-labora-green"
          >
            Ver todo
          </Link>
        </div>
        {historyLoading ? <SkeletonCard /> : null}
        {!historyLoading && historyError ? (
          <InlineAlert tone="warning">{historyError}</InlineAlert>
        ) : null}
        {!historyLoading && !historyError ? (
          <CaseHistoryTimeline items={recentHistory} />
        ) : null}
      </section>

      {laboraCase.nextBestAction !== "none" ? (
        <Link
          href={`/app/cases/${laboraCase.id}/next`}
          className="fixed inset-x-4 bottom-4 z-20 inline-flex min-h-12 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white shadow-panel md:hidden"
        >
          Continuar
        </Link>
      ) : null}
    </section>
  );
}

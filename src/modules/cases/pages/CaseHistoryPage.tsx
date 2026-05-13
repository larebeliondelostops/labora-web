"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

import { SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseHistoryTimeline } from "@/src/modules/cases/components/CaseHistoryTimeline";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { useCaseHistory } from "@/src/modules/cases/hooks/useCaseHistory";

export function CaseHistoryPage({ caseId }: { caseId: string }) {
  const { data: laboraCase } = useCaseDetail(caseId);
  const { data, isLoading, error, refetch } = useCaseHistory(caseId);

  return (
    <section className="space-y-5">
      <Link
        href={`/app/cases/${caseId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al expediente
      </Link>

      <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
          Trazabilidad
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
          Historial del expediente
        </h1>
        <p className="mt-2 text-sm text-labora-gray">
          {laboraCase?.caseNumber || caseId}
        </p>
      </header>

      {isLoading ? <SkeletonCard /> : null}

      {!isLoading && error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="text-sm font-semibold">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : null}

      {!isLoading && !error ? <CaseHistoryTimeline items={data} /> : null}
    </section>
  );
}

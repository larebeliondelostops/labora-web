"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { CaseProgressTimeline } from "@/src/modules/cases/components/CaseProgressTimeline";
import { NextActionCard } from "@/src/modules/cases/components/NextActionCard";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { CaseReportsNavigation } from "@/src/modules/reports/components/CaseReportsNavigation";

export function CaseProgressPage({ caseId }: { caseId: string }) {
  const caseDetail = useCaseDetail(caseId);

  if (caseDetail.isLoading) {
    return (
      <section className="grid gap-5">
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  if (caseDetail.error || !caseDetail.data) {
    return (
      <section className="space-y-5">
        <InlineAlert tone="error">
          {caseDetail.error || "No encontramos este expediente."}
        </InlineAlert>
      </section>
    );
  }

  const laboraCase = caseDetail.data;

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      <CaseHeader
        caseNumber={laboraCase.caseNumber}
        status={laboraCase.status}
        holderFullName={getHolderFullName(laboraCase.holder)}
        updatedAt={laboraCase.updatedAt}
      />

      <CaseReportsNavigation caseId={caseId} active="Progreso" />

      <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <Link
          href={`/app/cases/${caseId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al expediente
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
          Progreso del expediente
        </h1>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          Consulta las etapas principales desde el registro hasta la entrega final.
        </p>
      </header>

      <NextActionCard
        nextBestAction={laboraCase.nextBestAction}
        allowedActions={laboraCase.allowedActions}
        caseId={caseId}
      />

      <CaseProgressTimeline status={laboraCase.status} />
    </section>
  );
}

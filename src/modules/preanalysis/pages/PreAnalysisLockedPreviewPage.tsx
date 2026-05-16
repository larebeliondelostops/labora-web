"use client";

import Link from "next/link";
import { ArrowLeft, FileText, LockKeyhole, ShieldCheck } from "lucide-react";

import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import {
  InlineError,
  LoadingSkeleton,
} from "@/src/modules/documents/components/document-components";
import { PreAnalysisWarningBox } from "@/src/modules/preanalysis/components/preanalysis-components";
import { usePreAnalysis } from "@/src/modules/preanalysis/hooks/usePreAnalysis";

function PageHeaderFallback({ caseId }: { caseId: string }) {
  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
        Expediente digital
      </p>
      <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
        Expediente {caseId}
      </h1>
      <p className="mt-1 text-sm text-labora-gray">Vista previa bloqueada</p>
    </header>
  );
}

export function PreAnalysisLockedPreviewPage({ caseId }: { caseId: string }) {
  const caseDetail = useCaseDetail(caseId);
  const preAnalysis = usePreAnalysis(caseId);
  const lockedItems = [
    "Calculo y validaciones completas",
    "Fundamentos juridicos aplicables",
    "Reporte tecnico del expediente",
    "Siguientes pasos y estrategia de avance",
  ];

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

      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                Vista previa bloqueada
              </p>
              <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
                Tu analisis completo esta listo para desbloquear
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
                Ya viste el valor preliminar. El detalle tecnico permanece
                bloqueado hasta activar el analisis completo.
              </p>
            </div>
          </div>
          <Link
            href={`/app/cases/${caseId}/paywall`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            Desbloquear analisis completo
          </Link>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-labora-green" aria-hidden="true" />
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Incluido al desbloquear
            </h2>
          </div>
          <ul className="mt-5 grid gap-3">
            {lockedItems.map((item) => (
              <li
                key={item}
                className="flex items-center justify-between gap-3 rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm font-semibold text-labora-charcoal"
              >
                <span>{item}</span>
                <LockKeyhole className="h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
              </li>
            ))}
          </ul>
          {preAnalysis.error ? (
            <InlineError message={preAnalysis.error} onRetry={preAnalysis.refetch} />
          ) : null}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-labora-ui bg-labora-ivory p-5 text-sm leading-6 text-labora-gray">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
              <p>
                La vista previa no revela calculo, retroactivo, fundamentos
                completos ni estrategia juridica definitiva.
              </p>
            </div>
          </section>
          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Acciones
            </h2>
            <div className="mt-4 grid gap-3">
              <Link
                href={`/app/cases/${caseId}/pre-analysis`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver al preanalisis
              </Link>
              <Link
                href={`/app/cases/${caseId}/documents`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
              >
                Subir documentos faltantes
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <PreAnalysisWarningBox />
    </section>
  );
}

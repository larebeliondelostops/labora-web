"use client";

import Link from "next/link";
import { ArrowLeft, FileSearch, LockKeyhole, ShieldCheck } from "lucide-react";

import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import {
  DocumentReadinessCard,
  EmptyState,
  InlineError,
  LoadingSkeleton,
} from "@/src/modules/documents/components/document-components";
import {
  useCaseDocuments,
  useDocumentReadiness,
} from "@/src/modules/documents/hooks/useDocuments";

export function CasePreanalysisPage({ caseId }: { caseId: string }) {
  const caseDetail = useCaseDetail(caseId);
  const documents = useCaseDocuments(caseId);
  const readiness = useDocumentReadiness(caseId, documents.data);
  const activeDocuments = documents.data.filter(
    (document) => document.status !== "deleted" && document.status !== "replaced",
  );
  const primaryDocument =
    activeDocuments.find((document) => document.isPrimary) || activeDocuments[0];

  if (caseDetail.isLoading || documents.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (caseDetail.error || !caseDetail.data) {
    return (
      <InlineError
        message={caseDetail.error || "No encontramos este expediente."}
        onRetry={caseDetail.refetch}
      />
    );
  }

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      <CaseHeader
        caseNumber={caseDetail.data.caseNumber}
        status={caseDetail.data.status}
        holderFullName={getHolderFullName(caseDetail.data.holder)}
        updatedAt={caseDetail.data.updatedAt}
      />

      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Validacion preliminar
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
              Resultado documental preliminar
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
              Este paso confirma si la documentacion cargada permite continuar.
              No muestra conclusiones juridicas finales, calculos definitivos ni
              informe completo.
            </p>
          </div>
          <Link
            href={`/app/cases/${caseId}/documents`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a documentos
          </Link>
        </div>
      </section>

      <DocumentReadinessCard
        readiness={readiness.data}
        ctaHref={`/app/cases/${caseId}/checkout`}
      />

      {documents.error ? (
        <InlineError message={documents.error} onRetry={documents.refetch} />
      ) : null}

      {primaryDocument ? (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="flex gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
                <FileSearch className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
                  Revision IA documental
                </h2>
                <p className="mt-2 text-sm leading-6 text-labora-gray">
                  Revisa el semaforo, las observaciones por pagina y el preview OCR
                  del documento principal antes de avanzar.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/app/cases/${caseId}/documents/${primaryDocument.id}/precheck`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
              >
                <FileSearch className="h-4 w-4" aria-hidden="true" />
                Ver revision preliminar
              </Link>
              <Link
                href={`/app/cases/${caseId}/documents/${primaryDocument.id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
              >
                Ver documento
              </Link>
            </div>
          </article>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-labora-ui bg-labora-ivory p-5 text-sm leading-6 text-labora-gray">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
                <p>
                  El contenido documental se trata como informacion sensible y se
                  muestra solo lo necesario para validar calidad.
                </p>
              </div>
            </section>
            <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
              <div className="flex gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
                <div>
                  <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                    Analisis completo
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-labora-gray">
                    El informe completo, calculos y escritos se desbloquean en una
                    etapa posterior.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>
      ) : (
        <EmptyState
          title="Aun no hay documentos para revisar"
          description="Carga tu historia laboral o soporte principal para activar la validacion preliminar."
          primaryAction={
            <Link
              href={`/app/cases/${caseId}/documents`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
            >
              Ir a documentos
            </Link>
          }
        />
      )}
    </section>
  );
}

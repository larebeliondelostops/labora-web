"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Download, Edit3, Loader2, Sparkles } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { QualityChecklist } from "@/src/modules/legal-actions/components/QualityChecklist";
import { useDraft, useDraftActions } from "@/src/modules/legal-actions/hooks/useLegalActions";

function EmptyQualityState({
  onRun,
  isLoading,
}: {
  onRun: () => void;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <h1 className="font-heading text-2xl font-semibold text-labora-charcoal">
        Control de calidad pendiente
      </h1>
      <p className="mt-2 text-sm leading-6 text-labora-gray">
        Ejecuta el checklist para revisar coherencia, anexos, pendientes y advertencias.
      </p>
      <button
        type="button"
        onClick={onRun}
        disabled={isLoading}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Ejecutar control de calidad
      </button>
    </section>
  );
}

export function QualityCheckPage({
  caseId,
  draftId,
}: {
  caseId: string;
  draftId: string;
}) {
  const draftResource = useDraft(draftId);
  const actions = useDraftActions(draftId);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const draft = draftResource.data;

  async function handleRunQuality() {
    setLocalMessage(null);
    const updated = await actions.runQuality(undefined);
    draftResource.setData(updated);
    setLocalMessage("Control de calidad actualizado.");
  }

  if (draftResource.isLoading) {
    return (
      <section className="grid gap-5">
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  if (draftResource.error || !draft) {
    return (
      <section className="space-y-4">
        <Link href={`/app/cases/${caseId}/legal-actions`} className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Acciones juridicas
        </Link>
        <InlineAlert tone="error">
          {draftResource.error || "No encontramos este borrador."}
        </InlineAlert>
      </section>
    );
  }

  const quality = draft.quality;
  const canExport = quality?.can_export ?? draft.status !== "quality_check_failed";

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <Link
          href={`/app/cases/${caseId}/drafts/${draftId}/edit`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al editor
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-semibold text-labora-charcoal">
          Calidad del borrador
        </h1>
        <p className="mt-2 text-sm leading-6 text-labora-gray">{draft.title}</p>
      </header>

      {localMessage ? <InlineAlert tone="success">{localMessage}</InlineAlert> : null}
      {actions.error ? <InlineAlert tone="error">{actions.error}</InlineAlert> : null}

      {quality ? (
        <>
          <QualityChecklist
            overallStatus={quality.overall_status}
            score={quality.score}
            checks={quality.checks}
          />

          {quality.critical_warnings.length ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
              <h2 className="font-heading text-lg font-semibold">Advertencias criticas</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6">
                {quality.critical_warnings.map((warning) => (
                  <li key={warning.code}>{warning.message}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {quality.recommendations.length ? (
            <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Recomendaciones
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-labora-gray">
                {quality.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <EmptyQualityState onRun={handleRunQuality} isLoading={actions.isLoading} />
      )}

      <footer className="flex flex-col gap-3 rounded-2xl border border-labora-ui bg-white p-4 shadow-panel sm:flex-row">
        <Link
          href={`/app/cases/${caseId}/drafts/${draftId}/edit`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
        >
          <Edit3 className="h-4 w-4" aria-hidden="true" />
          Volver a editar
        </Link>
        <button
          type="button"
          onClick={handleRunQuality}
          disabled={actions.isLoading}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory disabled:text-labora-gray"
        >
          Ejecutar control de calidad
        </button>
        <Link
          href={`/app/cases/${caseId}/professional-review/request?targetType=legal_draft&targetId=${draftId}&reviewType=legal_draft_review`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Solicitar revision
        </Link>
        <Link
          href={canExport ? `/app/cases/${caseId}/drafts/${draftId}/delivery` : "#"}
          aria-disabled={!canExport}
          className={
            canExport
              ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white"
              : "inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-300 px-4 py-2 text-sm font-semibold text-white"
          }
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Exportar documento
        </Link>
      </footer>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Sparkles } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { ExportPanel } from "@/src/modules/legal-actions/components/ExportPanel";
import { ProfessionalReviewBanner } from "@/src/modules/legal-actions/components/ProfessionalReviewBanner";
import { useDraft, useDraftActions } from "@/src/modules/legal-actions/hooks/useLegalActions";
import { draftStatusLabels } from "@/src/modules/legal-actions/utils/mapStatusToLabel";

export function DraftDeliveryPage({
  caseId,
  draftId,
}: {
  caseId: string;
  draftId: string;
}) {
  const draftResource = useDraft(draftId);
  const actions = useDraftActions(draftId);
  const [message, setMessage] = useState<string | null>(null);
  const draft = draftResource.data;

  async function handleExport(format: "pdf" | "docx") {
    setMessage(null);
    const updated = await actions.exportFile({ format });
    draftResource.setData(updated);
    setMessage("Estamos generando la exportacion. El historial se actualizara cuando este lista.");
  }

  async function handleSubmitReview() {
    setMessage(null);
    const updated = await actions.submitReview({
      note: "Solicitud enviada desde entrega del borrador.",
    });
    draftResource.setData(updated);
    setMessage("Solicitud de revision enviada.");
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

  const canExport =
    (draft.quality?.can_export ?? true) && draft.status !== "quality_check_failed";

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
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Entrega y exportacion
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
              {draft.title}
            </h1>
            <p className="mt-2 text-sm text-labora-gray">
              {draftStatusLabels[draft.status]}
              {draft.quality_score ? ` · calidad ${draft.quality_score}` : ""}
            </p>
          </div>
          <Link
            href={`/app/cases/${caseId}`}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Volver al expediente
          </Link>
        </div>
      </header>

      <ProfessionalReviewBanner level={draft.professional_review_level} />

      {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}
      {actions.error ? <InlineAlert tone="error">{actions.error}</InlineAlert> : null}
      {!canExport ? (
        <InlineAlert tone="warning">
          Hay bloqueos de calidad o pendientes que impiden exportar este documento.
        </InlineAlert>
      ) : null}

      <ExportPanel
        draftId={draft.id}
        canExportPdf={canExport && draft.can_export_pdf}
        canExportDocx={canExport && draft.can_export_docx}
        exports={draft.exports}
        onExport={handleExport}
        isLoading={actions.isLoading}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
            Anexos usados
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-labora-gray">
            {draft.attachments.map((attachment) => (
              <p key={attachment.id} className="rounded-lg bg-labora-ivory p-3">
                {attachment.label}
              </p>
            ))}
            {!draft.attachments.length ? <p>Sin anexos asociados.</p> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
            Pendientes
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-labora-gray">
            {draft.pending_markers.map((pending) => (
              <p key={pending.code} className="rounded-lg bg-labora-ivory p-3">
                {pending.label}
              </p>
            ))}
            {!draft.pending_markers.length ? <p>No hay pendientes marcados.</p> : null}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-labora-green/25 bg-labora-mint/25 p-5 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <BriefcaseBusiness className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Revision profesional
              </h2>
              <p className="mt-1 text-sm leading-6 text-labora-gray">
                Un abogado puede revisar este borrador para convertirlo en una version final mas segura.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={actions.isLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Solicitar revision
          </button>
        </div>
      </section>
    </section>
  );
}

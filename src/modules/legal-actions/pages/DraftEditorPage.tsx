"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Loader2, ShieldCheck } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { DraftEditor } from "@/src/modules/legal-actions/components/DraftEditor";
import { PendingDataPanel } from "@/src/modules/legal-actions/components/PendingDataPanel";
import { ProfessionalReviewBanner } from "@/src/modules/legal-actions/components/ProfessionalReviewBanner";
import { useDraft, useDraftActions } from "@/src/modules/legal-actions/hooks/useLegalActions";
import { draftStatusLabels } from "@/src/modules/legal-actions/utils/mapStatusToLabel";

const generationSteps = [
  "Organizando hechos",
  "Preparando solicitudes o pretensiones",
  "Incorporando fundamentos",
  "Ordenando pruebas y anexos",
  "Preparando editor",
];

function DraftGeneratingState({ failed }: { failed?: boolean }) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
      <div className="flex gap-4">
        {failed ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
            !
          </span>
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-labora-mint/30 text-labora-deep">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          </span>
        )}
        <div>
          <h1 className="font-heading text-2xl font-semibold text-labora-charcoal">
            {failed ? "No pudimos generar el borrador" : "Estamos armando tu escrito"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            {failed
              ? "Puedes intentarlo de nuevo o solicitar revision profesional."
              : "No cierres esta pantalla si quieres ver el resultado aqui; tambien podras volver desde Escritos generados."}
          </p>
        </div>
      </div>

      {!failed ? (
        <ol className="mt-6 grid gap-3">
          {generationSteps.map((step, index) => (
            <li key={step} className="flex items-center gap-3 rounded-lg bg-labora-ivory p-3 text-sm text-labora-charcoal">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-labora-green text-xs font-semibold text-white">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

export function DraftEditorPage({
  caseId,
  draftId,
}: {
  caseId: string;
  draftId: string;
}) {
  const searchParams = useSearchParams();
  const generatingRequested = searchParams.get("generating") === "true";
  const draftResource = useDraft(draftId);
  const caseResource = useCaseDetail(caseId);
  const actions = useDraftActions(draftId);
  const draft = draftResource.data;
  const [activeSectionId, setActiveSectionId] = useState("");

  useEffect(() => {
    if (!draft?.sections.length || activeSectionId) {
      return;
    }

    setActiveSectionId(draft.sections[0].id);
  }, [activeSectionId, draft?.sections]);

  const activeSection = useMemo(
    () => draft?.sections.find((section) => section.id === activeSectionId),
    [activeSectionId, draft?.sections],
  );

  async function handleSaveSection(sectionId: string, contentHtml: string) {
    const updated = await actions.save({
      sections: [{ id: sectionId, content_html: contentHtml }],
    });
    draftResource.setData(updated);
  }

  async function handleRegenerate(sectionId: string, instruction: string) {
    const updated = await actions.regenerateSection({
      sectionId,
      payload: { instruction },
    });
    draftResource.setData(updated);
  }

  function selectBySectionKey(sectionKey: string) {
    const section = draft?.sections.find((item) => item.section_key === sectionKey);

    if (section) {
      setActiveSectionId(section.id);
    }
  }

  if (draftResource.isLoading || caseResource.isLoading) {
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

  const isGenerating =
    draft.status === "generating" || (generatingRequested && draft.status !== "ready_for_edit");

  if (isGenerating || draft.status === "failed") {
    return (
      <section className="space-y-5">
        <DraftGeneratingState failed={draft.status === "failed"} />
      </section>
    );
  }

  const pending = [
    ...draft.pending_markers,
    ...(activeSection?.pending_markers || []),
  ];

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      {caseResource.data ? (
        <CaseHeader
          caseNumber={caseResource.data.caseNumber}
          status={caseResource.data.status}
          holderFullName={getHolderFullName(caseResource.data.holder)}
          updatedAt={caseResource.data.updatedAt}
        />
      ) : null}

      <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <Link
          href={`/app/cases/${caseId}/legal-actions/${draft.legal_action_id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Accion juridica
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Editor de escrito
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
              {draft.title}
            </h1>
            <p className="mt-2 text-sm text-labora-gray">
              {draftStatusLabels[draft.status]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/app/cases/${caseId}/drafts/${draft.id}/quality`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Control de calidad
            </Link>
            <Link
              href={`/app/cases/${caseId}/drafts/${draft.id}/delivery`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-labora-green px-3 py-2 text-sm font-semibold text-white"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Exportar
            </Link>
          </div>
        </div>
      </header>

      <ProfessionalReviewBanner level={draft.professional_review_level} />

      {actions.error ? <InlineAlert tone="error">{actions.error}</InlineAlert> : null}

      <div className="space-y-5">
        <DraftEditor
          draft={draft}
          activeSectionId={activeSectionId}
          onSectionChange={setActiveSectionId}
          onSaveSection={handleSaveSection}
          onRegenerateSection={handleRegenerate}
        />

        <div className="xl:hidden">
          <PendingDataPanel
            pending={pending}
            warnings={draft.warnings}
            missingAttachments={draft.missing_attachments}
            attachments={draft.attachments}
            onSectionSelect={selectBySectionKey}
          />
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, Edit3, FileText, History, Sparkles } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { formatDateTime, getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { EligibilityBadge } from "@/src/modules/legal-actions/components/EligibilityBadge";
import { ProfessionalReviewBanner } from "@/src/modules/legal-actions/components/ProfessionalReviewBanner";
import { useLegalAction } from "@/src/modules/legal-actions/hooks/useLegalActions";
import {
  draftStatusLabels,
  legalActionStatusLabels,
  professionalReviewLabels,
} from "@/src/modules/legal-actions/utils/mapStatusToLabel";

export function LegalActionDetailPage({
  caseId,
  actionId,
}: {
  caseId: string;
  actionId: string;
}) {
  const actionResource = useLegalAction(actionId);
  const caseResource = useCaseDetail(caseId);
  const action = actionResource.data;

  if (actionResource.isLoading || caseResource.isLoading) {
    return (
      <section className="grid gap-5">
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  if (actionResource.error || !action) {
    return (
      <section className="space-y-4">
        <Link
          href={`/app/cases/${caseId}/legal-actions`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Acciones juridicas
        </Link>
        <InlineAlert tone="error">
          {actionResource.error || "No encontramos esta accion juridica."}
        </InlineAlert>
      </section>
    );
  }

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
          href={`/app/cases/${caseId}/legal-actions`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Acciones juridicas
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Accion creada
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
              {action.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              {action.eligibility_reason || "Revisa el estado y continua con el wizard o borrador."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <EligibilityBadge status={action.eligibility_status} />
            <span className="rounded-full border border-labora-ui bg-labora-ivory px-2.5 py-1 text-xs font-semibold text-labora-gray">
              {legalActionStatusLabels[action.status]}
            </span>
          </div>
        </div>
      </header>

      <ProfessionalReviewBanner
        actionType={action.action_type}
        level={action.professional_review_level}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-5">
          {action.warnings.length ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <h2 className="font-heading text-lg font-semibold">Advertencias</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6">
                {action.warnings.map((warning) => (
                  <li key={warning.code}>{warning.message}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-labora-green" aria-hidden="true" />
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Borradores existentes
              </h2>
            </div>
            <div className="mt-4 grid gap-3">
              {action.drafts.length ? (
                action.drafts.map((draft) => (
                  <article
                    key={draft.id}
                    className="flex flex-col gap-3 rounded-lg border border-labora-ui bg-labora-ivory p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-labora-charcoal">{draft.title}</h3>
                      <p className="mt-1 text-sm text-labora-gray">
                        {draftStatusLabels[draft.status]}
                        {draft.quality_score ? ` · calidad ${draft.quality_score}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/app/cases/${caseId}/drafts/${draft.id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-labora-green px-3 py-2 text-sm font-semibold text-white"
                    >
                      Abrir borrador
                    </Link>
                  </article>
                ))
              ) : (
                <p className="text-sm text-labora-gray">
                  Aun no se ha generado un borrador para esta accion.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-labora-green" aria-hidden="true" />
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Historial
              </h2>
            </div>
            <div className="mt-4 grid gap-3">
              {action.history.length ? (
                action.history.map((item) => (
                  <article key={item.id} className="rounded-lg border border-labora-ui p-3">
                    <p className="font-semibold text-labora-charcoal">{item.title}</p>
                    <p className="mt-1 text-sm text-labora-gray">
                      {formatDateTime(item.occurred_at)}
                      {item.description ? ` · ${item.description}` : ""}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-labora-gray">Sin historial registrado.</p>
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Continuar
            </h2>
            <div className="mt-4 grid gap-2">
              <Link
                href={`/app/cases/${caseId}/legal-actions/${actionId}/wizard`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white"
              >
                <Edit3 className="h-4 w-4" aria-hidden="true" />
                Continuar wizard
              </Link>
              {action.drafts[0] ? (
                <Link
                  href={`/app/cases/${caseId}/drafts/${action.drafts[0].id}/edit`}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                >
                  Abrir borrador
                </Link>
              ) : null}
              <Link
                href={
                  action.drafts[0]
                    ? `/app/cases/${caseId}/professional-review/request?targetType=legal_draft&targetId=${action.drafts[0].id}&reviewType=legal_draft_review`
                    : `/app/cases/${caseId}/professional-review/request?targetType=case_result&targetId=${caseId}`
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Solicitar revision profesional
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Datos pendientes
            </h2>
            <div className="mt-3 grid gap-2 text-sm text-labora-gray">
              {action.pending_data.map((item) => (
                <p key={item.code} className="rounded-lg bg-labora-ivory p-3">
                  {item.label}
                </p>
              ))}
              {!action.pending_data.length ? <p>Sin datos pendientes.</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Nivel de revision
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              {professionalReviewLabels[action.professional_review_level]}
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}

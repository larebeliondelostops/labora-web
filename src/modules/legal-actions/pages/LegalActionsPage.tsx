"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import type {
  AvailableLegalActionsResponse,
  LegalActionAvailable,
  LegalActionReadinessItem,
  MissingAttachment,
} from "@/src/modules/legal-actions/api/legal-actions.types";
import { LegalActionCard } from "@/src/modules/legal-actions/components/LegalActionCard";
import { ProfessionalReviewBanner } from "@/src/modules/legal-actions/components/ProfessionalReviewBanner";
import {
  useAvailableLegalActions,
  useCreateLegalAction,
} from "@/src/modules/legal-actions/hooks/useLegalActions";

function CaseLegalHeader({
  caseId,
  data,
}: {
  caseId: string;
  data: AvailableLegalActionsResponse;
}) {
  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <Link
        href={`/app/cases/${caseId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al expediente
      </Link>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Acciones juridicas
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
            {data.case_number || "Expediente"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            {data.holder_name || "Titular del expediente"} ·{" "}
            {data.analysis_status || "Analisis completo"}
          </p>
        </div>
        <dl className="rounded-2xl border border-labora-ui bg-labora-ivory p-4 text-sm">
          <div>
            <dt className="font-semibold text-labora-charcoal">Ruta recomendada</dt>
            <dd className="mt-1 text-labora-gray">
              {data.recommended_route || "Pendiente de confirmar"}
            </dd>
          </div>
          <div className="mt-3">
            <dt className="font-semibold text-labora-charcoal">Viabilidad</dt>
            <dd className="mt-1 text-labora-gray">{data.viability || "Sin semaforo"}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}

function RecommendedActionPanel({
  action,
}: {
  action?: LegalActionAvailable;
}) {
  if (!action) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-labora-green/30 bg-labora-mint/25 p-5 shadow-panel">
      <div className="flex gap-3">
        <Sparkles className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-deep">
            Siguiente accion recomendada
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
            {action.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            {action.eligibility_reason || action.description}
          </p>
        </div>
      </div>
    </section>
  );
}

function MissingAttachmentsList({ items }: { items: MissingAttachment[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
      <h2 className="font-heading text-lg font-semibold">Documentos faltantes</h2>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <p key={item.code} className="text-sm leading-6">
            <span className="font-semibold">{item.label}</span>
            {item.description ? ` - ${item.description}` : ""}
          </p>
        ))}
      </div>
    </section>
  );
}

function LockedLegalActionsState({
  readiness,
  caseId,
}: {
  readiness: LegalActionReadinessItem[];
  caseId: string;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 shadow-panel">
      <div className="flex gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-xl font-semibold">
            Tu expediente aun no esta listo para generar escritos.
          </h2>
          <div className="mt-4 grid gap-2">
            {readiness.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-700" aria-hidden="true" />
                  )}
                  {item.label}
                </span>
                {!item.completed && item.href ? (
                  <Link href={item.href} className="font-semibold text-red-700">
                    Ir
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
          <Link
            href={`/app/cases/${caseId}/result`}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
          >
            Volver al resultado del analisis
          </Link>
        </div>
      </div>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-panel">
      <p className="text-sm font-semibold">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reintentar
      </button>
    </section>
  );
}

export function LegalActionsPage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const availableResource = useAvailableLegalActions(caseId);
  const caseResource = useCaseDetail(caseId);
  const createAction = useCreateLegalAction(caseId);
  const available = availableResource.data;
  const recommendedAction = available.actions.find(
    (action) =>
      action.is_recommended ||
      action.action_type === available.recommended_action_type,
  );

  async function handleStart(action: LegalActionAvailable) {
    setSelectedAction(action.action_type);

    try {
      const response = await createAction.create({
        action_type: action.action_type,
        selected_by_user: true,
      });

      if (response.draft_id) {
        router.push(`/app/cases/${caseId}/drafts/${response.draft_id}/edit`);
        return;
      }

      if (response.action_id) {
        router.push(`/app/cases/${caseId}/legal-actions/${response.action_id}/wizard`);
        return;
      }

      if (action.action_type === "technical_report_download") {
        router.push(`/app/cases/${caseId}/reports`);
        return;
      }

      await availableResource.refresh();
    } catch {
      setSelectedAction(null);
    }
  }

  if (availableResource.isLoading || caseResource.isLoading) {
    return (
      <section className="grid gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  if (availableResource.error) {
    return <ErrorState message={availableResource.error} onRetry={availableResource.refetch} />;
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

      <CaseLegalHeader caseId={caseId} data={available} />

      {!available.ready ? (
        <LockedLegalActionsState readiness={available.readiness} caseId={caseId} />
      ) : null}

      {createAction.error ? (
        <InlineAlert tone="error">{createAction.error}</InlineAlert>
      ) : null}

      <RecommendedActionPanel action={recommendedAction} />
      <MissingAttachmentsList items={available.missing_attachments} />

      {recommendedAction?.action_type === "lawsuit_draft" ? (
        <ProfessionalReviewBanner
          actionType={recommendedAction.action_type}
          level={recommendedAction.professional_review_level}
        />
      ) : null}

      <section>
        <div className="mb-3">
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Acciones disponibles
          </h2>
          <p className="mt-1 text-sm text-labora-gray">
            Elige el siguiente paso juridico segun el analisis completo del expediente.
          </p>
        </div>

        {available.actions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {available.actions.map((action) => (
              <LegalActionCard
                key={action.action_type}
                actionType={action.action_type}
                title={action.title}
                description={action.description}
                eligibilityStatus={action.eligibility_status}
                eligibilityReason={action.eligibility_reason}
                professionalReviewLevel={action.professional_review_level}
                warnings={action.warnings}
                missingAttachments={action.missing_attachments}
                isRecommended={action === recommendedAction}
                onStart={() => handleStart(action)}
                isLoading={selectedAction === action.action_type && createAction.isLoading}
              />
            ))}
          </div>
        ) : (
          <section className="rounded-2xl border border-labora-ui bg-white p-5 text-sm text-labora-gray shadow-panel">
            Aun no hay acciones juridicas disponibles para este expediente.
          </section>
        )}
      </section>
    </section>
  );
}

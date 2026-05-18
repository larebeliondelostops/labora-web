"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Loader2 } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { AttachmentPicker } from "@/src/modules/legal-actions/components/AttachmentPicker";
import { ClaimantForm } from "@/src/modules/legal-actions/components/ClaimantForm";
import { ClaimsBuilder } from "@/src/modules/legal-actions/components/ClaimsBuilder";
import { ProfessionalReviewBanner } from "@/src/modules/legal-actions/components/ProfessionalReviewBanner";
import { RecipientForm } from "@/src/modules/legal-actions/components/RecipientForm";
import { SuggestedFactsSelector } from "@/src/modules/legal-actions/components/SuggestedFactsSelector";
import { WizardStepper } from "@/src/modules/legal-actions/components/WizardStepper";
import type {
  LegalActionDetail,
  LegalDraftWizardData,
  WizardClaimantData,
  WizardRecipientData,
} from "@/src/modules/legal-actions/api/legal-actions.types";
import {
  useCreateDraft,
  useLegalAction,
} from "@/src/modules/legal-actions/hooks/useLegalActions";
import {
  buildWizardPayload,
  createEmptyWizardData,
} from "@/src/modules/legal-actions/utils/buildWizardPayload";
import {
  actionNeedsAcknowledgement,
  legalActionTypeLabels,
  professionalReviewLabels,
} from "@/src/modules/legal-actions/utils/mapStatusToLabel";

const steps = [
  { id: "summary", label: "Resumen" },
  { id: "claimant", label: "Solicitante" },
  { id: "recipient", label: "Destinatario" },
  { id: "facts", label: "Hechos" },
  { id: "claims", label: "Solicitudes" },
  { id: "attachments", label: "Anexos" },
  { id: "review", label: "Revision final" },
];

type WizardErrors = Record<string, string>;

function isValidEmail(value: string) {
  if (!value.trim()) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateStep(
  index: number,
  data: LegalDraftWizardData,
  action: LegalActionDetail,
): WizardErrors {
  const errors: WizardErrors = {};

  if (index === 1) {
    if (!data.claimant.claimant_name.trim()) {
      errors.claimant_name = "El nombre es obligatorio.";
    }

    if (!data.claimant.claimant_document_type.trim()) {
      errors.claimant_document_type = "Selecciona el tipo de documento.";
    }

    if (!data.claimant.claimant_document_number.trim()) {
      errors.claimant_document_number = "El numero de documento es obligatorio.";
    }

    if (!data.claimant.claimant_email.trim() && !data.claimant.claimant_address.trim()) {
      errors.claimant_email = "Indica correo o direccion para notificacion.";
      errors.claimant_address = "Indica correo o direccion para notificacion.";
    }

    if (!isValidEmail(data.claimant.claimant_email)) {
      errors.claimant_email = "Ingresa un correo valido.";
    }

    if (data.claimant.acts_on_behalf_of_third_party) {
      if (!data.claimant.representative_name.trim()) {
        errors.representative_name = "El representante es obligatorio.";
      }

      if (!data.claimant.representative_document.trim()) {
        errors.representative_document = "El documento del representante es obligatorio.";
      }
    }
  }

  if (index === 2) {
    if (action.action_type === "lawsuit_draft") {
      if (!data.recipient.defendant_name.trim()) {
        errors.defendant_name = "El demandado es obligatorio.";
      }

      if (!data.recipient.recipient_city.trim()) {
        errors.recipient_city = "La ciudad es obligatoria.";
      }
    } else if (!data.recipient.recipient_entity.trim()) {
      errors.recipient_entity = "La entidad destinataria es obligatoria.";
    }

    if (!isValidEmail(data.recipient.recipient_email)) {
      errors.recipient_email = "Ingresa un correo valido.";
    }
  }

  if (index === 3) {
    const hasSelected = data.facts.selected_facts.length > 0;
    const hasAdditional = data.facts.additional_facts.trim().length >= 10;

    if (!hasSelected && !hasAdditional) {
      errors.facts = "Selecciona al menos un hecho o agrega uno adicional.";
    }
  }

  if (index === 4) {
    if (action.action_type === "lawsuit_draft") {
      if (!data.claims.main_claims.some((claim) => claim.trim())) {
        errors.claims = "Agrega al menos una pretension principal.";
      }
    } else if (
      !data.claims.requests.some((request) => request.trim()) &&
      !data.claims.requested_outcome.trim()
    ) {
      errors.claims = "Agrega al menos una solicitud concreta.";
    }
  }

  if (index === 6 && actionNeedsAcknowledgement(action.action_type, action.professional_review_level)) {
    if (!data.acknowledgement_accepted) {
      errors.acknowledgement_accepted = "Debes aceptar el alcance del borrador.";
    }
  }

  return errors;
}

function getInitialWizardData(action: LegalActionDetail): LegalDraftWizardData {
  const data = createEmptyWizardData();

  data.facts.selected_facts = action.suggested_facts
    .filter((fact) => fact.selected)
    .map((fact) => fact.id);
  data.claims.requests = action.suggested_requests
    .filter((request) => request.kind === "request" && request.selected)
    .map((request) => request.text);
  data.claims.main_claims = action.suggested_requests
    .filter((request) => request.kind === "main_claim" && request.selected)
    .map((request) => request.text);
  data.claims.subsidiary_claims = action.suggested_requests
    .filter((request) => request.kind === "subsidiary_claim" && request.selected)
    .map((request) => request.text);
  data.attachments.selected_attachments = action.attachments
    .filter((attachment) => attachment.suggested && attachment.status === "available")
    .map((attachment) => attachment.id);

  return data;
}

function SummaryStep({ action }: { action: LegalActionDetail }) {
  return (
    <section className="grid gap-5 rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
          Resumen de la accion
        </p>
        <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
          {action.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          {action.eligibility_reason ||
            "Labora usara la informacion del informe, los anexos y las respuestas del usuario para construir el borrador."}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-labora-ui bg-labora-ivory p-4">
          <p className="text-xs font-semibold text-labora-gray">Tipo</p>
          <p className="mt-1 text-sm font-semibold text-labora-charcoal">
            {legalActionTypeLabels[action.action_type]}
          </p>
        </div>
        <div className="rounded-lg border border-labora-ui bg-labora-ivory p-4">
          <p className="text-xs font-semibold text-labora-gray">Revision</p>
          <p className="mt-1 text-sm font-semibold text-labora-charcoal">
            {professionalReviewLabels[action.professional_review_level]}
          </p>
        </div>
        <div className="rounded-lg border border-labora-ui bg-labora-ivory p-4">
          <p className="text-xs font-semibold text-labora-gray">Alcance</p>
          <p className="mt-1 text-sm font-semibold text-labora-charcoal">
            Borrador editable
          </p>
        </div>
      </div>

      {action.warnings.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <h3 className="font-semibold">Advertencias</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6">
            {action.warnings.map((warning) => (
              <li key={warning.code}>{warning.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function FinalReviewPanel({
  action,
  data,
  errors,
  onChange,
}: {
  action: LegalActionDetail;
  data: LegalDraftWizardData;
  errors: WizardErrors;
  onChange: (value: LegalDraftWizardData) => void;
}) {
  const acknowledgementRequired = actionNeedsAcknowledgement(
    action.action_type,
    action.professional_review_level,
  );

  return (
    <section className="grid gap-5 rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div>
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Revision final
        </h2>
        <p className="mt-1 text-sm leading-6 text-labora-gray">
          Confirma los datos antes de generar el borrador editable.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-labora-ui bg-labora-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
            Solicitante
          </p>
          <p className="mt-2 text-sm font-semibold text-labora-charcoal">
            {data.claimant.claimant_name || "Pendiente"}
          </p>
          <p className="mt-1 text-sm text-labora-gray">
            {data.claimant.claimant_document_type} {data.claimant.claimant_document_number}
          </p>
        </div>
        <div className="rounded-lg border border-labora-ui bg-labora-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
            Destinatario
          </p>
          <p className="mt-2 text-sm font-semibold text-labora-charcoal">
            {data.recipient.defendant_name ||
              data.recipient.recipient_entity ||
              "Pendiente"}
          </p>
          <p className="mt-1 text-sm text-labora-gray">
            {data.recipient.recipient_city || "Sin ciudad"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-labora-ui p-4 text-sm text-labora-gray">
        <p className="flex items-center gap-2 font-semibold text-labora-charcoal">
          <CheckCircle2 className="h-4 w-4 text-labora-green" aria-hidden="true" />
          {data.facts.selected_facts.length} hecho(s),{" "}
          {data.claims.requests.length + data.claims.main_claims.length} solicitud(es) o pretension(es),{" "}
          {data.attachments.selected_attachments.length} anexo(s)
        </p>
      </div>

      {action.missing_attachments.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="flex gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Hay anexos faltantes que podrian fortalecer este escrito.
          </p>
        </div>
      ) : null}

      {acknowledgementRequired ? (
        <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <input
            type="checkbox"
            checked={data.acknowledgement_accepted}
            onChange={(event) =>
              onChange({ ...data, acknowledgement_accepted: event.target.checked })
            }
            className="mt-1 h-4 w-4 rounded border-amber-300 text-labora-green"
          />
          <span>
            Entiendo que este documento es un borrador y puede requerir revision
            profesional antes de su uso formal.
            {errors.acknowledgement_accepted ? (
              <span className="mt-1 block font-medium text-red-700">
                {errors.acknowledgement_accepted}
              </span>
            ) : null}
          </span>
        </label>
      ) : null}
    </section>
  );
}

export function LegalDraftWizardPage({
  caseId,
  actionId,
}: {
  caseId: string;
  actionId: string;
}) {
  const router = useRouter();
  const actionResource = useLegalAction(actionId);
  const caseResource = useCaseDetail(caseId);
  const createDraftMutation = useCreateDraft(actionId);
  const initializedRef = useRef(false);
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<LegalDraftWizardData>(createEmptyWizardData);
  const [errors, setErrors] = useState<WizardErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const action = actionResource.data;

  useEffect(() => {
    if (!action || initializedRef.current) {
      return;
    }

    setData(getInitialWizardData(action));
    initializedRef.current = true;
  }, [action]);

  function goNext() {
    if (!action) {
      return;
    }

    const nextErrors = validateStep(activeStep, data, action);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setErrors({});
    setActiveStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    if (!action) {
      return;
    }

    const allErrors = [1, 2, 3, 4, 6].reduce<WizardErrors>(
      (acc, stepIndex) => ({
        ...acc,
        ...validateStep(stepIndex, data, action),
      }),
      {},
    );
    setErrors(allErrors);

    if (Object.keys(allErrors).length) {
      setSubmitError("Revisa los campos marcados antes de generar el borrador.");
      return;
    }

    setSubmitError(null);

    try {
      const response = await createDraftMutation.create({
        wizard_payload: buildWizardPayload(data),
      });

      if (!response.draft_id) {
        setSubmitError("El backend no devolvio el identificador del borrador.");
        return;
      }

      const generating = response.status === "generating" || response.status === "created";
      router.push(
        `/app/cases/${caseId}/drafts/${response.draft_id}/edit${
          generating ? "?generating=true" : ""
        }`,
      );
    } catch {
      setSubmitError("No pudimos generar el borrador en este momento.");
    }
  }

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
        <Link href={`/app/cases/${caseId}/legal-actions`} className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep">
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
    <section className="space-y-5 pb-28 md:pb-0">
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
          href={`/app/cases/${caseId}/legal-actions/${actionId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Detalle de accion
        </Link>
        <div className="mt-4 flex items-start gap-3">
          <FileText className="mt-1 h-5 w-5 text-labora-green" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Wizard de generacion
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
              {action.title}
            </h1>
          </div>
        </div>
      </header>

      <WizardStepper steps={steps} activeIndex={activeStep} />

      {activeStep === 0 ? <SummaryStep action={action} /> : null}
      {activeStep === 1 ? (
        <ClaimantForm
          value={data.claimant}
          errors={errors as Partial<Record<keyof WizardClaimantData, string>>}
          onChange={(claimant) => setData({ ...data, claimant })}
        />
      ) : null}
      {activeStep === 2 ? (
        <RecipientForm
          actionType={action.action_type}
          value={data.recipient}
          errors={errors as Partial<Record<keyof WizardRecipientData, string>>}
          onChange={(recipient) => setData({ ...data, recipient })}
        />
      ) : null}
      {activeStep === 3 ? (
        <SuggestedFactsSelector
          facts={action.suggested_facts}
          value={data.facts}
          error={errors.facts}
          onChange={(facts) => setData({ ...data, facts })}
        />
      ) : null}
      {activeStep === 4 ? (
        <ClaimsBuilder
          actionType={action.action_type}
          suggestions={action.suggested_requests}
          value={data.claims}
          error={errors.claims}
          onChange={(claims) => setData({ ...data, claims })}
        />
      ) : null}
      {activeStep === 5 ? (
        <AttachmentPicker
          attachments={action.attachments}
          missingAttachments={action.missing_attachments}
          value={data.attachments}
          onChange={(attachments) => setData({ ...data, attachments })}
        />
      ) : null}
      {activeStep === 6 ? (
        <>
          <ProfessionalReviewBanner
            actionType={action.action_type}
            level={action.professional_review_level}
          />
          <FinalReviewPanel
            action={action}
            data={data}
            errors={errors}
            onChange={setData}
          />
        </>
      ) : null}

      {submitError ? <InlineAlert tone="error">{submitError}</InlineAlert> : null}
      {createDraftMutation.error ? (
        <InlineAlert tone="error">{createDraftMutation.error}</InlineAlert>
      ) : null}

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-labora-ui bg-white/95 px-5 py-3 shadow-panel backdrop-blur md:static md:rounded-2xl md:border md:p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={activeStep === 0 || createDraftMutation.isLoading}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory disabled:cursor-not-allowed disabled:text-labora-gray"
          >
            Atras
          </button>

          {activeStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-2 text-sm font-semibold text-white hover:bg-labora-deep"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createDraftMutation.isLoading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:bg-slate-300"
            >
              {createDraftMutation.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Generar borrador
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}

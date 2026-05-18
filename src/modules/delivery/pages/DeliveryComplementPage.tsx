"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, FilePlus2, MessageSquarePlus } from "lucide-react";

import { FieldError, InlineAlert } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { CaseReportsNavigation } from "@/src/modules/reports/components/CaseReportsNavigation";
import {
  DeliveryEmptyState,
  DeliveryErrorState,
  DeliveryLoadingSkeleton,
} from "@/src/modules/delivery/components/delivery-components";
import type {
  ComplementDeliveryPayload,
  ComplementDeliveryResponse,
} from "@/src/modules/delivery/api/delivery.types";
import {
  useComplementDelivery,
  useDelivery,
} from "@/src/modules/delivery/hooks/useDelivery";
import { trackDeliveryEvent } from "@/src/modules/delivery/utils/delivery-analytics";

const reasonOptions: Array<{
  value: ComplementDeliveryPayload["reason"];
  label: string;
}> = [
  { value: "new_supporting_documents", label: "Tengo nuevos soportes" },
  { value: "correct_information", label: "Quiero corregir informacion" },
  { value: "update_analysis", label: "Quiero actualizar el analisis" },
  { value: "other", label: "Otro" },
];

const documentTypeOptions = [
  "Historia laboral actualizada",
  "Resolucion o acto administrativo",
  "Certificacion laboral",
  "Comprobante de pago",
  "Otro soporte",
];

export function DeliveryComplementPage({ caseId }: { caseId: string }) {
  const caseDetail = useCaseDetail(caseId);
  const delivery = useDelivery(caseId);
  const complement = useComplementDelivery(caseId);
  const [reason, setReason] = useState<ComplementDeliveryPayload["reason"]>("new_supporting_documents");
  const [message, setMessage] = useState("");
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ message?: string; reason?: string }>({});
  const [result, setResult] = useState<ComplementDeliveryResponse | null>(null);

  useEffect(() => {
    trackDeliveryEvent("delivery_complement_started", { caseId });
  }, [caseId]);

  function toggleDocumentType(value: string) {
    setDocumentTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { message?: string; reason?: string } = {};

    if (!reason) {
      nextErrors.reason = "Selecciona un motivo.";
    }

    if (message.trim().length < 10) {
      nextErrors.message = "Cuentanos un poco mas. Minimo 10 caracteres.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      const response = await complement.submit({
        reason,
        message: message.trim(),
        documentTypes,
      });
      setResult(response);
      trackDeliveryEvent("delivery_complement_submitted", {
        caseId,
        documentTypes: documentTypes.length,
      });
      await delivery.refresh();
    } catch {
      setResult(null);
    }
  }

  if (caseDetail.isLoading || delivery.isLoading) {
    return <DeliveryLoadingSkeleton />;
  }

  if (delivery.error && !delivery.data.package) {
    return <DeliveryErrorState message={delivery.error} onRetry={delivery.refetch} />;
  }

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      {caseDetail.data ? (
        <CaseHeader
          caseNumber={caseDetail.data.caseNumber}
          status={caseDetail.data.status}
          holderFullName={getHolderFullName(caseDetail.data.holder)}
          updatedAt={caseDetail.data.updatedAt}
        />
      ) : null}

      <CaseReportsNavigation caseId={caseId} active="Entrega final" />

      <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <Link
          href={`/app/cases/${caseId}/delivery`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a entrega final
        </Link>
        <div className="mt-3 flex gap-3">
          <MessageSquarePlus className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
          <div>
            <h1 className="font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
              Complementar expediente
            </h1>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Indica si tienes nuevos documentos o informacion despues de la entrega.
            </p>
          </div>
        </div>
      </header>

      {!delivery.data.package ? (
        <DeliveryEmptyState caseId={caseId} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {delivery.error ? <InlineAlert tone="warning">{delivery.error}</InlineAlert> : null}
            {complement.error ? <InlineAlert tone="error">{complement.error}</InlineAlert> : null}

            {result ? (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-panel">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="font-heading text-lg font-semibold">Solicitud recibida</h2>
                    <p className="mt-2 text-sm leading-6">
                      {result.message || "Esto puede generar una nueva version o revision del expediente."}
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={result.nextHref || `/app/cases/${caseId}/documents`}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep"
                      >
                        Ir a documentos
                      </Link>
                      <Link
                        href={`/app/cases/${caseId}/delivery`}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-labora-deep"
                      >
                        Volver a entrega
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel"
              noValidate
            >
              <fieldset disabled={!delivery.data.availableActions.canComplementCase || complement.isLoading}>
                <legend className="font-heading text-lg font-semibold text-labora-charcoal">
                  Solicitud de complemento
                </legend>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-labora-charcoal">Motivo</span>
                  <select
                    value={reason}
                    onChange={(event) => setReason(event.target.value as ComplementDeliveryPayload["reason"])}
                    className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
                  >
                    {reasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.reason} />
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-labora-charcoal">Mensaje</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    maxLength={1200}
                    className="mt-2 w-full rounded-lg border border-labora-ui bg-white px-3 py-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
                    placeholder="Describe que cambio o que nuevos soportes tienes."
                  />
                  <FieldError message={errors.message} />
                </label>

                <fieldset className="mt-4">
                  <legend className="text-sm font-semibold text-labora-charcoal">
                    Tipos de documentos a aportar
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {documentTypeOptions.map((option) => (
                      <label
                        key={option}
                        className="flex min-h-11 items-center gap-3 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-charcoal"
                      >
                        <input
                          type="checkbox"
                          checked={documentTypes.includes(option)}
                          onChange={() => toggleDocumentType(option)}
                          className="h-4 w-4 accent-labora-green"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </fieldset>

              {!delivery.data.availableActions.canComplementCase ? (
                <div className="mt-4">
                  <InlineAlert tone="warning">
                    En este momento el backend no permite complementar este expediente.
                  </InlineAlert>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link
                  href={`/app/cases/${caseId}/delivery`}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={!delivery.data.availableActions.canComplementCase || complement.isLoading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
                >
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  {complement.isLoading ? "Enviando..." : "Solicitar complemento"}
                </button>
              </div>
            </form>
          </div>

          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-panel">
            <h2 className="font-heading text-lg font-semibold">Nueva revision o version</h2>
            <p className="mt-2 text-sm leading-6">
              Un complemento puede generar una nueva revision del expediente o una version actualizada de los documentos finales.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, LockKeyhole, XCircle } from "lucide-react";

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
import type { CloseCaseResponse } from "@/src/modules/delivery/api/delivery.types";
import {
  useCloseDeliveryCase,
  useDelivery,
} from "@/src/modules/delivery/hooks/useDelivery";
import { formatDeliveryDate } from "@/src/modules/delivery/utils/delivery-formatters";
import { trackDeliveryEvent } from "@/src/modules/delivery/utils/delivery-analytics";

const closeReasons = [
  "Ya descargue y revise mis documentos",
  "Compartire el expediente por fuera de Labora",
  "No continuare con nuevas acciones",
  "Otro",
];

export function DeliveryClosePage({ caseId }: { caseId: string }) {
  const caseDetail = useCaseDetail(caseId);
  const delivery = useDelivery(caseId);
  const closeCase = useCloseDeliveryCase(caseId);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [downloadedDocuments, setDownloadedDocuments] = useState(false);
  const [understandsHistoryIsKept, setUnderstandsHistoryIsKept] = useState(false);
  const [understandsFutureChangesNeedRequest, setUnderstandsFutureChangesNeedRequest] = useState(false);
  const [errors, setErrors] = useState<{ reason?: string; checklist?: string }>({});
  const [result, setResult] = useState<CloseCaseResponse | null>(null);

  useEffect(() => {
    trackDeliveryEvent("delivery_close_started", { caseId });
  }, [caseId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: { reason?: string; checklist?: string } = {};

    if (!reason.trim()) {
      nextErrors.reason = "Selecciona o escribe un motivo de cierre.";
    }

    if (!downloadedDocuments || !understandsHistoryIsKept || !understandsFutureChangesNeedRequest) {
      nextErrors.checklist = "Confirma todos los puntos antes de cerrar el caso.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      const response = await closeCase.close({
        reason,
        notes: notes.trim() || undefined,
        confirmations: {
          downloadedDocuments,
          understandsHistoryIsKept,
          understandsFutureChangesNeedRequest,
        },
      });
      setResult(response);
      trackDeliveryEvent("delivery_case_closed", { caseId });
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

  const canClose = delivery.data.availableActions.canCloseCase;
  const blockedReason = delivery.data.availableActions.closeBlockedReason;

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
          <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
          <div>
            <h1 className="font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
              Cerrar caso
            </h1>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Cerrar el caso no elimina tus documentos ni la trazabilidad.
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
            {closeCase.error ? <InlineAlert tone="error">{closeCase.error}</InlineAlert> : null}

            {result?.status === "closed" ? (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-panel">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="font-heading text-lg font-semibold">Caso cerrado</h2>
                    <p className="mt-2 text-sm leading-6">
                      {result.message || "Tus documentos e historial siguen disponibles para consulta."}
                    </p>
                    <p className="mt-2 text-xs font-medium">
                      Cerrado {formatDeliveryDate(result.closedAt)}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            {!canClose ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-panel">
                <div className="flex gap-3">
                  <XCircle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="font-heading text-lg font-semibold">
                      El cierre esta bloqueado
                    </h2>
                    <p className="mt-2 text-sm leading-6">
                      {blockedReason || "Hay un proceso activo o documentos aun generandose."}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel"
              noValidate
            >
              <fieldset disabled={!canClose || closeCase.isLoading}>
                <legend className="font-heading text-lg font-semibold text-labora-charcoal">
                  Confirmacion de cierre
                </legend>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-labora-charcoal">
                    Motivo de cierre
                  </span>
                  <select
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
                  >
                    <option value="">Selecciona un motivo</option>
                    {closeReasons.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.reason} />
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-labora-charcoal">
                    Notas opcionales
                  </span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    maxLength={800}
                    className="mt-2 w-full rounded-lg border border-labora-ui bg-white px-3 py-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
                    placeholder="Agrega una nota para tu historial si lo necesitas."
                  />
                </label>

                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold text-labora-charcoal">
                    Checklist
                  </legend>
                  <div className="mt-2 grid gap-2">
                    <label className="flex items-start gap-3 rounded-lg border border-labora-ui p-3 text-sm font-semibold text-labora-charcoal">
                      <input
                        type="checkbox"
                        checked={downloadedDocuments}
                        onChange={(event) => setDownloadedDocuments(event.target.checked)}
                        className="mt-1 h-4 w-4 accent-labora-green"
                      />
                      Descargue mis documentos.
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border border-labora-ui p-3 text-sm font-semibold text-labora-charcoal">
                      <input
                        type="checkbox"
                        checked={understandsHistoryIsKept}
                        onChange={(event) => setUnderstandsHistoryIsKept(event.target.checked)}
                        className="mt-1 h-4 w-4 accent-labora-green"
                      />
                      Entiendo que el cierre conserva historial y trazabilidad.
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border border-labora-ui p-3 text-sm font-semibold text-labora-charcoal">
                      <input
                        type="checkbox"
                        checked={understandsFutureChangesNeedRequest}
                        onChange={(event) => setUnderstandsFutureChangesNeedRequest(event.target.checked)}
                        className="mt-1 h-4 w-4 accent-labora-green"
                      />
                      Entiendo que para cambios posteriores debo solicitar complemento o reapertura.
                    </label>
                  </div>
                  <FieldError message={errors.checklist} />
                </fieldset>
              </fieldset>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link
                  href={`/app/cases/${caseId}/delivery`}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={!canClose || closeCase.isLoading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-labora-ui disabled:bg-labora-ivory disabled:text-labora-gray"
                >
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  {closeCase.isLoading ? "Cerrando..." : "Cerrar caso"}
                </button>
              </div>
            </form>
          </div>

          <aside className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Que cambia al cerrar
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Podras consultar la trazabilidad, pero algunas acciones quedaran bloqueadas. Para nuevos soportes deberas solicitar complemento o reapertura.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

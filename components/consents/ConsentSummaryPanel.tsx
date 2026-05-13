import { ShieldCheck } from "lucide-react";

import { consentStatusLabels, getConsentTypeLabel } from "@/lib/consent-content";
import type { ConsentComplianceStatus, ConsentType } from "@/types/consent";

interface ConsentSummaryPanelProps {
  requiredCount: number;
  acceptedCount: number;
  missingConsentTypes: ConsentType[];
  status: ConsentComplianceStatus;
  canSubmit: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  helperText?: string;
  onSubmit: () => void;
  onSave?: () => void;
}

export function ConsentSummaryPanel({
  requiredCount,
  acceptedCount,
  missingConsentTypes,
  status,
  canSubmit,
  isSubmitting,
  submitLabel = "Aceptar y continuar",
  helperText = "Para continuar con tu expediente, debes completar estas autorizaciones.",
  onSubmit,
  onSave,
}: ConsentSummaryPanelProps) {
  const missingCount = Math.max(requiredCount - acceptedCount, 0);

  return (
    <aside className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel lg:sticky lg:top-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 text-labora-green" />
        <div>
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Resumen
          </h2>
          <p className="mt-1 text-sm text-labora-gray">
            {acceptedCount} de {requiredCount} autorizaciones seleccionadas.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-labora-ivory p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-gray">
          Estado
        </p>
        <p className="mt-1 font-heading text-lg font-semibold text-labora-deep">
          {consentStatusLabels[status]}
        </p>
      </div>

      {missingCount > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-labora-charcoal">Faltantes</p>
          <ul className="mt-2 grid gap-2 text-sm text-labora-gray">
            {missingConsentTypes.map((type) => (
              <li key={type}>- {getConsentTypeLabel(type)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Todas las autorizaciones obligatorias estan listas.
        </p>
      )}

      <button
        type="button"
        disabled={!canSubmit || isSubmitting}
        onClick={onSubmit}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Guardando..." : submitLabel}
      </button>

      {onSave ? (
        <button
          type="button"
          onClick={onSave}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
        >
          Guardar y salir
        </button>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-labora-gray">{helperText}</p>
    </aside>
  );
}

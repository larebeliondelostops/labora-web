import { AlertTriangle, BrainCircuit } from "lucide-react";

import { formatPercent } from "@/src/modules/reports/utils/reportFormatters";

export interface AiConfidenceWarningProps {
  confidence?: number;
  requiresHumanReview?: boolean;
  reviewReason?: string;
}

export function AiConfidenceWarning({
  confidence,
  requiresHumanReview,
  reviewReason,
}: AiConfidenceWarningProps) {
  const lowConfidence =
    typeof confidence === "number" && Number.isFinite(confidence) && confidence < 0.75;

  if (!requiresHumanReview && !lowConfidence) {
    return (
      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
        <div className="flex gap-3">
          <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold">Contenido asistido por IA</h2>
            <p className="mt-1 text-sm leading-6">
              La redaccion fue generada con apoyo de IA a partir de datos estructurados
              del expediente. Las conclusiones tecnicas deben tener soporte verificable.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold">Requiere revision</h2>
          <p className="mt-1 text-sm leading-6">
            Detectamos informacion que debe ser validada antes de entregar el informe final.
          </p>
          <dl className="mt-3 grid gap-2 text-xs">
            {typeof confidence === "number" ? (
              <div className="flex justify-between gap-3">
                <dt>Confianza</dt>
                <dd className="font-semibold">{formatPercent(confidence)}</dd>
              </div>
            ) : null}
            {reviewReason ? (
              <div>
                <dt className="font-semibold">Motivo</dt>
                <dd className="mt-1 leading-5">{reviewReason}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  );
}

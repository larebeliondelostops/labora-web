import { AlertTriangle, CheckCircle2, CircleDashed, XCircle } from "lucide-react";

import type {
  QualityCheckItem,
  QualityOverallStatus,
} from "@/src/modules/legal-actions/api/legal-actions.types";
import { qualityStatusLabels } from "@/src/modules/legal-actions/utils/mapStatusToLabel";

const checkIcon = {
  passed: CheckCircle2,
  warning: AlertTriangle,
  failed: XCircle,
  pending: CircleDashed,
};

export type QualityChecklistProps = {
  overallStatus: QualityOverallStatus;
  score?: number;
  checks: QualityCheckItem[];
};

export function QualityChecklist({
  overallStatus,
  score,
  checks,
}: QualityChecklistProps) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Control de calidad
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
            {qualityStatusLabels[overallStatus]}
          </h2>
        </div>
        {typeof score === "number" ? (
          <div className="rounded-lg bg-labora-ivory px-4 py-3 text-center">
            <p className="text-xs font-semibold text-labora-gray">Puntaje</p>
            <p className="text-2xl font-semibold text-labora-deep">{score}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3">
        {checks.length ? (
          checks.map((check) => {
            const Icon = checkIcon[check.status];

            return (
              <article
                key={check.id}
                className="flex gap-3 rounded-lg border border-labora-ui bg-labora-ivory p-3"
              >
                <Icon
                  className={
                    check.status === "passed"
                      ? "mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                      : check.status === "failed"
                        ? "mt-0.5 h-5 w-5 shrink-0 text-red-700"
                        : "mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                  }
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-sm font-semibold text-labora-charcoal">
                    {check.label}
                  </h3>
                  {check.message ? (
                    <p className="mt-1 text-sm leading-6 text-labora-gray">
                      {check.message}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-labora-ui p-4 text-sm text-labora-gray">
            Aun no hay checklist de calidad para este borrador.
          </p>
        )}
      </div>
    </section>
  );
}

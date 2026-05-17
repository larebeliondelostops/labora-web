"use client";

import { AlertTriangle, CheckCircle2, CircleHelp, Gauge, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FinalViability } from "@/src/modules/result/api/result.types";
import {
  viabilityClasses,
  viabilityRingClasses,
} from "@/src/modules/result/utils/result-colors";
import { formatScore } from "@/src/modules/result/utils/result-formatters";

const iconByLevel = {
  high: CheckCircle2,
  medium: AlertTriangle,
  low: XCircle,
  incomplete: CircleHelp,
  not_applicable: CircleHelp,
};

export function FinalTrafficLight({
  viability,
}: {
  viability: FinalViability | null;
}) {
  if (!viability) {
    return (
      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-gray">
            <Gauge className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-gray">
              Semaforo definitivo
            </p>
            <h2 className="mt-2 font-heading text-xl font-semibold text-labora-charcoal">
              Sin viabilidad reportada
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              El backend no envio una conclusion de viabilidad para mostrar.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const Icon = iconByLevel[viability.level];

  return (
    <section
      className={cn(
        "rounded-2xl border p-5 shadow-panel",
        viabilityClasses[viability.color],
      )}
      aria-label={`Semaforo definitivo: ${viability.label}`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-start">
        <div
          className={cn(
            "flex aspect-square h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border-[10px] bg-white text-center",
            viabilityRingClasses[viability.color],
          )}
        >
          <Icon className="h-7 w-7" aria-hidden="true" />
          <strong className="mt-2 font-heading text-3xl">
            {formatScore(viability.score)}
          </strong>
          <span className="mt-1 text-xs font-semibold">Score</span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">
            Semaforo definitivo
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">
            {viability.label}
          </h2>
          <p className="mt-3 text-sm leading-6">{viability.rationale}</p>

          {viability.strengths?.length ? (
            <ul className="mt-4 grid gap-2 text-sm">
              {viability.strengths.slice(0, 3).map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

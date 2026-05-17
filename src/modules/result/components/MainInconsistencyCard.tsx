"use client";

import { AlertTriangle } from "lucide-react";

import { Panel, ToneBadge } from "@/src/modules/result/components/ResultPrimitives";
import type { MainInconsistency } from "@/src/modules/result/api/result.types";
import { formatScore } from "@/src/modules/result/utils/result-formatters";

const impactTone = {
  high: "danger",
  medium: "warning",
  low: "info",
} as const;

export function MainInconsistencyCard({
  inconsistency,
}: {
  inconsistency: MainInconsistency | null;
}) {
  if (!inconsistency) {
    return (
      <Panel>
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-gray">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Inconsistencia principal
            </h2>
            <p className="mt-3 text-sm leading-6 text-labora-gray">
              El backend no reporto una inconsistencia principal.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-900">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Hallazgo principal
            </p>
            <h2 className="mt-2 font-heading text-xl font-semibold text-labora-charcoal">
              {inconsistency.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-labora-gray">
              {inconsistency.description}
            </p>
          </div>
        </div>
        {inconsistency.impact ? (
          <ToneBadge tone={impactTone[inconsistency.impact]}>
            Impacto {inconsistency.impact}
          </ToneBadge>
        ) : null}
      </div>

      {inconsistency.confidenceScore !== undefined ? (
        <p className="mt-4 text-sm font-semibold text-labora-deep">
          Confianza: {formatScore(inconsistency.confidenceScore)}
        </p>
      ) : null}
    </Panel>
  );
}

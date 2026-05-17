"use client";

import { ArrowRight, Sparkles } from "lucide-react";

import { ButtonLink } from "@/src/modules/result/components/ResultPrimitives";
import { FinalTrafficLight } from "@/src/modules/result/components/FinalTrafficLight";
import type { CaseResultResponse } from "@/src/modules/result/api/result.types";
import { compactText } from "@/src/modules/result/utils/result-formatters";

export function ResultHero({
  result,
  onPrimaryAction,
}: {
  result: CaseResultResponse;
  onPrimaryAction?: () => void;
}) {
  const primaryAction = result.availableActions.find(
    (action) => action.enabled && action.href,
  );

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-mint/25 text-labora-deep">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Conclusion principal
            </p>
            <h2 className="mt-3 max-w-3xl font-heading text-3xl font-semibold text-labora-charcoal sm:text-4xl">
              {compactText(result.headline, "Resultado completo disponible")}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-labora-gray">
              {compactText(
                result.executiveSummary || result.userExplanation,
                "El backend no envio un resumen ejecutivo para este resultado.",
              )}
            </p>
          </div>
        </div>

        {primaryAction?.href ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={primaryAction.href} onClick={onPrimaryAction}>
              {primaryAction.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        ) : null}
      </div>

      <FinalTrafficLight viability={result.finalViability} />
    </section>
  );
}

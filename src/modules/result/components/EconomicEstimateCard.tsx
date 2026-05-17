"use client";

import { AlertCircle, Calculator, WalletCards } from "lucide-react";

import { Panel, ToneBadge } from "@/src/modules/result/components/ResultPrimitives";
import type { EconomicEstimate } from "@/src/modules/result/api/result.types";
import { formatCOP } from "@/src/modules/result/utils/result-formatters";

export function EconomicEstimateCard({
  estimate,
}: {
  estimate: EconomicEstimate | null;
}) {
  if (!estimate) {
    return (
      <Panel>
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-gray">
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Calculo economico
            </h2>
            <p className="mt-3 text-sm leading-6 text-labora-gray">
              El backend no envio estimaciones economicas para este resultado.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-labora-mint/25 text-labora-deep">
            <WalletCards className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Calculo economico
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Valores estimados enviados por el backend. Pueden variar con nuevos soportes
              o revision profesional.
            </p>
          </div>
        </div>
        <ToneBadge tone={estimate.hasEconomicEstimate ? "info" : "neutral"}>
          {estimate.hasEconomicEstimate ? "Con estimacion" : "Sin estimacion"}
        </ToneBadge>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-labora-ui bg-labora-ivory p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
            Valor reclamable
          </dt>
          <dd className="mt-2 font-heading text-xl font-semibold text-labora-charcoal">
            {formatCOP(estimate.estimatedClaimableAmount)}
          </dd>
        </div>
        <div className="rounded-xl border border-labora-ui bg-labora-ivory p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
            Retroactivo
          </dt>
          <dd className="mt-2 font-heading text-xl font-semibold text-labora-charcoal">
            {formatCOP(estimate.estimatedRetroactiveAmount)}
          </dd>
        </div>
        <div className="rounded-xl border border-labora-ui bg-labora-ivory p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
            Diferencia mensual
          </dt>
          <dd className="mt-2 font-heading text-xl font-semibold text-labora-charcoal">
            {formatCOP(estimate.estimatedMonthlyDifference)}
          </dd>
        </div>
      </dl>

      {estimate.minAmount !== null || estimate.maxAmount !== null ? (
        <p className="mt-4 text-sm leading-6 text-labora-gray">
          Rango estimado: {formatCOP(estimate.minAmount)} a {formatCOP(estimate.maxAmount)}.
        </p>
      ) : null}

      {estimate.warnings.length || estimate.assumptions.length ? (
        <div className="mt-5 grid gap-3">
          {[...estimate.warnings, ...estimate.assumptions].map((item) => (
            <div
              key={item}
              className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

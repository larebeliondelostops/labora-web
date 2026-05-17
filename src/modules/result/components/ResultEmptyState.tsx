"use client";

import { FileSearch } from "lucide-react";

import { ButtonLink, Panel } from "@/src/modules/result/components/ResultPrimitives";

export function ResultEmptyState({ caseId }: { caseId: string }) {
  return (
    <Panel>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-gray">
            <FileSearch className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Resultado completo
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
              Aun no hay resultado completo disponible
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-labora-gray">
              Cuando el pago y el analisis completo esten listos, veras aqui la conclusion,
              inconsistencias, ruta recomendada y acciones disponibles.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <ButtonLink href={`/app/cases/${caseId}/full-analysis`}>
            Ver analisis completo
          </ButtonLink>
          <ButtonLink href={`/app/cases/${caseId}/checkout`} variant="secondary">
            Ver estado de pago
          </ButtonLink>
        </div>
      </div>
    </Panel>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { ToneBadge } from "@/src/modules/result/components/ResultPrimitives";
import type { ResultInconsistency } from "@/src/modules/result/api/result.types";
import { impactClasses } from "@/src/modules/result/utils/result-colors";
import {
  formatCOP,
  formatImpact,
  formatScore,
} from "@/src/modules/result/utils/result-formatters";

export function InconsistencyCardMobile({
  item,
  onExpand,
}: {
  item: ResultInconsistency;
  onExpand?: (item: ResultInconsistency) => void;
}) {
  const [open, setOpen] = useState(false);

  function toggle() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      onExpand?.(item);
    }
  }

  return (
    <article className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 text-left focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-labora-green">
            {item.inconsistencyType}
          </span>
          <span className="mt-2 block font-heading text-lg font-semibold text-labora-charcoal">
            {item.title}
          </span>
          <span className="mt-3 flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-semibold",
                impactClasses[item.economicImpact],
              )}
            >
              Economico: {formatImpact(item.economicImpact)}
            </span>
            <ToneBadge tone="info">Confianza {formatScore(item.confidenceScore)}</ToneBadge>
          </span>
        </span>
        <ChevronDown
          className={cn("mt-1 h-5 w-5 shrink-0 text-labora-gray transition", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="mt-4 grid gap-3 text-sm leading-6 text-labora-gray">
          <p>{item.description}</p>
          <dl className="grid gap-2">
            <div className="flex justify-between gap-3">
              <dt>Impacto juridico</dt>
              <dd className="font-semibold text-labora-charcoal">
                {formatImpact(item.legalImpact)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Valor estimado</dt>
              <dd className="font-semibold text-labora-charcoal">
                {formatCOP(item.estimatedAmount)}
              </dd>
            </div>
          </dl>
          <div>
            <h4 className="font-semibold text-labora-charcoal">Evidencia</h4>
            <p className="mt-1">{item.evidenceSummary || "Sin evidencia reportada."}</p>
          </div>
          <div>
            <h4 className="font-semibold text-labora-charcoal">Documento faltante</h4>
            <p className="mt-1">
              {item.requiredDocuments.map((document) => document.name).join(", ") ||
                "No reportado."}
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

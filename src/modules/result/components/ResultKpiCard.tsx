"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  ClipboardList,
  FileQuestion,
  FileText,
  Gauge,
  Landmark,
  Route,
  WalletCards,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toneClasses } from "@/src/modules/result/utils/result-colors";
import type { ResultCard } from "@/src/modules/result/api/result.types";

const iconByKey: Record<string, ReactNode> = {
  viability: <Gauge className="h-5 w-5" aria-hidden="true" />,
  estimated_claimable_amount: <WalletCards className="h-5 w-5" aria-hidden="true" />,
  retroactive: <Landmark className="h-5 w-5" aria-hidden="true" />,
  inconsistency: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
  route: <Route className="h-5 w-5" aria-hidden="true" />,
  missing_documents: <FileQuestion className="h-5 w-5" aria-hidden="true" />,
  documents: <FileText className="h-5 w-5" aria-hidden="true" />,
};

function getIcon(card: ResultCard) {
  return iconByKey[card.key] || iconByKey[card.icon || ""] || (
    <ClipboardList className="h-5 w-5" aria-hidden="true" />
  );
}

export function ResultKpiCard({ card }: { card: ResultCard }) {
  const missingValue = !card.value;

  return (
    <article className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            toneClasses[card.tone],
          )}
        >
          {getIcon(card)}
        </span>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-semibold",
            toneClasses[card.tone],
          )}
        >
          {missingValue ? "Sin dato" : "Disponible"}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-labora-gray">{card.title}</h3>
      <p className="mt-2 break-words font-heading text-2xl font-semibold text-labora-charcoal">
        {card.value || "No disponible"}
      </p>
      {card.description ? (
        <p className="mt-3 text-sm leading-6 text-labora-gray">{card.description}</p>
      ) : null}
    </article>
  );
}

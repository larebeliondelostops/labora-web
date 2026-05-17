"use client";

import { ResultKpiCard } from "@/src/modules/result/components/ResultKpiCard";
import type { ResultCard } from "@/src/modules/result/api/result.types";

export function ResultKpiGrid({ cards }: { cards: ResultCard[] }) {
  if (!cards.length) {
    return null;
  }

  return (
    <section aria-label="Indicadores principales" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <ResultKpiCard key={card.key} card={card} />
      ))}
    </section>
  );
}

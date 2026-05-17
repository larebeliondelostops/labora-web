"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, FileSearch } from "lucide-react";

import { resultStatusCopy } from "@/src/modules/result/utils/result-status-copy";
import { formatDate } from "@/src/modules/result/utils/result-formatters";
import type { CaseResultResponse } from "@/src/modules/result/api/result.types";
import { Panel, ToneBadge } from "@/src/modules/result/components/ResultPrimitives";

const statusTone: Record<CaseResultResponse["status"], "success" | "warning" | "danger" | "neutral" | "info"> = {
  not_started: "neutral",
  in_progress: "info",
  completed: "success",
  blocked: "warning",
  requires_review: "warning",
  approved: "success",
  rejected: "neutral",
  error: "danger",
};

export function CaseResultHeader({
  caseId,
  result,
}: {
  caseId: string;
  result: CaseResultResponse;
}) {
  return (
    <Panel>
      <nav
        aria-label="Ruta del resultado completo"
        className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-labora-gray"
      >
        <Link href="/app/cases" className="hover:text-labora-deep">
          Mis casos
        </Link>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/app/cases/${caseId}`} className="hover:text-labora-deep">
          {result.caseCode}
        </Link>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-labora-green">Resultado completo</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
            <FileSearch className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Modulo 13
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
              Resultado completo
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
              Conclusion ejecutiva del analisis laboral o pensional, con ruta
              recomendada y acciones disponibles.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <ToneBadge tone={statusTone[result.status]}>
            {resultStatusCopy[result.status]}
          </ToneBadge>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-labora-gray">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Generado {formatDate(result.generatedAt)}
          </span>
        </div>
      </div>
    </Panel>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { LaboraCase } from "@/src/modules/cases/api/cases.types";
import { CaseStatusBadge } from "@/src/modules/cases/components/CaseStatusBadge";
import {
  caseTypeLabels,
  formatDate,
  getHolderFullName,
  getInitials,
  nextActionLabels,
} from "@/src/modules/cases/utils/caseFormatters";

export function CaseCard({ laboraCase }: { laboraCase: LaboraCase }) {
  return (
    <article className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory font-heading text-sm font-semibold text-labora-deep">
          {getInitials(laboraCase.holder)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-labora-charcoal">
                {laboraCase.caseNumber}
              </p>
              <h2 className="mt-1 truncate font-heading text-lg font-semibold text-labora-deep">
                {getHolderFullName(laboraCase.holder) || "Titular pendiente"}
              </h2>
            </div>
            <CaseStatusBadge status={laboraCase.status} />
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
                Analisis
              </dt>
              <dd className="mt-1 text-labora-charcoal">
                {caseTypeLabels[laboraCase.caseTypeRequested]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
                Actualizado
              </dt>
              <dd className="mt-1 text-labora-charcoal">{formatDate(laboraCase.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
                Proxima accion
              </dt>
              <dd className="mt-1 text-labora-charcoal">
                {nextActionLabels[laboraCase.nextBestAction]}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex justify-end">
            <Link
              href={`/app/cases/${laboraCase.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-labora-deep"
            >
              Continuar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

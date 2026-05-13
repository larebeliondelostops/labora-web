import { Clock3 } from "lucide-react";

import type { CaseStatus } from "@/src/modules/cases/api/cases.types";
import { formatDateTime } from "@/src/modules/cases/utils/caseFormatters";
import { CaseStatusBadge } from "@/src/modules/cases/components/CaseStatusBadge";

export type CaseHeaderProps = {
  caseNumber: string;
  status: CaseStatus;
  holderFullName: string;
  updatedAt: string;
};

export function CaseHeader({
  caseNumber,
  status,
  holderFullName,
  updatedAt,
}: CaseHeaderProps) {
  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Expediente digital
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
            {caseNumber}
          </h1>
          <p className="mt-1 text-sm text-labora-gray">{holderFullName}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <CaseStatusBadge status={status} />
          <span className="inline-flex items-center gap-2 text-xs font-medium text-labora-gray">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Actualizado {formatDateTime(updatedAt)}
          </span>
        </div>
      </div>
    </header>
  );
}

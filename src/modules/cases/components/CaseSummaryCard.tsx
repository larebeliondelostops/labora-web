import { FileText, UserRound } from "lucide-react";

import type { LaboraCase } from "@/src/modules/cases/api/cases.types";
import {
  caseTypeLabels,
  documentTypeLabels,
  getHolderFullName,
  maskDocument,
  situationTypeLabels,
} from "@/src/modules/cases/utils/caseFormatters";

function SummaryItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-labora-charcoal">
        {value || "No registrado"}
      </dd>
    </div>
  );
}

export function CaseSummaryCard({ laboraCase }: { laboraCase: LaboraCase }) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-labora-ivory text-labora-deep">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
            Resumen del titular
          </h2>
          <p className="text-sm text-labora-gray">
            Datos principales que orientan el expediente.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <SummaryItem label="Titular" value={getHolderFullName(laboraCase.holder)} />
        <SummaryItem
          label="Documento"
          value={`${documentTypeLabels[laboraCase.holder.documentType]} ${maskDocument(
            laboraCase.holder.documentNumberMasked || laboraCase.holder.documentNumber,
          )}`}
        />
        <SummaryItem label="Entidad o fondo" value={laboraCase.pensionFundOrEntity} />
        <SummaryItem
          label="Tipo de analisis"
          value={caseTypeLabels[laboraCase.caseTypeRequested]}
        />
        <SummaryItem
          label="Situacion"
          value={situationTypeLabels[laboraCase.situationType]}
        />
        <SummaryItem
          label="Actuacion"
          value={
            laboraCase.actingAsThirdParty
              ? `Por tercero${laboraCase.thirdPartyRelationship ? `: ${laboraCase.thirdPartyRelationship}` : ""}`
              : "Actua por si mismo"
          }
        />
      </dl>

      {laboraCase.situationDescription ? (
        <div className="mt-5 rounded-xl border border-labora-ui bg-labora-ivory p-4">
          <div className="flex gap-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
            <p className="text-sm leading-6 text-labora-gray">
              {laboraCase.situationDescription}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

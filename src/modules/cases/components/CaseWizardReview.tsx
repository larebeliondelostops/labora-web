import {
  caseTypeLabels,
  documentTypeLabels,
  getHolderFullName,
  maskDocument,
  situationTypeLabels,
} from "@/src/modules/cases/utils/caseFormatters";
import type { CaseWizardState } from "@/src/modules/cases/pages/CaseCreatePage";

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-labora-ui bg-white p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-labora-charcoal">
        {value || "No registrado"}
      </dd>
    </div>
  );
}

export function CaseWizardReview({ state }: { state: CaseWizardState }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <ReviewRow label="Titular" value={getHolderFullName(state.holder)} />
      <ReviewRow
        label="Documento"
        value={`${documentTypeLabels[state.holder.documentType]} ${maskDocument(
          state.holder.documentNumber,
        )}`}
      />
      <ReviewRow
        label="Actuacion"
        value={
          state.thirdParty.actingAsThirdParty
            ? `Por tercero: ${state.thirdParty.relationship}`
            : "Actua por si mismo"
        }
      />
      <ReviewRow
        label="Tipo de analisis"
        value={state.caseType ? caseTypeLabels[state.caseType] : undefined}
      />
      <ReviewRow
        label="Situacion"
        value={state.situationType ? situationTypeLabels[state.situationType] : undefined}
      />
      <ReviewRow label="Entidad o fondo" value={state.pensionFundOrEntity} />
      {state.situationDescription ? (
        <div className="rounded-xl border border-labora-ui bg-white p-4 sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
            Nota del caso
          </dt>
          <dd className="mt-1 text-sm leading-6 text-labora-charcoal">
            {state.situationDescription}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

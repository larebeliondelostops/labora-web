import { Plus, X } from "lucide-react";

import type {
  LegalActionType,
  SuggestedRequest,
  WizardClaimsData,
} from "@/src/modules/legal-actions/api/legal-actions.types";
import { isJudicialAction } from "@/src/modules/legal-actions/utils/mapStatusToLabel";

type ClaimsBuilderProps = {
  actionType: LegalActionType;
  suggestions: SuggestedRequest[];
  value: WizardClaimsData;
  error?: string;
  onChange: (value: WizardClaimsData) => void;
};

const inputClass =
  "min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15";

function EditableList({
  label,
  items,
  placeholder,
  onChange,
}: {
  label: string;
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-labora-charcoal">{label}</h3>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-labora-ui px-3 py-1.5 text-xs font-semibold text-labora-deep hover:bg-labora-ivory"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Agregar
        </button>
      </div>
      <div className="mt-3 grid gap-2">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="flex gap-2">
            <input
              value={item}
              onChange={(event) => {
                const next = [...items];
                next[index] = event.target.value;
                onChange(next);
              }}
              className={inputClass}
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-labora-ui text-labora-gray hover:bg-red-50 hover:text-red-700"
              aria-label="Eliminar"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        {!items.length ? (
          <p className="rounded-lg border border-dashed border-labora-ui p-3 text-sm text-labora-gray">
            Aun no hay elementos agregados.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ClaimsBuilder({
  actionType,
  suggestions,
  value,
  error,
  onChange,
}: ClaimsBuilderProps) {
  const judicial = isJudicialAction(actionType);

  function addSuggestion(text: string, kind: SuggestedRequest["kind"]) {
    if (judicial) {
      const target = kind === "subsidiary_claim" ? "subsidiary_claims" : "main_claims";
      onChange({
        ...value,
        [target]: [...new Set([...value[target], text])],
      });
      return;
    }

    onChange({
      ...value,
      requests: [...new Set([...value.requests, text])],
    });
  }

  return (
    <section className="grid gap-5 rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div>
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          {judicial ? "Pretensiones" : "Solicitudes"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-labora-gray">
          Define que se le pedira a la entidad o al juez en el documento.
        </p>
      </div>

      {suggestions.length ? (
        <div className="rounded-2xl border border-labora-ui bg-labora-ivory p-4">
          <h3 className="text-sm font-semibold text-labora-charcoal">
            Sugerencias del analisis
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => addSuggestion(suggestion.text, suggestion.kind)}
                className="rounded-full border border-labora-ui bg-white px-3 py-1.5 text-xs font-semibold text-labora-deep hover:bg-labora-mint/25"
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {judicial ? (
        <>
          <EditableList
            label="Pretensiones principales"
            items={value.main_claims}
            placeholder="Ej. Declarar la reliquidacion de la pension..."
            onChange={(main_claims) => onChange({ ...value, main_claims })}
          />
          <EditableList
            label="Pretensiones subsidiarias"
            items={value.subsidiary_claims}
            placeholder="Ej. Reconocer de manera subsidiaria..."
            onChange={(subsidiary_claims) =>
              onChange({ ...value, subsidiary_claims })
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["include_estimated_amount", "Incluir cuantia estimada"],
              ["include_oath_or_amount_statement", "Incluir juramento o manifestacion"],
              ["include_legal_basis", "Incluir fundamentos juridicos"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex items-start gap-3 rounded-lg border border-labora-ui bg-labora-ivory p-3 text-sm text-labora-charcoal"
              >
                <input
                  type="checkbox"
                  checked={Boolean(value[key as keyof WizardClaimsData])}
                  onChange={(event) =>
                    onChange({ ...value, [key]: event.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green"
                />
                {label}
              </label>
            ))}
          </div>
        </>
      ) : (
        <>
          <EditableList
            label="Solicitudes"
            items={value.requests}
            placeholder="Ej. Corregir las semanas reportadas..."
            onChange={(requests) => onChange({ ...value, requests })}
          />
          <label className="block">
            <span className="text-sm font-semibold text-labora-charcoal">
              Resultado esperado
            </span>
            <textarea
              value={value.requested_outcome}
              onChange={(event) =>
                onChange({ ...value, requested_outcome: event.target.value })
              }
              className="mt-2 min-h-24 w-full rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm leading-6 text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-lg border border-labora-ui bg-labora-ivory p-3 text-sm text-labora-charcoal">
              <input
                type="checkbox"
                checked={value.include_calculation_summary}
                onChange={(event) =>
                  onChange({
                    ...value,
                    include_calculation_summary: event.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green"
              />
              Incluir resumen de calculo
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-labora-ui bg-labora-ivory p-3 text-sm text-labora-charcoal">
              <input
                type="checkbox"
                checked={value.include_inconsistency_matrix}
                onChange={(event) =>
                  onChange({
                    ...value,
                    include_inconsistency_matrix: event.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green"
              />
              Incluir matriz de inconsistencias
            </label>
          </div>
        </>
      )}

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
    </section>
  );
}

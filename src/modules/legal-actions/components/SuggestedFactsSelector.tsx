import type {
  SuggestedFact,
  WizardFactsData,
} from "@/src/modules/legal-actions/api/legal-actions.types";

type SuggestedFactsSelectorProps = {
  facts: SuggestedFact[];
  value: WizardFactsData;
  error?: string;
  onChange: (value: WizardFactsData) => void;
};

const sourceLabels: Record<SuggestedFact["source"], string> = {
  report: "Informe tecnico",
  document: "Documento cargado",
  inconsistency: "Matriz de inconsistencias",
  calculation: "Calculo",
  legal_rule: "Regla juridica",
  user_input: "Respuesta del usuario",
};

export function SuggestedFactsSelector({
  facts,
  value,
  error,
  onChange,
}: SuggestedFactsSelectorProps) {
  function toggleFact(id: string, checked: boolean) {
    onChange({
      ...value,
      selected_facts: checked
        ? [...new Set([...value.selected_facts, id])]
        : value.selected_facts.filter((item) => item !== id),
    });
  }

  function updateEditedFact(id: string, text: string) {
    onChange({
      ...value,
      edited_facts: {
        ...value.edited_facts,
        [id]: text,
      },
    });
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div>
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Hechos a incluir
        </h2>
        <p className="mt-1 text-sm leading-6 text-labora-gray">
          Selecciona los hechos sugeridos y ajusta el texto antes de generar el escrito.
        </p>
      </div>

      <div className="grid gap-3">
        {facts.length ? (
          facts.map((fact) => {
            const checked = value.selected_facts.includes(fact.id);

            return (
              <article
                key={fact.id}
                className="rounded-lg border border-labora-ui bg-labora-ivory p-4"
              >
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => toggleFact(fact.id, event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green"
                  />
                  <span className="text-sm font-semibold text-labora-charcoal">
                    {sourceLabels[fact.source]}
                    {fact.confidence_score ? ` · ${Math.round(fact.confidence_score * 100)}%` : ""}
                  </span>
                </label>
                <textarea
                  value={value.edited_facts[fact.id] ?? fact.text}
                  onChange={(event) => updateEditedFact(fact.id, event.target.value)}
                  disabled={!checked}
                  className="mt-3 min-h-24 w-full rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm leading-6 text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15 disabled:bg-slate-50 disabled:text-labora-gray"
                />
              </article>
            );
          })
        ) : (
          <p className="rounded-lg border border-labora-ui bg-labora-ivory p-4 text-sm text-labora-gray">
            El backend no envio hechos sugeridos. Puedes agregar un hecho adicional.
          </p>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-labora-charcoal">
          Agregar hecho adicional
        </span>
        <textarea
          value={value.additional_facts}
          onChange={(event) =>
            onChange({ ...value, additional_facts: event.target.value })
          }
          className="mt-2 min-h-28 w-full rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm leading-6 text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
        />
      </label>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
    </section>
  );
}

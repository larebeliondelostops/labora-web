import { Calculator, Coins, Scale, Sigma } from "lucide-react";

import { formatCOP } from "@/src/modules/reports/utils/reportFormatters";

type RawRecord = Record<string, unknown>;

export interface CalculationSummary {
  scenarioRecognized?: string;
  scenarioCalculated?: string;
  differenceEstimated?: number | null;
  retroactiveApproximate?: number | null;
  variables: Array<{ label: string; value: string }>;
  assumptions: string[];
  limitations: string[];
}

export interface CalculationSummaryCardsProps {
  data?: unknown;
}

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const text = asString(item);
    return text ? [text] : [];
  });
}

function normalizeVariables(value: unknown): Array<{ label: string; value: string }> {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (!isRecord(item)) {
        return [];
      }

      const label = asString(item.label) || asString(item.name) || asString(item.key);
      const rawValue = asString(item.value) || asString(item.amount) || asString(item.description);

      return label && rawValue ? [{ label, value: rawValue }] : [];
    });
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).map(([key, item]) => ({
    label: key.replaceAll("_", " "),
    value: String(item ?? "Sin dato"),
  }));
}

export function normalizeCalculationSummary(data?: unknown): CalculationSummary {
  const source = isRecord(data) ? data : {};

  return {
    scenarioRecognized:
      asString(source.scenarioRecognized) ||
      asString(source.scenario_recognized) ||
      asString(source.recognizedScenario),
    scenarioCalculated:
      asString(source.scenarioCalculated) ||
      asString(source.scenario_calculated) ||
      asString(source.calculatedScenario),
    differenceEstimated:
      asNumber(source.differenceEstimated) ??
      asNumber(source.difference_estimated) ??
      asNumber(source.estimatedDifference),
    retroactiveApproximate:
      asNumber(source.retroactiveApproximate) ??
      asNumber(source.retroactive_approximate) ??
      asNumber(source.estimatedRetroactive),
    variables: normalizeVariables(source.variables),
    assumptions: asStringArray(source.assumptions ?? source.supuestos),
    limitations: asStringArray(source.limitations ?? source.limits ?? source.limitaciones),
  };
}

export function CalculationSummaryCards({ data }: CalculationSummaryCardsProps) {
  const summary = normalizeCalculationSummary(data);
  const cards = [
    {
      label: "Escenario reconocido",
      value: summary.scenarioRecognized || "Sin dato",
      icon: Scale,
    },
    {
      label: "Escenario calculado",
      value: summary.scenarioCalculated || "Sin dato",
      icon: Calculator,
    },
    {
      label: "Diferencia estimada",
      value: formatCOP(summary.differenceEstimated),
      icon: Coins,
    },
    {
      label: "Retroactivo aproximado",
      value: formatCOP(summary.retroactiveApproximate),
      icon: Sigma,
    },
  ];

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <card.icon className="h-5 w-5 text-labora-green" aria-hidden="true" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-labora-gray">
              {card.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-labora-charcoal">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
            Variables usadas
          </h3>
          {summary.variables.length ? (
            <dl className="mt-4 grid gap-3 text-sm">
              {summary.variables.map((item) => (
                <div key={`${item.label}-${item.value}`} className="flex justify-between gap-4 border-b border-labora-ui pb-2 last:border-b-0">
                  <dt className="text-labora-gray">{item.label}</dt>
                  <dd className="text-right font-semibold text-labora-charcoal">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-sm leading-6 text-labora-gray">
              El backend no envio variables estructuradas.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
            Supuestos y limitaciones
          </h3>
          <div className="mt-4 grid gap-4">
            <div>
              <p className="text-sm font-semibold text-labora-charcoal">Supuestos</p>
              {summary.assumptions.length ? (
                <ul className="mt-2 grid gap-2 text-sm leading-6 text-labora-gray">
                  {summary.assumptions.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-labora-green" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-labora-gray">Sin supuestos reportados.</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-labora-charcoal">Limitaciones</p>
              {summary.limitations.length ? (
                <ul className="mt-2 grid gap-2 text-sm leading-6 text-labora-gray">
                  {summary.limitations.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-labora-gray">Sin limitaciones reportadas.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCOP, formatPercent } from "@/src/modules/reports/utils/reportFormatters";

type RawRecord = Record<string, unknown>;

export type MatrixImpact = "high" | "medium" | "low" | "none";

export interface InconsistencyMatrixRow {
  id: string;
  inconsistency: string;
  evidenceFound: string;
  legalImpact: MatrixImpact;
  economicImpact: MatrixImpact;
  estimatedAmount?: number | null;
  appliedRule: string;
  missingDocument?: string | null;
  confidence?: number | null;
  suggestedAction: string;
}

export interface InconsistencyMatrixTableProps {
  rows: InconsistencyMatrixRow[];
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

function asImpact(value: unknown): MatrixImpact {
  const impact = asString(value);
  return impact === "high" || impact === "medium" || impact === "low" || impact === "none"
    ? impact
    : "none";
}

function impactLabel(value: MatrixImpact) {
  return {
    high: "Alto",
    medium: "Medio",
    low: "Bajo",
    none: "Sin impacto",
  }[value];
}

function normalizeRow(raw: unknown, index: number): InconsistencyMatrixRow[] {
  if (!isRecord(raw)) {
    return [];
  }

  const inconsistency =
    asString(raw.inconsistency) ||
    asString(raw.title) ||
    asString(raw.name);

  if (!inconsistency) {
    return [];
  }

  return [
    {
      id: asString(raw.id) || `${index}-${inconsistency}`,
      inconsistency,
      evidenceFound:
        asString(raw.evidenceFound) ||
        asString(raw.evidence_found) ||
        asString(raw.evidence) ||
        "Sin evidencia reportada",
      legalImpact: asImpact(raw.legalImpact ?? raw.legal_impact),
      economicImpact: asImpact(raw.economicImpact ?? raw.economic_impact),
      estimatedAmount:
        asNumber(raw.estimatedAmount) ??
        asNumber(raw.estimated_amount) ??
        asNumber(raw.amount),
      appliedRule:
        asString(raw.appliedRule) ||
        asString(raw.applied_rule) ||
        asString(raw.rule) ||
        "Sin regla reportada",
      missingDocument:
        asString(raw.missingDocument) ||
        asString(raw.missing_document) ||
        asString(raw.document),
      confidence:
        asNumber(raw.confidence) ??
        asNumber(raw.confidenceScore) ??
        asNumber(raw.confidence_score),
      suggestedAction:
        asString(raw.suggestedAction) ||
        asString(raw.suggested_action) ||
        asString(raw.action) ||
        "Revisar con soporte documental",
    },
  ];
}

export function normalizeInconsistencyRows(data?: unknown): InconsistencyMatrixRow[] {
  if (Array.isArray(data)) {
    return data.flatMap(normalizeRow);
  }

  if (isRecord(data)) {
    const rows =
      data.rows ||
      data.items ||
      data.inconsistencies ||
      data.matrix ||
      data.inconsistencyMatrix;

    return Array.isArray(rows) ? rows.flatMap(normalizeRow) : [];
  }

  return [];
}

function confidenceBucket(confidence?: number | null) {
  if (typeof confidence !== "number") {
    return "unknown";
  }

  if (confidence >= 0.8 || confidence >= 80) {
    return "high";
  }

  if (confidence >= 0.55 || confidence >= 55) {
    return "medium";
  }

  return "low";
}

export function InconsistencyMatrixTable({ rows }: InconsistencyMatrixTableProps) {
  const [impactFilter, setImpactFilter] = useState<MatrixImpact | "all">("all");
  const [confidenceFilter, setConfidenceFilter] = useState<"all" | "high" | "medium" | "low" | "unknown">("all");
  const [missingOnly, setMissingOnly] = useState(false);

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => impactFilter === "all" || row.economicImpact === impactFilter || row.legalImpact === impactFilter)
      .filter((row) => confidenceFilter === "all" || confidenceBucket(row.confidence) === confidenceFilter)
      .filter((row) => !missingOnly || Boolean(row.missingDocument))
      .sort((a, b) => (b.estimatedAmount || 0) - (a.estimatedAmount || 0));
  }, [confidenceFilter, impactFilter, missingOnly, rows]);

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Matriz
          </p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
            Inconsistencias accionables
          </h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-xs font-semibold text-labora-gray">
            Impacto
            <select
              value={impactFilter}
              onChange={(event) => setImpactFilter(event.target.value as MatrixImpact | "all")}
              className="mt-1 min-h-10 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal"
            >
              <option value="all">Todos</option>
              <option value="high">Alto</option>
              <option value="medium">Medio</option>
              <option value="low">Bajo</option>
              <option value="none">Sin impacto</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-labora-gray">
            Confianza
            <select
              value={confidenceFilter}
              onChange={(event) => setConfidenceFilter(event.target.value as typeof confidenceFilter)}
              className="mt-1 min-h-10 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal"
            >
              <option value="all">Todas</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
              <option value="unknown">Sin dato</option>
            </select>
          </label>
          <label className="flex min-h-10 items-center gap-2 self-end rounded-lg border border-labora-ui px-3 text-sm font-semibold text-labora-deep">
            <input
              type="checkbox"
              checked={missingOnly}
              onChange={(event) => setMissingOnly(event.target.checked)}
              className="h-4 w-4 accent-labora-green"
            />
            Falta documento
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-labora-gray">
        <Filter className="h-4 w-4" aria-hidden="true" />
        {filteredRows.length} resultado(s)
        <ArrowDownWideNarrow className="ml-2 h-4 w-4" aria-hidden="true" />
        Ordenado por impacto economico
      </div>

      {filteredRows.length ? (
        <>
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-labora-ui lg:block">
            <table className="min-w-[980px] w-full border-collapse bg-white text-left text-sm">
              <thead className="sticky top-0 bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
                <tr>
                  <th className="px-4 py-3">Inconsistencia</th>
                  <th className="px-4 py-3">Evidencia encontrada</th>
                  <th className="px-4 py-3">Impacto juridico</th>
                  <th className="px-4 py-3">Impacto economico</th>
                  <th className="px-4 py-3">Regla o criterio</th>
                  <th className="px-4 py-3">Documento faltante</th>
                  <th className="px-4 py-3">Confianza</th>
                  <th className="px-4 py-3">Accion sugerida</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-t border-labora-ui align-top">
                    <td className="px-4 py-3 font-semibold text-labora-charcoal">{row.inconsistency}</td>
                    <td className="px-4 py-3 text-labora-gray">{row.evidenceFound}</td>
                    <td className="px-4 py-3">{impactLabel(row.legalImpact)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("font-semibold", row.economicImpact === "high" ? "text-red-700" : "text-labora-charcoal")}>
                        {impactLabel(row.economicImpact)}
                      </span>
                      <p className="mt-1 text-xs text-labora-gray">{formatCOP(row.estimatedAmount)}</p>
                    </td>
                    <td className="px-4 py-3 text-labora-gray">{row.appliedRule}</td>
                    <td className="px-4 py-3 text-labora-gray">{row.missingDocument || "No reportado"}</td>
                    <td className="px-4 py-3">{formatPercent(row.confidence)}</td>
                    <td className="px-4 py-3 text-labora-gray">{row.suggestedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 lg:hidden">
            {filteredRows.map((row) => (
              <article key={row.id} className="rounded-xl border border-labora-ui bg-labora-ivory p-4">
                <h3 className="font-semibold text-labora-charcoal">{row.inconsistency}</h3>
                <p className="mt-2 text-sm leading-6 text-labora-gray">{row.evidenceFound}</p>
                <dl className="mt-4 grid gap-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-labora-gray">Impacto juridico</dt>
                    <dd className="font-semibold text-labora-charcoal">{impactLabel(row.legalImpact)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-labora-gray">Impacto economico</dt>
                    <dd className="font-semibold text-labora-charcoal">{impactLabel(row.economicImpact)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-labora-gray">Monto</dt>
                    <dd className="font-semibold text-labora-charcoal">{formatCOP(row.estimatedAmount)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-labora-gray">Confianza</dt>
                    <dd className="font-semibold text-labora-charcoal">{formatPercent(row.confidence)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm font-semibold text-labora-deep">{row.suggestedAction}</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm text-labora-gray">
          No hay inconsistencias con los filtros actuales.
        </div>
      )}
    </section>
  );
}

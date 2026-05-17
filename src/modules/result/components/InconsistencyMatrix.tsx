"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { InconsistencyCardMobile } from "@/src/modules/result/components/InconsistencyCardMobile";
import { Panel } from "@/src/modules/result/components/ResultPrimitives";
import type { ResultInconsistency } from "@/src/modules/result/api/result.types";
import { impactClasses } from "@/src/modules/result/utils/result-colors";
import {
  formatCOP,
  formatImpact,
  formatScore,
} from "@/src/modules/result/utils/result-formatters";

export function InconsistencyMatrix({
  inconsistencies,
  onExpand,
}: {
  inconsistencies: ResultInconsistency[];
  onExpand?: (item: ResultInconsistency) => void;
}) {
  const [selected, setSelected] = useState<ResultInconsistency | null>(null);

  function openDetail(item: ResultInconsistency) {
    setSelected(item);
    onExpand?.(item);
  }

  if (!inconsistencies.length) {
    return (
      <Panel>
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-gray">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Matriz de inconsistencias
            </h2>
            <p className="mt-3 text-sm leading-6 text-labora-gray">
              No hay inconsistencias reportadas por el backend.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-labora-charcoal">
          Matriz de inconsistencias
        </h2>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          Hallazgos enviados por el backend con evidencia, impacto y confianza.
        </p>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-labora-ui bg-white shadow-panel lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3">Inconsistencia</th>
              <th className="px-4 py-3">Evidencia</th>
              <th className="px-4 py-3">Impacto juridico</th>
              <th className="px-4 py-3">Impacto economico</th>
              <th className="px-4 py-3">Confianza</th>
              <th className="px-4 py-3">Documento faltante</th>
              <th className="px-4 py-3">Accion</th>
            </tr>
          </thead>
          <tbody>
            {inconsistencies.map((item) => (
              <tr key={item.id} className="border-t border-labora-ui align-top">
                <td className="px-4 py-4">
                  <p className="font-semibold text-labora-charcoal">{item.title}</p>
                  <p className="mt-1 text-xs text-labora-gray">{item.inconsistencyType}</p>
                </td>
                <td className="max-w-[220px] px-4 py-4 text-labora-gray">
                  {item.evidenceSummary || "Sin evidencia reportada"}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                      impactClasses[item.legalImpact],
                    )}
                  >
                    {formatImpact(item.legalImpact)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                      impactClasses[item.economicImpact],
                    )}
                  >
                    {formatImpact(item.economicImpact)}
                  </span>
                  <p className="mt-2 text-xs text-labora-gray">
                    {formatCOP(item.estimatedAmount)}
                  </p>
                </td>
                <td className="px-4 py-4 text-labora-gray">
                  {formatScore(item.confidenceScore)}
                </td>
                <td className="px-4 py-4 text-labora-gray">
                  {item.requiredDocuments.map((document) => document.name).join(", ") ||
                    "No reportado"}
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => openDetail(item)}
                    className="text-sm font-semibold text-labora-deep hover:text-labora-green focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {inconsistencies.map((item) => (
          <InconsistencyCardMobile
            key={item.id}
            item={item}
            onExpand={onExpand}
          />
        ))}
      </div>

      {selected ? (
        <Panel>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                Detalle de inconsistencia
              </p>
              <h3 className="mt-2 font-heading text-xl font-semibold text-labora-charcoal">
                {selected.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg p-2 text-labora-gray hover:bg-labora-ivory hover:text-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
              aria-label="Cerrar detalle"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-labora-gray">
            <p>{selected.description}</p>
            <p>
              <strong className="text-labora-charcoal">Evidencia:</strong>{" "}
              {selected.evidenceSummary || "Sin evidencia reportada."}
            </p>
            <p>
              <strong className="text-labora-charcoal">Valor estimado:</strong>{" "}
              {formatCOP(selected.estimatedAmount)}
            </p>
            <p>
              <strong className="text-labora-charcoal">Documentos:</strong>{" "}
              {selected.requiredDocuments.map((document) => document.name).join(", ") ||
                "No reportado."}
            </p>
          </div>
        </Panel>
      ) : null}
    </section>
  );
}

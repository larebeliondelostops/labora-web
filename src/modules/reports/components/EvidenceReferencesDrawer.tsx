"use client";

import { useEffect } from "react";
import { FileSearch, X } from "lucide-react";

import type { EvidenceRef } from "@/src/modules/reports/api/reports.types";

export interface EvidenceReferencesDrawerProps {
  open: boolean;
  refs: EvidenceRef[];
  onClose: () => void;
}

function sourceTypeLabel(type: EvidenceRef["type"]) {
  return {
    analysis_result: "Resultado de analisis",
    calculation_result: "Resultado de calculo",
    document: "Documento",
    extraction: "Extraccion",
    rule: "Regla",
  }[type];
}

export function EvidenceReferencesDrawer({
  open,
  refs,
  onClose,
}: EvidenceReferencesDrawerProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="evidence-title">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-labora-charcoal/40"
        onClick={onClose}
        aria-label="Cerrar referencias de evidencia"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-panel">
        <header className="flex items-start justify-between gap-4 border-b border-labora-ui p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Soportes
            </p>
            <h2 id="evidence-title" className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
              Referencias de evidencia
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui text-labora-gray hover:bg-labora-ivory hover:text-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {refs.length ? (
            <ul className="grid gap-3">
              {refs.map((item) => (
                <li
                  key={`${item.type}-${item.id}-${item.page ?? "no-page"}-${item.field ?? "no-field"}`}
                  className="rounded-2xl border border-labora-ui bg-labora-ivory p-4"
                >
                  <div className="flex gap-3">
                    <FileSearch className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-labora-charcoal">{item.label}</p>
                      <p className="mt-1 text-xs text-labora-gray">{sourceTypeLabel(item.type)}</p>
                      <dl className="mt-3 grid gap-2 text-xs text-labora-gray">
                        <div className="flex justify-between gap-3">
                          <dt>ID</dt>
                          <dd className="break-all text-right font-semibold text-labora-charcoal">{item.id}</dd>
                        </div>
                        {item.page ? (
                          <div className="flex justify-between gap-3">
                            <dt>Pagina</dt>
                            <dd className="font-semibold text-labora-charcoal">{item.page}</dd>
                          </div>
                        ) : null}
                        {item.field ? (
                          <div className="flex justify-between gap-3">
                            <dt>Campo</dt>
                            <dd className="font-semibold text-labora-charcoal">{item.field}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Esta conclusion no tiene soporte asociado en la respuesta del backend.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

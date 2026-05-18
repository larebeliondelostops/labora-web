"use client";

import { useEffect, useId, useState } from "react";
import { FileDown, X } from "lucide-react";

import type {
  ExportFormat,
  ExportReportResponse,
} from "@/src/modules/reports/api/reports.types";
import { useExportReport } from "@/src/modules/reports/hooks/useExportReport";

export interface ExportReportModalProps {
  open: boolean;
  reportId: string;
  currentVersionId: string;
  versionNumber: number;
  onClose: () => void;
  onExported?: (response: ExportReportResponse) => void;
  initialFormat?: ExportFormat;
}

export function ExportReportModal({
  open,
  reportId,
  currentVersionId,
  versionNumber,
  onClose,
  onExported,
  initialFormat = "pdf",
}: ExportReportModalProps) {
  const titleId = useId();
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [includeTraceabilityStamp, setIncludeTraceabilityStamp] = useState(true);
  const [includeEvidenceIndex, setIncludeEvidenceIndex] = useState(true);
  const [lastExport, setLastExport] = useState<ExportReportResponse | null>(null);
  const exportMutation = useExportReport(reportId);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormat(initialFormat);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [initialFormat, onClose, open]);

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    const response = await exportMutation.exportFile({
      format,
      versionId: currentVersionId,
      includeTraceabilityStamp,
      includeEvidenceIndex,
    });
    setLastExport(response);
    onExported?.(response);
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-labora-charcoal/40"
        onClick={onClose}
        aria-label="Cerrar exportacion"
      />
      <div className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-labora-ui bg-white shadow-panel">
        <header className="flex items-start justify-between gap-4 border-b border-labora-ui p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Exportar informe
            </p>
            <h2 id={titleId} className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
              PDF o Word
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

        <div className="grid gap-5 p-5">
          <fieldset>
            <legend className="text-sm font-semibold text-labora-charcoal">Formato</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["pdf", "docx"] as ExportFormat[]).map((item) => (
                <label
                  key={item}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep has-[:checked]:border-labora-green has-[:checked]:bg-labora-ivory"
                >
                  <input
                    type="radio"
                    name="format"
                    value={item}
                    checked={format === item}
                    onChange={() => setFormat(item)}
                    className="h-4 w-4 accent-labora-green"
                  />
                  {item === "pdf" ? "PDF" : "Word"}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="text-sm font-semibold text-labora-charcoal" htmlFor="version">
              Version a exportar
            </label>
            <select
              id="version"
              value={currentVersionId}
              disabled
              className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-labora-ivory px-3 text-sm text-labora-charcoal"
            >
              <option value={currentVersionId}>Version actual v{versionNumber}</option>
            </select>
          </div>

          <div className="grid gap-3">
            <label className="flex items-start gap-3 text-sm text-labora-gray">
              <input
                type="checkbox"
                checked={includeTraceabilityStamp}
                onChange={(event) => setIncludeTraceabilityStamp(event.target.checked)}
                className="mt-1 h-4 w-4 accent-labora-green"
              />
              <span>Incluir sello de trazabilidad</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-labora-gray">
              <input
                type="checkbox"
                checked={includeEvidenceIndex}
                onChange={(event) => setIncludeEvidenceIndex(event.target.checked)}
                className="mt-1 h-4 w-4 accent-labora-green"
              />
              <span>Incluir indice de evidencias</span>
            </label>
          </div>

          {exportMutation.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {exportMutation.error}
            </div>
          ) : null}

          {lastExport ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-sky-900">
              La exportacion quedo en estado <strong>{lastExport.status}</strong>. Puedes cerrar esta ventana y volver cuando este lista.
            </div>
          ) : null}
        </div>

        <footer className="flex flex-col gap-3 border-t border-labora-ui p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={exportMutation.isLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            {exportMutation.isLoading ? "Generando archivo" : "Exportar"}
          </button>
        </footer>
      </div>
    </div>
  );
}

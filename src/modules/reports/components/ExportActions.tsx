import { Download, FileDown, FileText } from "lucide-react";

import type {
  ExportFile,
  ExportFormat,
} from "@/src/modules/reports/api/reports.types";
import { formatDateTime } from "@/src/modules/reports/utils/reportFormatters";

export interface ExportActionsProps {
  reportId: string;
  currentVersionId: string;
  availableExports: ExportFile[];
  onExport: (format: ExportFormat) => void;
  onDownload: (exportFileId: string) => void;
  isExporting?: boolean;
  isDownloading?: boolean;
}

export function ExportActions({
  availableExports,
  onExport,
  onDownload,
  isExporting,
  isDownloading,
}: ExportActionsProps) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-labora-ivory text-labora-deep">
          <FileDown className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-base font-semibold text-labora-charcoal">
            Exportaciones
          </h2>
          <p className="text-xs text-labora-gray">PDF y Word cuando el archivo este listo.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={() => onExport("pdf")}
          disabled={isExporting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Exportar PDF
        </button>
        <button
          type="button"
          onClick={() => onExport("docx")}
          disabled={isExporting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory disabled:cursor-not-allowed disabled:text-labora-gray"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Exportar Word
        </button>
      </div>

      {availableExports.length ? (
        <ul className="mt-4 grid gap-2">
          {availableExports.map((item) => (
            <li key={item.id} className="rounded-lg border border-labora-ui bg-labora-ivory p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-labora-charcoal">
                    {item.format.toUpperCase()} - {item.status}
                  </p>
                  <p className="mt-1 text-xs text-labora-gray">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDownload(item.id)}
                  disabled={item.status !== "ready" || isDownloading}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory disabled:cursor-not-allowed disabled:text-labora-gray"
                  aria-label={`Descargar ${item.format.toUpperCase()}`}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-6 text-labora-gray">
          Aun no hay archivos exportados para esta version.
        </p>
      )}
    </section>
  );
}

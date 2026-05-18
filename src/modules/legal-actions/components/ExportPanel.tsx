import { Download, FileDown, Loader2 } from "lucide-react";

import type { DraftExport } from "@/src/modules/legal-actions/api/legal-actions.types";
import { formatDateTime } from "@/src/modules/cases/utils/caseFormatters";

export type ExportPanelProps = {
  draftId: string;
  canExportPdf: boolean;
  canExportDocx: boolean;
  exports: DraftExport[];
  onExport: (format: "pdf" | "docx") => Promise<void>;
  isLoading?: boolean;
};

export function ExportPanel({
  canExportPdf,
  canExportDocx,
  exports,
  onExport,
  isLoading = false,
}: ExportPanelProps) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div>
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Exportar documento
        </h2>
        <p className="mt-1 text-sm leading-6 text-labora-gray">
          Genera una version PDF o Word para descarga segura.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onExport("pdf")}
          disabled={!canExportPdf || isLoading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileDown className="h-4 w-4" aria-hidden="true" />}
          Descargar PDF
        </button>
        <button
          type="button"
          onClick={() => onExport("docx")}
          disabled={!canExportDocx || isLoading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-labora-gray"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Descargar Word
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-labora-ui">
        <table className="hidden w-full text-left text-sm md:table">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3">Archivo</th>
              <th className="px-4 py-3">Formato</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Descarga</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui">
            {exports.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-labora-charcoal">
                  {item.file_name}
                </td>
                <td className="px-4 py-3 text-labora-gray">{item.format.toUpperCase()}</td>
                <td className="px-4 py-3 text-labora-gray">{item.status}</td>
                <td className="px-4 py-3 text-labora-gray">{formatDateTime(item.created_at)}</td>
                <td className="px-4 py-3">
                  {item.status === "ready" && item.download_url ? (
                    <a
                      href={item.download_url}
                      className="font-semibold text-labora-deep hover:text-labora-green"
                    >
                      Abrir
                    </a>
                  ) : (
                    <span className="text-labora-gray">Pendiente</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid gap-3 p-3 md:hidden">
          {exports.map((item) => (
            <article key={item.id} className="rounded-lg border border-labora-ui p-3 text-sm">
              <p className="font-semibold text-labora-charcoal">{item.file_name}</p>
              <p className="mt-1 text-labora-gray">
                {item.format.toUpperCase()} · {item.status} · {formatDateTime(item.created_at)}
              </p>
              {item.status === "ready" && item.download_url ? (
                <a href={item.download_url} className="mt-2 inline-block font-semibold text-labora-deep">
                  Abrir descarga
                </a>
              ) : null}
            </article>
          ))}
        </div>

        {!exports.length ? (
          <p className="p-4 text-sm text-labora-gray">
            Aun no hay exportaciones generadas.
          </p>
        ) : null}
      </div>
    </section>
  );
}

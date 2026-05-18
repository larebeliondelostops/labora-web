import { Fingerprint, ShieldCheck } from "lucide-react";

import { formatDateTime } from "@/src/modules/reports/utils/reportFormatters";

export interface TraceabilitySealProps {
  versionNumber: number;
  generatedAt: string;
  contentHash?: string;
  sourceHash?: string;
  generatedBy?: string;
}

function shortHash(value?: string) {
  if (!value) {
    return "Sin huella";
  }

  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

export function TraceabilitySeal({
  versionNumber,
  generatedAt,
  contentHash,
  sourceHash,
  generatedBy,
}: TraceabilitySealProps) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-labora-ivory text-labora-deep">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-base font-semibold text-labora-charcoal">
            Sello de trazabilidad
          </h2>
          <p className="text-xs text-labora-gray">Version, fecha y huellas para auditoria.</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="font-semibold text-labora-charcoal">Version</dt>
          <dd className="mt-1 text-labora-gray">v{versionNumber}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Generado</dt>
          <dd className="mt-1 text-labora-gray">{formatDateTime(generatedAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Huella de contenido</dt>
          <dd className="mt-1 inline-flex items-center gap-2 break-all text-labora-gray">
            <Fingerprint className="h-4 w-4 shrink-0" aria-hidden="true" />
            {shortHash(contentHash)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Huella de fuentes</dt>
          <dd className="mt-1 break-all text-labora-gray">{shortHash(sourceHash)}</dd>
        </div>
        {generatedBy ? (
          <div>
            <dt className="font-semibold text-labora-charcoal">Generado por</dt>
            <dd className="mt-1 text-labora-gray">{generatedBy}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

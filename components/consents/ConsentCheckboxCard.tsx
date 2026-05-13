import { FileText } from "lucide-react";

import { getConsentDescription, getConsentTypeLabel, getShortHash } from "@/lib/consent-content";
import { cn } from "@/lib/utils";
import type { ConsentType } from "@/types/consent";

interface ConsentCheckboxCardProps {
  documentId: string;
  consentType: ConsentType;
  title: string;
  description?: string;
  version: string;
  hashSha256: string;
  checked: boolean;
  required: boolean;
  disabled?: boolean;
  showMissing?: boolean;
  onChange: (checked: boolean) => void;
  onOpenDocument: () => void;
}

export function ConsentCheckboxCard({
  documentId,
  consentType,
  title,
  description,
  version,
  hashSha256,
  checked,
  required,
  disabled,
  showMissing,
  onChange,
  onOpenDocument,
}: ConsentCheckboxCardProps) {
  const inputId = `consent-${documentId}`;
  const helpId = `${inputId}-help`;
  const hasMissingError = showMissing && required && !checked;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white p-5 shadow-sm transition",
        checked ? "border-labora-green" : "border-labora-ui",
        hasMissingError && "border-amber-300 bg-amber-50/50",
      )}
    >
      <div className="flex items-start gap-4">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={helpId}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-5 w-5 rounded border-labora-ui text-labora-green focus:ring-labora-green disabled:cursor-not-allowed"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
              {title || getConsentTypeLabel(consentType)}
            </h3>
            {required ? (
              <span className="rounded-full bg-labora-ivory px-2 py-1 text-xs font-semibold text-labora-deep">
                Obligatorio
              </span>
            ) : null}
          </div>
          <p id={helpId} className="mt-2 text-sm leading-6 text-labora-gray">
            {description || getConsentDescription(consentType)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-labora-gray">
            <span>Version {version}</span>
            <span>Hash {getShortHash(hashSha256)}</span>
          </div>
          {hasMissingError ? (
            <p className="mt-3 text-sm font-medium text-amber-800">
              Aun falta aceptar esta autorizacion obligatoria.
            </p>
          ) : null}
          <button
            type="button"
            onClick={onOpenDocument}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-labora-deep underline"
          >
            <FileText className="h-4 w-4" />
            Ver documento completo
          </button>
        </div>
      </div>
    </article>
  );
}

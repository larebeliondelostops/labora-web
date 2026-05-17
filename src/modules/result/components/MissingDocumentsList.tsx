"use client";

import { UploadCloud } from "lucide-react";

import { ButtonLink, Panel, ToneBadge } from "@/src/modules/result/components/ResultPrimitives";
import type { MissingDocument } from "@/src/modules/result/api/result.types";

const priorityTone: Record<MissingDocument["priority"], "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

const priorityCopy: Record<MissingDocument["priority"], string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export function MissingDocumentsList({
  documents,
  caseId,
  onUploadClick,
}: {
  documents: MissingDocument[];
  caseId: string;
  onUploadClick?: (document: MissingDocument) => void;
}) {
  if (!documents.length) {
    return (
      <Panel>
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-labora-mint/25 text-labora-deep">
            <UploadCloud className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Documentos faltantes
            </h2>
            <p className="mt-3 text-sm leading-6 text-labora-gray">
              No hay documentos faltantes reportados por el backend.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Documentos faltantes
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            Agrega estos soportes para mejorar el expediente y reducir incertidumbre.
          </p>
        </div>
        <ToneBadge tone="warning">{documents.length} pendientes</ToneBadge>
      </div>

      <div className="mt-5 grid gap-3">
        {documents.map((document) => (
          <article
            key={document.id || document.name}
            className="flex flex-col gap-4 rounded-xl border border-labora-ui bg-labora-ivory p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-labora-charcoal">{document.name}</h3>
                <ToneBadge tone={priorityTone[document.priority]}>
                  Prioridad {priorityCopy[document.priority]}
                </ToneBadge>
                {document.required ? <ToneBadge tone="neutral">Requerido</ToneBadge> : null}
              </div>
              {document.description ? (
                <p className="mt-2 text-sm leading-6 text-labora-gray">
                  {document.description}
                </p>
              ) : null}
            </div>

            <ButtonLink
              href={document.uploadUrl || `/app/cases/${caseId}/documents`}
              variant="secondary"
              onClick={() => onUploadClick?.(document)}
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Subir
            </ButtonLink>
          </article>
        ))}
      </div>
    </Panel>
  );
}

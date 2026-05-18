import { FileSearch } from "lucide-react";

import type {
  EvidenceRef,
  ReportSection,
} from "@/src/modules/reports/api/reports.types";
import { AiConfidenceWarning } from "@/src/modules/reports/components/AiConfidenceWarning";
import { formatPercent } from "@/src/modules/reports/utils/reportFormatters";

export interface ReportSectionRendererProps {
  section: ReportSection;
  onOpenEvidence?: (refs: EvidenceRef[]) => void;
}

function MarkdownBlock({ content }: { content: string }) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return (
      <p className="text-sm leading-6 text-labora-gray">
        El backend no envio contenido textual para esta seccion.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        if (line.startsWith("### ")) {
          return (
            <h4 key={`${line}-${index}`} className="pt-2 text-base font-semibold text-labora-charcoal">
              {line.replace(/^###\s+/, "")}
            </h4>
          );
        }

        if (line.startsWith("## ")) {
          return (
            <h3 key={`${line}-${index}`} className="pt-2 font-heading text-lg font-semibold text-labora-charcoal">
              {line.replace(/^##\s+/, "")}
            </h3>
          );
        }

        if (line.startsWith("# ")) {
          return (
            <h2 key={`${line}-${index}`} className="font-heading text-xl font-semibold text-labora-charcoal">
              {line.replace(/^#\s+/, "")}
            </h2>
          );
        }

        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={`${line}-${index}`} className="flex gap-3 text-sm leading-6 text-labora-gray">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-labora-green" aria-hidden="true" />
              <p>{line.replace(/^[-*]\s+/, "")}</p>
            </div>
          );
        }

        return (
          <p key={`${line}-${index}`} className="text-sm leading-7 text-labora-gray">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function ReportSectionRenderer({
  section,
  onOpenEvidence,
}: ReportSectionRendererProps) {
  const refs = section.sourceRefs || [];
  const needsReview =
    section.sectionKey === "conclusions" && refs.length === 0;

  return (
    <article
      id={section.sectionKey}
      className="scroll-mt-24 rounded-2xl border border-labora-ui bg-white p-5 shadow-panel"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            {section.title}
          </h2>
          {typeof section.confidence === "number" ? (
            <p className="mt-1 text-xs font-semibold text-labora-gray">
              Confianza {formatPercent(section.confidence)}
            </p>
          ) : null}
        </div>

        {refs.length || section.sectionKey === "conclusions" ? (
          <button
            type="button"
            onClick={() => onOpenEvidence?.(refs)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green"
          >
            <FileSearch className="h-4 w-4" aria-hidden="true" />
            Ver soporte
          </button>
        ) : null}
      </div>

      {needsReview ? (
        <div className="mt-4">
          <AiConfidenceWarning
            requiresHumanReview
            reviewReason="La conclusion no tiene evidencia asociada en la respuesta del backend."
          />
        </div>
      ) : null}

      <div className="mt-5">
        <MarkdownBlock content={section.contentMarkdown} />
      </div>
    </article>
  );
}

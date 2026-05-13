import { X } from "lucide-react";

import { getShortHash } from "@/lib/consent-content";

interface LegalDocumentViewerProps {
  title: string;
  version: string;
  contentMarkdown: string;
  hashSha256: string;
  onViewed?: () => void;
  onClose?: () => void;
}

function renderMarkdownLine(line: string, index: number) {
  const trimmed = line.trim();

  if (!trimmed) {
    return <div key={index} className="h-3" />;
  }

  if (trimmed.startsWith("### ")) {
    return (
      <h4 key={index} className="mt-5 font-heading text-base font-semibold text-labora-charcoal">
        {trimmed.slice(4)}
      </h4>
    );
  }

  if (trimmed.startsWith("## ")) {
    return (
      <h3 key={index} className="mt-6 font-heading text-lg font-semibold text-labora-charcoal">
        {trimmed.slice(3)}
      </h3>
    );
  }

  if (trimmed.startsWith("# ")) {
    return (
      <h2 key={index} className="font-heading text-xl font-semibold text-labora-charcoal">
        {trimmed.slice(2)}
      </h2>
    );
  }

  if (trimmed.startsWith("- ")) {
    return (
      <li key={index} className="ml-5 list-disc text-sm leading-6 text-labora-gray">
        {trimmed.slice(2)}
      </li>
    );
  }

  return (
    <p key={index} className="text-sm leading-6 text-labora-gray">
      {trimmed}
    </p>
  );
}

export function LegalDocumentViewer({
  title,
  version,
  contentMarkdown,
  hashSha256,
  onViewed,
  onClose,
}: LegalDocumentViewerProps) {
  return (
    <section
      className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel"
      aria-label={`Documento legal ${title}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Documento legal
          </p>
          <h2 className="mt-2 font-heading text-xl font-semibold text-labora-charcoal">
            {title}
          </h2>
          <p className="mt-1 text-xs text-labora-gray">
            Version {version} · Hash {getShortHash(hashSha256)}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-labora-ui text-labora-gray hover:bg-labora-ivory"
            aria-label="Cerrar documento"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div
        className="mt-5 max-h-[58vh] overflow-y-auto rounded-lg border border-labora-ui bg-labora-ivory p-4"
        tabIndex={0}
        onScroll={onViewed}
      >
        <div className="grid gap-2">{contentMarkdown.split(/\r?\n/).map(renderMarkdownLine)}</div>
      </div>
    </section>
  );
}

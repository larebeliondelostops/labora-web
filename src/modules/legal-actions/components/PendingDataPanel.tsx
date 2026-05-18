import { AlertTriangle, CheckCircle2, Paperclip } from "lucide-react";

import type {
  DraftAttachment,
  MissingAttachment,
  PendingMarker,
  Warning,
} from "@/src/modules/legal-actions/api/legal-actions.types";

export function PendingDataPanel({
  pending,
  warnings,
  missingAttachments,
  attachments,
  onSectionSelect,
}: {
  pending: PendingMarker[];
  warnings: Warning[];
  missingAttachments: MissingAttachment[];
  attachments?: DraftAttachment[];
  onSectionSelect?: (sectionKey: string) => void;
}) {
  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
        <h2 className="font-heading text-base font-semibold text-labora-charcoal">
          Pendientes
        </h2>
        <div className="mt-3 grid gap-2">
          {pending.length ? (
            pending.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => item.section_key && onSectionSelect?.(item.section_key)}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-900"
              >
                <span className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </span>
              </button>
            ))
          ) : (
            <p className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              No hay datos pendientes marcados.
            </p>
          )}
        </div>
      </section>

      {warnings.length ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <h2 className="font-heading text-base font-semibold">Advertencias</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6">
            {warnings.map((warning) => (
              <li key={warning.code}>{warning.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
        <h2 className="font-heading text-base font-semibold text-labora-charcoal">
          Anexos
        </h2>
        <div className="mt-3 grid gap-2">
          {attachments?.slice(0, 4).map((attachment) => (
            <p key={attachment.id} className="flex gap-2 rounded-lg bg-labora-ivory p-3 text-sm text-labora-gray">
              <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
              {attachment.label}
            </p>
          ))}
          {missingAttachments.map((attachment) => (
            <p key={attachment.code} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Falta: {attachment.label}
            </p>
          ))}
          {!attachments?.length && !missingAttachments.length ? (
            <p className="text-sm text-labora-gray">Sin anexos asociados.</p>
          ) : null}
        </div>
      </section>
    </aside>
  );
}

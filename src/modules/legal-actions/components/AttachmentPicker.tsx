import { Paperclip } from "lucide-react";

import type {
  DraftAttachment,
  MissingAttachment,
  WizardAttachmentsData,
} from "@/src/modules/legal-actions/api/legal-actions.types";

type AttachmentPickerProps = {
  attachments: DraftAttachment[];
  missingAttachments: MissingAttachment[];
  value: WizardAttachmentsData;
  onChange: (value: WizardAttachmentsData) => void;
};

export function AttachmentPicker({
  attachments,
  missingAttachments,
  value,
  onChange,
}: AttachmentPickerProps) {
  function toggleAttachment(id: string, checked: boolean) {
    onChange({
      ...value,
      selected_attachments: checked
        ? [...new Set([...value.selected_attachments, id])]
        : value.selected_attachments.filter((item) => item !== id),
    });
  }

  function toggleAcknowledgement(code: string, checked: boolean) {
    onChange({
      ...value,
      missing_attachment_acknowledgements: checked
        ? [...new Set([...value.missing_attachment_acknowledgements, code])]
        : value.missing_attachment_acknowledgements.filter((item) => item !== code),
    });
  }

  function selectSuggested() {
    onChange({
      ...value,
      selected_attachments: attachments
        .filter((item) => item.suggested && item.status === "available")
        .map((item) => item.id),
    });
  }

  return (
    <section className="grid gap-5 rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Pruebas y anexos
          </h2>
          <p className="mt-1 text-sm leading-6 text-labora-gray">
            Selecciona los documentos que deben acompanhar el escrito.
          </p>
        </div>
        <button
          type="button"
          onClick={selectSuggested}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
        >
          Seleccionar sugeridos
        </button>
      </div>

      <div className="grid gap-3">
        {attachments.length ? (
          attachments.map((attachment) => (
            <label
              key={attachment.id}
              className="flex items-start gap-3 rounded-lg border border-labora-ui bg-labora-ivory p-4"
            >
              <input
                type="checkbox"
                checked={value.selected_attachments.includes(attachment.id)}
                disabled={attachment.status !== "available"}
                onChange={(event) =>
                  toggleAttachment(attachment.id, event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green"
              />
              <Paperclip className="mt-0.5 h-4 w-4 text-labora-green" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-labora-charcoal">
                  {attachment.label}
                </span>
                <span className="mt-1 block text-xs text-labora-gray">
                  {attachment.type || "Documento"} · {attachment.status}
                  {attachment.required ? " · obligatorio" : ""}
                </span>
              </span>
            </label>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-labora-ui p-4 text-sm text-labora-gray">
            No hay anexos asociados enviados por el backend.
          </p>
        )}
      </div>

      {missingAttachments.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <h3 className="font-semibold">Anexos faltantes</h3>
          <div className="mt-3 grid gap-2">
            {missingAttachments.map((attachment) => (
              <label key={attachment.code} className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={value.missing_attachment_acknowledgements.includes(
                    attachment.code,
                  )}
                  onChange={(event) =>
                    toggleAcknowledgement(attachment.code, event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-amber-300 text-labora-green"
                />
                <span>
                  <span className="font-semibold">{attachment.label}</span>
                  {attachment.description ? ` - ${attachment.description}` : ""}
                  {attachment.required ? " (critico)" : ""}
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

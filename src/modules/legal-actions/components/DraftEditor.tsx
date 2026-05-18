"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  History,
  Italic,
  List,
  MessageSquare,
  Quote,
  RefreshCcw,
  Save,
  Wand2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  DraftSection,
  LegalDraft,
  SourceReference,
} from "@/src/modules/legal-actions/api/legal-actions.types";
import { sanitizeDraftHtml } from "@/src/modules/legal-actions/utils/sanitizeDraftHtml";
import { draftSectionStatusLabels } from "@/src/modules/legal-actions/utils/mapStatusToLabel";

export type DraftEditorProps = {
  draft: LegalDraft;
  activeSectionId: string;
  onSectionChange: (sectionId: string) => void;
  onSaveSection: (sectionId: string, contentHtml: string) => Promise<void>;
  onRegenerateSection?: (sectionId: string, instruction: string) => Promise<void>;
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

function AiConfidenceBadge({ score }: { score?: number }) {
  if (typeof score !== "number") {
    return null;
  }

  const low = score < 0.7;

  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-semibold",
        low
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      Confianza IA {Math.round(score * 100)}%
    </span>
  );
}

function SourceReferencesPanel({ refs }: { refs: SourceReference[] }) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
      <h3 className="font-heading text-base font-semibold text-labora-charcoal">
        Fuentes
      </h3>
      <div className="mt-3 grid gap-2">
        {refs.length ? (
          refs.map((ref) => (
            <p key={`${ref.type}-${ref.id}`} className="rounded-lg bg-labora-ivory p-3 text-sm text-labora-gray">
              <span className="font-semibold text-labora-deep">{ref.label}</span>
              <span className="block text-xs">{ref.type}</span>
            </p>
          ))
        ) : (
          <p className="text-sm text-labora-gray">Sin fuentes asociadas.</p>
        )}
      </div>
    </section>
  );
}

function EmptyDrawerCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MessageSquare;
  title: string;
  text: string;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
        <div>
          <h3 className="font-heading text-base font-semibold text-labora-charcoal">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-labora-gray">{text}</p>
        </div>
      </div>
    </section>
  );
}

export function DraftEditor({
  draft,
  activeSectionId,
  onSectionChange,
  onSaveSection,
  onRegenerateSection,
}: DraftEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [instruction, setInstruction] = useState("");
  const activeSection = useMemo<DraftSection | undefined>(
    () => draft.sections.find((section) => section.id === activeSectionId),
    [activeSectionId, draft.sections],
  );

  useEffect(() => {
    const nextContent = sanitizeDraftHtml(activeSection?.content_html || "");
    setContent(nextContent);
    setSaveState("idle");

    if (editorRef.current) {
      editorRef.current.innerHTML = nextContent;
    }
  }, [activeSection?.id, activeSection?.content_html]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (saveState !== "dirty" && saveState !== "error") {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);

  function runCommand(command: string) {
    editorRef.current?.focus();
    document.execCommand(command);
    const html = sanitizeDraftHtml(editorRef.current?.innerHTML || "");
    setContent(html);
    setSaveState("dirty");
  }

  async function handleSave() {
    if (!activeSection) {
      return;
    }

    setSaveState("saving");

    try {
      const html = sanitizeDraftHtml(content);
      await onSaveSection(activeSection.id, html);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  async function handleRegenerate() {
    if (!activeSection || !onRegenerateSection || !instruction.trim()) {
      return;
    }

    await onRegenerateSection(activeSection.id, instruction.trim());
    setInstruction("");
  }

  function handleSectionChange(sectionId: string) {
    if ((saveState === "dirty" || saveState === "error") && !window.confirm("Hay cambios sin guardar. Deseas cambiar de seccion?")) {
      return;
    }

    onSectionChange(sectionId);
  }

  if (!activeSection) {
    return (
      <section className="rounded-2xl border border-labora-ui bg-white p-5 text-sm text-labora-gray shadow-panel">
        No encontramos secciones editables en este borrador.
      </section>
    );
  }

  const saveLabel = {
    idle: "Sin cambios",
    dirty: "Cambios sin guardar",
    saving: "Guardando...",
    saved: "Guardado",
    error: "Error al guardar",
  }[saveState];

  return (
    <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
      <aside className="hidden xl:block">
        <div className="sticky top-5 rounded-2xl border border-labora-ui bg-white p-3 shadow-panel">
          <div className="grid gap-2">
            {draft.sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionChange(section.id)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition",
                  activeSectionId === section.id
                    ? "border-labora-green bg-labora-mint/25 text-labora-deep"
                    : "border-labora-ui bg-white text-labora-gray hover:bg-labora-ivory",
                )}
              >
                <span className="block text-sm font-semibold">{section.title}</span>
                <span className="mt-1 block text-xs">
                  {draftSectionStatusLabels[section.status]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="min-w-0 space-y-4">
        <label className="block xl:hidden">
          <span className="text-sm font-semibold text-labora-charcoal">Seccion</span>
          <select
            value={activeSectionId}
            onChange={(event) => handleSectionChange(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal"
          >
            {draft.sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </label>

        <section className="overflow-hidden rounded-2xl border border-labora-ui bg-white shadow-panel">
          <div className="flex flex-col gap-3 border-b border-labora-ui bg-labora-ivory p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                {activeSection.title}
              </h2>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-full border border-labora-ui bg-white px-2.5 py-1 text-xs font-semibold text-labora-gray">
                  {saveLabel}
                </span>
                <AiConfidenceBadge score={activeSection.confidence_score} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runCommand("bold")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui bg-white text-labora-deep hover:bg-labora-mint/25"
                aria-label="Negrilla"
              >
                <Bold className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => runCommand("italic")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui bg-white text-labora-deep hover:bg-labora-mint/25"
                aria-label="Cursiva"
              >
                <Italic className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => runCommand("insertUnorderedList")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui bg-white text-labora-deep hover:bg-labora-mint/25"
                aria-label="Lista"
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => runCommand("formatBlock")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui bg-white text-labora-deep hover:bg-labora-mint/25"
                aria-label="Cita"
              >
                <Quote className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveState === "saving"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-labora-green px-3 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:bg-slate-300"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Guardar
              </button>
            </div>
          </div>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => {
              const html = sanitizeDraftHtml(event.currentTarget.innerHTML);
              setContent(html);
              setSaveState("dirty");
            }}
            className="prose prose-sm min-h-[440px] max-w-none p-5 text-labora-charcoal outline-none focus:ring-2 focus:ring-inset focus:ring-labora-green/15"
          />
        </section>

        {onRegenerateSection ? (
          <section className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
            <div className="flex gap-3">
              <Wand2 className="mt-1 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-base font-semibold text-labora-charcoal">
                  Regenerar seccion
                </h3>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={instruction}
                    onChange={(event) => setInstruction(event.target.value)}
                    className="min-h-11 flex-1 rounded-lg border border-labora-ui px-3 text-sm outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
                    placeholder="Indica que debe ajustar la IA"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                  >
                    <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                    Regenerar
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <aside className="space-y-4">
        <SourceReferencesPanel refs={activeSection.source_references} />
        <EmptyDrawerCard
          icon={History}
          title="Historial de versiones"
          text="Las versiones quedaran visibles cuando el backend las envie para este borrador."
        />
        <EmptyDrawerCard
          icon={MessageSquare}
          title="Comentarios"
          text="Los comentarios de revision se mostraran aqui cuando existan."
        />
      </aside>
    </div>
  );
}

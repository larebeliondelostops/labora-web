import { cn } from "@/lib/utils";
import type { DraftSection } from "@/src/modules/legal-actions/api/legal-actions.types";
import { draftSectionStatusLabels } from "@/src/modules/legal-actions/utils/mapStatusToLabel";

export function SectionNavigator({
  sections,
  activeSectionId,
  onSectionChange,
}: {
  sections: DraftSection[];
  activeSectionId: string;
  onSectionChange: (sectionId: string) => void;
}) {
  return (
    <nav className="grid gap-2">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSectionChange(section.id)}
          className={cn(
            "rounded-lg border px-3 py-3 text-left transition",
            section.id === activeSectionId
              ? "border-labora-green bg-labora-mint/25 text-labora-deep"
              : "border-labora-ui bg-white text-labora-gray hover:bg-labora-ivory",
          )}
        >
          <span className="block text-sm font-semibold">{section.title}</span>
          <span className="mt-1 block text-xs">
            {draftSectionStatusLabels[section.status]}
            {section.pending_markers.length ? ` · ${section.pending_markers.length} pendiente(s)` : ""}
          </span>
        </button>
      ))}
    </nav>
  );
}

import type { ReportStatus } from "@/src/modules/reports/api/reports.types";
import { cn } from "@/lib/utils";
import { ReportStatusBadge } from "@/src/modules/reports/components/ReportStatusBadge";

export interface ReportTocItem {
  sectionKey: string;
  title: string;
  status?: ReportStatus;
}

export interface ReportTableOfContentsProps {
  items: ReportTocItem[];
  activeSectionKey?: string;
  onSelect: (sectionKey: string) => void;
}

export function ReportTableOfContents({
  items,
  activeSectionKey,
  onSelect,
}: ReportTableOfContentsProps) {
  return (
    <nav aria-label="Tabla de contenido del informe" className="grid gap-2">
      {items.map((item) => {
        const active = item.sectionKey === activeSectionKey;

        return (
          <button
            key={item.sectionKey}
            type="button"
            onClick={() => onSelect(item.sectionKey)}
            className={cn(
              "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
              active
                ? "border-labora-green bg-labora-green text-white"
                : "border-transparent text-labora-gray hover:border-labora-ui hover:bg-labora-ivory hover:text-labora-deep",
            )}
            aria-current={active ? "true" : undefined}
          >
            <span>{item.title}</span>
            {item.status && !active ? (
              <ReportStatusBadge status={item.status} />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

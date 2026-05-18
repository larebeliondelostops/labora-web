import Link from "next/link";
import { BarChart3, ClipboardList, FileText, FolderOpen, History, ListChecks, ScrollText, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { label: "Resumen", href: "", icon: FolderOpen },
  { label: "Documentos", href: "documents", icon: FileText },
  { label: "Datos extraidos", href: "extraction", icon: ClipboardList },
  { label: "Cuestionario", href: "questionnaire", icon: ListChecks },
  { label: "Progreso", href: "progress", icon: ListChecks },
  { label: "Resultado", href: "result", icon: BarChart3 },
  { label: "Informe", href: "reports", icon: ScrollText },
  { label: "Calculo", href: "result?tab=calculo", icon: Table2 },
  { label: "Escritos", href: "legal-actions", icon: ScrollText },
  { label: "Entrega final", href: "delivery", icon: FileText },
  { label: "Historial", href: "history", icon: History },
];

export function CaseReportsNavigation({
  caseId,
  active = "Informe",
}: {
  caseId: string;
  active?: string;
}) {
  return (
    <nav
      aria-label="Navegacion del expediente"
      className="flex gap-2 overflow-x-auto rounded-2xl border border-labora-ui bg-white p-2 shadow-panel"
    >
      {tabs.map((tab) => {
        const isActive = tab.label === active;
        const href = tab.href
          ? `/app/cases/${caseId}/${tab.href}`
          : `/app/cases/${caseId}`;

        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
              isActive
                ? "bg-labora-green text-white"
                : "text-labora-gray hover:bg-labora-ivory hover:text-labora-deep",
            )}
          >
            <tab.icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  CaseHistoryItem,
  CaseHistorySeverity,
} from "@/src/modules/cases/api/cases.types";
import { formatDateTime } from "@/src/modules/cases/utils/caseFormatters";

const severityMeta: Record<
  CaseHistorySeverity,
  { className: string; icon: typeof Info }
> = {
  info: {
    className: "border-sky-200 bg-sky-50 text-sky-800",
    icon: Info,
  },
  success: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  warning: {
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: AlertTriangle,
  },
  error: {
    className: "border-red-200 bg-red-50 text-red-700",
    icon: CircleAlert,
  },
};

export function CaseHistoryTimeline({ items }: { items: CaseHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-labora-ui bg-white p-6 text-sm text-labora-gray shadow-panel">
        Aun no hay movimientos registrados para este expediente.
      </section>
    );
  }

  return (
    <ol className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      {items.map((item, index) => {
        const meta = severityMeta[item.severity];
        const Icon = meta.icon;

        return (
          <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < items.length - 1 ? (
              <span className="absolute left-5 top-10 h-[calc(100%-2.5rem)] w-px bg-labora-ui" />
            ) : null}
            <span
              className={cn(
                "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                meta.className,
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <time className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
                {formatDateTime(item.occurredAt)}
              </time>
              <h3 className="mt-1 text-sm font-semibold text-labora-charcoal">
                {item.title}
              </h3>
              {item.description ? (
                <p className="mt-1 text-sm leading-6 text-labora-gray">
                  {item.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

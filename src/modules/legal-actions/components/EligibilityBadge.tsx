import { AlertTriangle, CheckCircle2, Clock3, LockKeyhole } from "lucide-react";

import { cn } from "@/lib/utils";
import type { EligibilityStatus } from "@/src/modules/legal-actions/api/legal-actions.types";
import { eligibilityLabels } from "@/src/modules/legal-actions/utils/mapStatusToLabel";

const badgeClasses: Record<EligibilityStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-800",
  recommended: "border-labora-green/25 bg-labora-mint/35 text-labora-deep",
  not_recommended: "border-slate-200 bg-slate-50 text-slate-700",
  blocked: "border-red-200 bg-red-50 text-red-700",
  requires_more_data: "border-amber-200 bg-amber-50 text-amber-800",
  requires_professional_review: "border-sky-200 bg-sky-50 text-sky-800",
};

export function EligibilityBadge({
  status,
  className,
}: {
  status: EligibilityStatus;
  className?: string;
}) {
  const Icon =
    status === "available" || status === "recommended"
      ? CheckCircle2
      : status === "blocked"
        ? LockKeyhole
        : status === "requires_more_data"
          ? Clock3
          : AlertTriangle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        badgeClasses[status],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {eligibilityLabels[status]}
    </span>
  );
}

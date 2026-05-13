import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/src/modules/cases/api/cases.types";
import { getCaseStatusMeta } from "@/src/modules/cases/utils/caseStatus";

const toneClasses = {
  neutral: "border-labora-ui bg-labora-ivory text-labora-gray",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-700",
  deep: "border-labora-deep/20 bg-labora-deep text-white",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function CaseStatusBadge({
  status,
  className,
}: {
  status: CaseStatus;
  className?: string;
}) {
  const meta = getCaseStatusMeta(status);

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[meta.tone],
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

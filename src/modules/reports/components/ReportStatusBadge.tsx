import type { ReportStatus } from "@/src/modules/reports/api/reports.types";
import { cn } from "@/lib/utils";
import { getReportStatusMeta } from "@/src/modules/reports/utils/reportStatusLabels";

export interface ReportStatusBadgeProps {
  status: ReportStatus;
  label?: string;
}

const toneClass = {
  neutral: "border-labora-ui bg-labora-ivory text-labora-gray",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  deep: "border-labora-deep/20 bg-labora-deep/10 text-labora-deep",
};

export function ReportStatusBadge({ status, label }: ReportStatusBadgeProps) {
  const meta = getReportStatusMeta(status);

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-semibold",
        toneClass[meta.tone],
      )}
    >
      {label || meta.label}
    </span>
  );
}

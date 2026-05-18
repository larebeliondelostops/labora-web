import { ArrowRight, FileText, PlayCircle } from "lucide-react";

import type {
  ReportStatus,
  ReportType,
} from "@/src/modules/reports/api/reports.types";
import { ReportStatusBadge } from "@/src/modules/reports/components/ReportStatusBadge";
import { formatDateTime } from "@/src/modules/reports/utils/reportFormatters";
import {
  getReportStatusMeta,
  isReportReady,
} from "@/src/modules/reports/utils/reportStatusLabels";

export interface ReportCardProps {
  reportType: ReportType;
  title: string;
  description: string;
  status: ReportStatus;
  updatedAt?: string;
  versionNumber?: number;
  onOpen?: () => void;
  onGenerate?: () => void;
  isBusy?: boolean;
}

export function ReportCard({
  title,
  description,
  status,
  updatedAt,
  versionNumber,
  onOpen,
  onGenerate,
  isBusy,
}: ReportCardProps) {
  const meta = getReportStatusMeta(status);
  const ready = isReportReady(status);
  const canGenerate = status === "not_started" || status === "error" || status === "failed";
  const actionLabel = ready ? "Ver informe" : canGenerate ? "Generar informe" : meta.label;
  const handleAction = ready ? onOpen : canGenerate ? onGenerate : undefined;

  return (
    <article className="flex min-h-[230px] flex-col justify-between rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-labora-ivory text-labora-deep">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <ReportStatusBadge status={status} />
        </div>

        <h2 className="mt-4 font-heading text-lg font-semibold text-labora-charcoal">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-labora-gray">{description}</p>

        <dl className="mt-4 grid gap-2 text-xs text-labora-gray">
          <div className="flex items-center justify-between gap-3">
            <dt>Version</dt>
            <dd className="font-semibold text-labora-charcoal">
              {versionNumber ? `v${versionNumber}` : "Sin version"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>Actualizado</dt>
            <dd className="text-right font-semibold text-labora-charcoal">
              {formatDateTime(updatedAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={handleAction}
          disabled={!handleAction || isBusy}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
        >
          {ready ? (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
          )}
          {isBusy ? "Procesando" : actionLabel}
        </button>
        {!ready && !canGenerate ? (
          <p className="mt-3 text-xs leading-5 text-labora-gray">{meta.message}</p>
        ) : null}
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, FileDown, RefreshCcw } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { CaseReportsNavigation } from "@/src/modules/reports/components/CaseReportsNavigation";
import { ExportReportModal } from "@/src/modules/reports/components/ExportReportModal";
import { ReportStatusBadge } from "@/src/modules/reports/components/ReportStatusBadge";
import { useReport, useReportVersions } from "@/src/modules/reports/hooks/useReports";
import type { ReportVersionSummary } from "@/src/modules/reports/api/reports.types";
import { formatDateTime } from "@/src/modules/reports/utils/reportFormatters";

function VersionStatusBadge({ status }: { status: ReportVersionSummary["status"] }) {
  const label = {
    current: "Actual",
    superseded: "Reemplazada",
    archived: "Archivada",
  }[status];

  return (
    <span className="inline-flex rounded-full border border-labora-ui bg-labora-ivory px-3 py-1 text-xs font-semibold text-labora-deep">
      {label}
    </span>
  );
}

export function ReportVersionsPage({
  caseId,
  reportId,
}: {
  caseId: string;
  reportId: string;
}) {
  const caseDetail = useCaseDetail(caseId);
  const report = useReport(reportId, { poll: false });
  const versions = useReportVersions(reportId);
  const [selectedVersion, setSelectedVersion] = useState<ReportVersionSummary | null>(null);

  if (caseDetail.isLoading || report.isLoading || versions.isLoading) {
    return (
      <section className="grid gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  return (
    <section className="space-y-5 pb-24 md:pb-0">
      {caseDetail.data ? (
        <CaseHeader
          caseNumber={caseDetail.data.caseNumber}
          status={caseDetail.data.status}
          holderFullName={getHolderFullName(caseDetail.data.holder)}
          updatedAt={caseDetail.data.updatedAt}
        />
      ) : null}

      <CaseReportsNavigation caseId={caseId} />

      <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <Link
          href={`/app/cases/${caseId}/reports/${reportId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al informe
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
              Historial de versiones
            </h1>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Versiones generadas, cambios y estado documental.
            </p>
          </div>
          {report.data ? <ReportStatusBadge status={report.data.status} /> : null}
        </div>
      </div>

      {report.error ? <InlineAlert tone="warning">{report.error}</InlineAlert> : null}

      {versions.error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">{versions.error}</p>
            <button
              type="button"
              onClick={versions.refetch}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        </section>
      ) : null}

      {versions.data.items.length ? (
        <ol className="relative grid gap-4 before:absolute before:left-5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-labora-ui">
          {versions.data.items.map((version) => (
            <li key={version.id} className="relative pl-12">
              <span className="absolute left-3 top-5 h-4 w-4 rounded-full border-4 border-white bg-labora-green shadow-panel" />
              <article className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                        Version v{version.versionNumber}
                      </h2>
                      <VersionStatusBadge status={version.status} />
                    </div>
                    <p className="mt-2 text-sm text-labora-gray">
                      {formatDateTime(version.createdAt)}
                      {version.createdByRole ? ` - ${version.createdByRole}` : ""}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-labora-gray">
                      {version.changeSummary || "Sin resumen de cambios reportado."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/app/cases/${caseId}/reports/${reportId}?version=${version.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                    >
                      Ver version
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedVersion(version)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-labora-green px-3 py-2 text-sm font-semibold text-white hover:bg-labora-deep"
                    >
                      <FileDown className="h-4 w-4" aria-hidden="true" />
                      Exportar
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-2xl border border-labora-ui bg-white p-5 text-sm text-labora-gray shadow-panel">
          Aun no hay versiones registradas para este informe.
        </div>
      )}

      {selectedVersion && report.data ? (
        <ExportReportModal
          open={Boolean(selectedVersion)}
          reportId={reportId}
          currentVersionId={selectedVersion.id}
          versionNumber={selectedVersion.versionNumber}
          onClose={() => setSelectedVersion(null)}
          onExported={() => report.refresh()}
        />
      ) : null}
    </section>
  );
}

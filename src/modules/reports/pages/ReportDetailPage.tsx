"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Download, RefreshCcw } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { AiConfidenceWarning } from "@/src/modules/reports/components/AiConfidenceWarning";
import { CalculationSummaryCards } from "@/src/modules/reports/components/CalculationSummaryCards";
import { CaseReportsNavigation } from "@/src/modules/reports/components/CaseReportsNavigation";
import { EvidenceReferencesDrawer } from "@/src/modules/reports/components/EvidenceReferencesDrawer";
import { ExportActions } from "@/src/modules/reports/components/ExportActions";
import { ExportReportModal } from "@/src/modules/reports/components/ExportReportModal";
import { ProfessionalReviewCTA } from "@/src/modules/professional-review/components/professional-review-components";
import {
  InconsistencyMatrixTable,
  normalizeInconsistencyRows,
} from "@/src/modules/reports/components/InconsistencyMatrixTable";
import { ReportSectionRenderer } from "@/src/modules/reports/components/ReportSectionRenderer";
import { ReportStatusBadge } from "@/src/modules/reports/components/ReportStatusBadge";
import { ReportTableOfContents } from "@/src/modules/reports/components/ReportTableOfContents";
import { TraceabilitySeal } from "@/src/modules/reports/components/TraceabilitySeal";
import { useDownloadExport, useReport } from "@/src/modules/reports/hooks/useReports";
import type {
  EvidenceRef,
  ExportFormat,
  ReportDetailResponse,
  ReportSection,
} from "@/src/modules/reports/api/reports.types";
import {
  formatDateTime,
  formatReportType,
} from "@/src/modules/reports/utils/reportFormatters";
import {
  getReportStatusMeta,
  isReportProcessing,
  isReportReady,
} from "@/src/modules/reports/utils/reportStatusLabels";

type DetailView = "full" | "executive" | "technical" | "calculation" | "matrix";

const viewTabs: Array<{ id: DetailView; label: string }> = [
  { id: "full", label: "Completo" },
  { id: "executive", label: "Ejecutivo" },
  { id: "technical", label: "Tecnico" },
  { id: "calculation", label: "Calculo" },
  { id: "matrix", label: "Inconsistencias" },
];

function isDetailView(value: string | null): value is DetailView {
  return Boolean(value && viewTabs.some((tab) => tab.id === value));
}

function findSection(sections: ReportSection[], keys: string[]) {
  return sections.find((section) => keys.includes(section.sectionKey));
}

function selectSections(sections: ReportSection[], keys: string[]) {
  return sections.filter((section) => keys.includes(section.sectionKey));
}

function isReportSection(section: ReportSection | undefined): section is ReportSection {
  return Boolean(section);
}

function ReportViewTabs({
  activeView,
  onChange,
}: {
  activeView: DetailView;
  onChange: (view: DetailView) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-labora-ui bg-white p-2 shadow-panel">
      {viewTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={
            activeView === tab.id
              ? "inline-flex min-h-10 shrink-0 items-center rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white"
              : "inline-flex min-h-10 shrink-0 items-center rounded-lg px-4 py-2 text-sm font-semibold text-labora-gray hover:bg-labora-ivory hover:text-labora-deep"
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ExecutiveReportView({
  report,
  onOpenEvidence,
}: {
  report: ReportDetailResponse;
  onOpenEvidence: (refs: EvidenceRef[]) => void;
}) {
  const executive = findSection(report.sections, ["executive_summary"]);
  const route = findSection(report.sections, ["recommended_route"]);
  const missing = findSection(report.sections, ["missing_documents"]);
  const warnings = findSection(report.sections, ["warnings_scope"]);

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Resultado general
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
            {executive?.title || "Resumen ejecutivo"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-labora-gray">
            {executive?.contentMarkdown || "El backend no envio un resumen ejecutivo para este informe."}
          </p>
        </article>
        <article className="rounded-2xl border border-labora-ui bg-labora-ivory p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-gray">
            Version actual
          </p>
          <p className="mt-3 text-3xl font-semibold text-labora-deep">
            v{report.currentVersion.versionNumber}
          </p>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            {formatDateTime(report.currentVersion.createdAt)}
          </p>
        </article>
      </div>

      {[route, missing, warnings].filter(isReportSection).map((section) => (
        <ReportSectionRenderer
          key={section.id}
          section={section}
          onOpenEvidence={onOpenEvidence}
        />
      ))}

      <InlineAlert tone="warning">
        Este analisis puede requerir revision profesional para uso judicial.
      </InlineAlert>
    </section>
  );
}

function TechnicalReportView({
  sections,
  onOpenEvidence,
}: {
  sections: ReportSection[];
  onOpenEvidence: (refs: EvidenceRef[]) => void;
}) {
  const technicalSections = selectSections(sections, [
    "relevant_facts",
    "applicable_regime",
    "applied_rules",
    "calculation_detail",
    "conclusions",
    "evidence_index",
  ]);

  if (!technicalSections.length) {
    return (
      <InlineAlert tone="warning">
        El backend no envio secciones tecnicas estructuradas para este informe.
      </InlineAlert>
    );
  }

  return (
    <section className="grid gap-5">
      {technicalSections.map((section) => (
        <ReportSectionRenderer
          key={section.id}
          section={section}
          onOpenEvidence={onOpenEvidence}
        />
      ))}
    </section>
  );
}

function CalculationReportView({
  sections,
  onOpenEvidence,
}: {
  sections: ReportSection[];
  onOpenEvidence: (refs: EvidenceRef[]) => void;
}) {
  const summary = findSection(sections, ["calculation_summary"]);
  const detail = findSection(sections, ["calculation_detail"]);

  return (
    <section className="grid gap-5">
      <CalculationSummaryCards data={summary?.contentJson || detail?.contentJson} />
      {[summary, detail].filter(isReportSection).map((section) => (
        <ReportSectionRenderer
          key={section.id}
          section={section}
          onOpenEvidence={onOpenEvidence}
        />
      ))}
    </section>
  );
}

function InconsistencyMatrixView({
  sections,
  onOpenEvidence,
}: {
  sections: ReportSection[];
  onOpenEvidence: (refs: EvidenceRef[]) => void;
}) {
  const section = findSection(sections, ["inconsistency_matrix"]);
  const rows = normalizeInconsistencyRows(section?.contentJson);

  return (
    <section className="grid gap-5">
      <InconsistencyMatrixTable rows={rows} />
      {section ? (
        <ReportSectionRenderer section={section} onOpenEvidence={onOpenEvidence} />
      ) : null}
    </section>
  );
}

function FullReportView({
  sections,
  activeSectionKey,
  onOpenEvidence,
}: {
  sections: ReportSection[];
  activeSectionKey?: string;
  onOpenEvidence: (refs: EvidenceRef[]) => void;
}) {
  const visibleSections = activeSectionKey
    ? sections.filter((section) => section.sectionKey === activeSectionKey)
    : sections;

  return (
    <section className="grid gap-5">
      {visibleSections.map((section) => (
        <ReportSectionRenderer
          key={section.id}
          section={section}
          onOpenEvidence={onOpenEvidence}
        />
      ))}
    </section>
  );
}

function DetailState({
  report,
  onRetry,
}: {
  report: ReportDetailResponse;
  onRetry: () => void;
}) {
  const meta = getReportStatusMeta(report.status);

  if (isReportReady(report.status) || report.status === "requires_review") {
    return null;
  }

  if (isReportProcessing(report.status)) {
    return (
      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-900 shadow-panel">
        <h2 className="font-heading text-lg font-semibold">{meta.label}</h2>
        <p className="mt-2 text-sm leading-6">{meta.message}</p>
      </section>
    );
  }

  if (report.status === "blocked") {
    return (
      <section className="rounded-2xl border border-labora-deep/20 bg-white p-5 shadow-panel">
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">Informe bloqueado</h2>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          El contenido final no se muestra hasta que el pago y el analisis completo esten listos.
        </p>
      </section>
    );
  }

  if (report.status === "error" || report.status === "failed") {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-lg font-semibold">{meta.label}</h2>
              <p className="mt-1 text-sm leading-6">{meta.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  return null;
}

export function ReportDetailPage({
  caseId,
  reportId,
  startExportOpen = false,
}: {
  caseId: string;
  reportId: string;
  startExportOpen?: boolean;
}) {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const [activeView, setActiveView] = useState<DetailView>(
    isDetailView(requestedView) ? requestedView : "full",
  );
  const [activeSectionKey, setActiveSectionKey] = useState<string | undefined>();
  const [drawerRefs, setDrawerRefs] = useState<EvidenceRef[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(startExportOpen);
  const [initialExportFormat, setInitialExportFormat] = useState<ExportFormat>("pdf");
  const reportResource = useReport(reportId);
  const caseDetail = useCaseDetail(caseId);
  const downloadMutation = useDownloadExport();
  const report = reportResource.data;

  useEffect(() => {
    if (!report?.sections.length || activeSectionKey) {
      return;
    }

    setActiveSectionKey(report.sections[0].sectionKey);
  }, [activeSectionKey, report?.sections]);

  const tocItems = useMemo(
    () =>
      report?.sections.map((section) => ({
        sectionKey: section.sectionKey,
        title: section.title,
      })) || [],
    [report?.sections],
  );

  function handleSectionSelect(sectionKey: string) {
    setActiveSectionKey(sectionKey);
    window.requestAnimationFrame(() => {
      document.getElementById(sectionKey)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handleOpenEvidence(refs: EvidenceRef[]) {
    setDrawerRefs(refs);
    setDrawerOpen(true);
  }

  function handleOpenExport(format: ExportFormat) {
    setInitialExportFormat(format);
    setExportOpen(true);
  }

  async function handleDownload(exportFileId: string) {
    const response = await downloadMutation.download(exportFileId);

    if (response.downloadUrl) {
      window.location.assign(response.downloadUrl);
    }
  }

  if (reportResource.isLoading || caseDetail.isLoading) {
    return (
      <section className="grid gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  if (reportResource.error && !report) {
    return (
      <section className="space-y-5">
        <Link
          href={`/app/cases/${caseId}/reports`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a informes
        </Link>
        <InlineAlert tone="error">{reportResource.error}</InlineAlert>
      </section>
    );
  }

  if (!report) {
    return <InlineAlert tone="warning">No encontramos este informe.</InlineAlert>;
  }

  const generatedAt =
    report.traceability?.generatedAt || report.currentVersion.createdAt;
  const canShowContent =
    isReportReady(report.status) || report.status === "requires_review";

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

      <div className="flex flex-col gap-4 rounded-2xl border border-labora-ui bg-white p-5 shadow-panel lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href={`/app/cases/${caseId}/reports`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Informes del expediente
          </Link>
          <h1 className="mt-3 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
            {report.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            {formatReportType(report.reportType)} - Version v{report.currentVersion.versionNumber} - {formatDateTime(generatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportStatusBadge status={report.status} />
          <Link
            href={`/app/cases/${caseId}/reports/${report.id}/versions`}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Versiones
          </Link>
        </div>
      </div>

      <DetailState report={report} onRetry={reportResource.refetch} />

      {canShowContent ? (
        <ProfessionalReviewCTA
          caseId={caseId}
          targetType="report"
          targetId={report.id}
          recommended={report.requiresHumanReview || report.status === "requires_review"}
          requiresReview={report.status === "requires_review"}
          riskLevel={report.reviewReason ? "alto" : undefined}
        />
      ) : null}

      {downloadMutation.error ? (
        <InlineAlert tone="error">{downloadMutation.error}</InlineAlert>
      ) : null}

      {canShowContent ? (
        <>
          <ReportViewTabs activeView={activeView} onChange={setActiveView} />

          {activeView === "full" ? (
            <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
              <aside className="hidden xl:block">
                <div className="sticky top-5 rounded-2xl border border-labora-ui bg-white p-3 shadow-panel">
                  <ReportTableOfContents
                    items={tocItems}
                    activeSectionKey={activeSectionKey}
                    onSelect={handleSectionSelect}
                  />
                </div>
              </aside>

              <div className="space-y-5">
                <label className="block xl:hidden">
                  <span className="text-sm font-semibold text-labora-charcoal">
                    Seccion
                  </span>
                  <select
                    value={activeSectionKey || ""}
                    onChange={(event) => handleSectionSelect(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal"
                  >
                    {tocItems.map((item) => (
                      <option key={item.sectionKey} value={item.sectionKey}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>

                <FullReportView
                  sections={report.sections}
                  activeSectionKey={activeSectionKey}
                  onOpenEvidence={handleOpenEvidence}
                />
              </div>

              <aside className="space-y-5">
                <AiConfidenceWarning
                  confidence={report.aiConfidence}
                  requiresHumanReview={report.requiresHumanReview || report.status === "requires_review"}
                  reviewReason={report.reviewReason}
                />
                <TraceabilitySeal
                  versionNumber={report.currentVersion.versionNumber}
                  generatedAt={generatedAt}
                  contentHash={report.traceability?.contentHash}
                  sourceHash={report.traceability?.sourceHash}
                  generatedBy="Labora"
                />
                <ExportActions
                  reportId={report.id}
                  currentVersionId={report.currentVersion.id}
                  availableExports={report.availableExports}
                  onExport={handleOpenExport}
                  onDownload={handleDownload}
                  isDownloading={downloadMutation.isLoading}
                />
              </aside>
            </div>
          ) : null}

          {activeView === "executive" ? (
            <ExecutiveReportView report={report} onOpenEvidence={handleOpenEvidence} />
          ) : null}

          {activeView === "technical" ? (
            <TechnicalReportView sections={report.sections} onOpenEvidence={handleOpenEvidence} />
          ) : null}

          {activeView === "calculation" ? (
            <CalculationReportView sections={report.sections} onOpenEvidence={handleOpenEvidence} />
          ) : null}

          {activeView === "matrix" ? (
            <InconsistencyMatrixView sections={report.sections} onOpenEvidence={handleOpenEvidence} />
          ) : null}

          <button
            type="button"
            onClick={() => handleOpenExport("pdf")}
            className="fixed inset-x-4 bottom-4 z-20 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white shadow-panel md:hidden"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar
          </button>
        </>
      ) : null}

      <EvidenceReferencesDrawer
        open={drawerOpen}
        refs={drawerRefs}
        onClose={() => setDrawerOpen(false)}
      />

      <ExportReportModal
        open={exportOpen}
        reportId={report.id}
        currentVersionId={report.currentVersion.id}
        versionNumber={report.currentVersion.versionNumber}
        initialFormat={initialExportFormat}
        onClose={() => setExportOpen(false)}
        onExported={() => reportResource.refresh()}
      />
    </section>
  );
}

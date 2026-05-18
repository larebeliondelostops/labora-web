"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, RefreshCcw, RotateCcw, XCircle } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AiConfidenceWarning } from "@/src/modules/reports/components/AiConfidenceWarning";
import { EvidenceReferencesDrawer } from "@/src/modules/reports/components/EvidenceReferencesDrawer";
import { ReportSectionRenderer } from "@/src/modules/reports/components/ReportSectionRenderer";
import { ReportStatusBadge } from "@/src/modules/reports/components/ReportStatusBadge";
import { TraceabilitySeal } from "@/src/modules/reports/components/TraceabilitySeal";
import { useAdminReportReview, useReport } from "@/src/modules/reports/hooks/useReports";
import type { EvidenceRef } from "@/src/modules/reports/api/reports.types";
import { formatDateTime, formatReportType } from "@/src/modules/reports/utils/reportFormatters";
import { useState } from "react";

export function AdminReportReviewPage({ reportId }: { reportId: string }) {
  const reportResource = useReport(reportId);
  const review = useAdminReportReview(reportId);
  const [drawerRefs, setDrawerRefs] = useState<EvidenceRef[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const report = reportResource.data;

  if (reportResource.isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <AdminSidebar />
          <div className="grid gap-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </main>
    );
  }

  if (reportResource.error && !report) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <AdminSidebar />
          <InlineAlert tone="error">{reportResource.error}</InlineAlert>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <AdminSidebar />
          <InlineAlert tone="warning">No encontramos este informe.</InlineAlert>
        </div>
      </main>
    );
  }

  const generatedAt = report.traceability?.generatedAt || report.currentVersion.createdAt;
  const lowConfidenceSections = report.sections.filter(
    (section) => typeof section.confidence === "number" && section.confidence < 0.75,
  );
  const unsupportedConclusions = report.sections.filter(
    (section) => section.sectionKey === "conclusions" && !section.sourceRefs?.length,
  );
  const canReview = report.status === "requires_review" || report.requiresHumanReview;

  function openEvidence(refs: EvidenceRef[]) {
    setDrawerRefs(refs);
    setDrawerOpen(true);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <section className="space-y-5">
          <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                  Revision interna
                </p>
                <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
                  {report.title}
                </h1>
                <p className="mt-2 text-sm leading-6 text-labora-gray">
                  {formatReportType(report.reportType)} - v{report.currentVersion.versionNumber} - {formatDateTime(generatedAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ReportStatusBadge status={report.status} />
                <Link
                  href={`/app/cases/${report.caseId}/reports/${report.id}`}
                  className="inline-flex min-h-10 items-center rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                >
                  Ver como usuario
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <AiConfidenceWarning
                confidence={report.aiConfidence}
                requiresHumanReview={report.requiresHumanReview || report.status === "requires_review"}
                reviewReason={report.reviewReason}
              />

              {unsupportedConclusions.length ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-panel">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                    <div>
                      <h2 className="font-heading text-lg font-semibold">
                        Conclusiones sin soporte
                      </h2>
                      <p className="mt-1 text-sm leading-6">
                        Hay conclusiones que no tienen evidencia asociada. Revisalas antes de aprobar.
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              {lowConfidenceSections.length ? (
                <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-panel">
                  <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                    Alertas de baja confianza
                  </h2>
                  <ul className="mt-3 grid gap-2 text-sm text-labora-gray">
                    {lowConfidenceSections.map((section) => (
                      <li key={section.id} className="rounded-lg border border-labora-ui bg-labora-ivory p-3">
                        {section.title} - confianza {section.confidence}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="grid gap-5">
                {report.sections.map((section) => (
                  <ReportSectionRenderer
                    key={section.id}
                    section={section}
                    onOpenEvidence={openEvidence}
                  />
                ))}
              </section>
            </div>

            <aside className="space-y-5">
              <TraceabilitySeal
                versionNumber={report.currentVersion.versionNumber}
                generatedAt={generatedAt}
                contentHash={report.traceability?.contentHash}
                sourceHash={report.traceability?.sourceHash}
                generatedBy="Labora"
              />

              <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
                <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                  Decision interna
                </h2>
                <p className="mt-2 text-sm leading-6 text-labora-gray">
                  Las acciones quedan sujetas a permisos del backend para roles admin o revisor.
                </p>
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-labora-charcoal">
                    Comentarios internos
                  </span>
                  <textarea
                    value={review.comment}
                    onChange={(event) => review.setComment(event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-lg border border-labora-ui px-3 py-2 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
                    placeholder="Resume observaciones, ajustes o motivo de la decision."
                  />
                </label>

                {review.error ? (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {review.error}
                  </div>
                ) : null}

                {review.lastDecision ? (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    {review.lastDecision.message || `Estado actualizado a ${review.lastDecision.status}.`}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={review.approve}
                    disabled={!canReview || review.isLoading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={review.reject}
                    disabled={!canReview || review.isLoading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-labora-ui disabled:bg-labora-ui disabled:text-labora-gray"
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={review.regenerate}
                    disabled={review.isLoading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory disabled:cursor-not-allowed disabled:text-labora-gray"
                  >
                    {review.isLoading ? (
                      <RefreshCcw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    )}
                    Solicitar regeneracion
                  </button>
                </div>

                {!canReview ? (
                  <p className="mt-3 text-xs leading-5 text-labora-gray">
                    Este informe no esta marcado para revision, por eso aprobar y rechazar estan inactivos.
                  </p>
                ) : null}
              </section>
            </aside>
          </div>
        </section>
      </div>

      <EvidenceReferencesDrawer
        open={drawerOpen}
        refs={drawerRefs}
        onClose={() => setDrawerOpen(false)}
      />
    </main>
  );
}

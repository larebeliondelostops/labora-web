"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, FileText, RefreshCcw } from "lucide-react";

import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import {
  BlockingReasonsAlert,
  ConfirmExtractionCTA,
  ConfirmExtractionModal,
  ConfirmationChecklist,
  ContributionWeeksSummary,
  ContributionWeeksTable,
  CorrectionsTimeline,
  EditEntityDrawer,
  EditFieldModal,
  EditableFieldTarget,
  EmptyState,
  ErrorState,
  EmployersTable,
  ExtractionIssuesList,
  ExtractionLayout,
  ExtractionProgressCard,
  ExtractionStatsGrid,
  ExtractionStatusHeader,
  IgnoreEntityModal,
  LaborTimeline,
  LowConfidenceWarning,
  MobileBottomCTA,
  NextActionCard,
  PdfSideBySideViewer,
  PendingFieldTarget,
  PendingFieldsSummary,
  RequestAdditionalInfoCard,
  SalaryBaseTable,
  SalaryOutlierAlert,
  SalaryTrendPreview,
  UserConfirmationStatement,
  WeeksByYearChart,
  extractionTabs,
} from "@/src/modules/extraction/components/extraction-components";
import type {
  DocumentReference,
  ExtractionIssue,
  ExtractionResponse,
  ExtractionTab,
} from "@/src/modules/extraction/api/extraction.types";
import {
  useConfirmExtraction,
  useCreateExtractionEmployer,
  useCreateExtractionLaborPeriod,
  useExtraction,
  useExtractionCorrections,
  useExtractionIssues,
  useIgnoreExtractionEntity,
  useUpdateExtractionField,
  useUpdateExtractionIssue,
} from "@/src/modules/extraction/hooks/useExtraction";

const defaultStatement =
  "Confirmo que revise los datos extraidos de mis documentos. Entiendo que los campos marcados como pendientes pueden afectar el analisis posterior.";

function normalizeTab(value: string | null): ExtractionTab {
  return extractionTabs.some((tab) => tab.id === value)
    ? (value as ExtractionTab)
    : "summary";
}

function trackExtractionEvent(
  eventName: string,
  payload: {
    caseId: string;
    tab?: string;
    entityType?: string;
    fieldKey?: string;
    status?: string;
  },
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("labora:analytics", {
      detail: {
        event: eventName,
        payload,
      },
    }),
  );
}

function PageHeaderFallback({ caseId }: { caseId: string }) {
  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
        Expediente digital
      </p>
      <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
        Expediente {caseId}
      </h1>
      <p className="mt-1 text-sm text-labora-gray">Extraccion y validacion</p>
    </header>
  );
}

function countPendingFields(extraction: ExtractionResponse) {
  return [
    ...extraction.employers,
    ...extraction.laborPeriods,
    ...extraction.contributionWeeks,
    ...extraction.salaryBases,
    ...extraction.gaps,
  ].filter((item) => item.status === "pending_user_confirmation").length;
}

function FeedbackBanner({ message, tone }: { message?: string | null; tone: "success" | "error" }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={
        tone === "success"
          ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
          : "rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
      }
    >
      <div className="flex gap-3">
        {tone === "success" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <p>{message}</p>
      </div>
    </div>
  );
}

export function ExtractionPage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = normalizeTab(searchParams.get("tab"));
  const caseDetail = useCaseDetail(caseId);
  const extraction = useExtraction(caseId);
  const corrections = useExtractionCorrections(caseId, activeTab === "corrections");
  const issueList = useExtractionIssues(caseId, activeTab === "gaps");
  const updateField = useUpdateExtractionField(caseId);
  const createEmployer = useCreateExtractionEmployer(caseId);
  const createPeriod = useCreateExtractionLaborPeriod(caseId);
  const ignoreEntity = useIgnoreExtractionEntity(caseId);
  const updateIssue = useUpdateExtractionIssue(caseId);
  const confirm = useConfirmExtraction(caseId);

  const [editTarget, setEditTarget] = useState<EditableFieldTarget | null>(null);
  const [entityDrawer, setEntityDrawer] = useState<"employer" | "period" | null>(null);
  const [ignoreTarget, setIgnoreTarget] = useState<{ entityType: string; entityId: string } | null>(null);
  const [selectedSource, setSelectedSource] = useState<DocumentReference | null>(null);
  const [statement, setStatement] = useState(defaultStatement);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmWithPending, setConfirmWithPending] = useState(false);

  const issues = useMemo(() => {
    if (activeTab === "gaps" && issueList.data.length) {
      return issueList.data;
    }

    return extraction.data?.issues || [];
  }, [activeTab, extraction.data?.issues, issueList.data]);

  const pendingCount = extraction.data ? countPendingFields(extraction.data) : 0;
  const hasPending = pendingCount > 0;
  const feedbackMessage =
    updateField.success ||
    createEmployer.success ||
    createPeriod.success ||
    ignoreEntity.success ||
    updateIssue.success ||
    confirm.success;
  const feedbackError =
    updateField.error ||
    createEmployer.error ||
    createPeriod.error ||
    ignoreEntity.error ||
    updateIssue.error ||
    confirm.error;

  useEffect(() => {
    trackExtractionEvent("extraction_screen_viewed", { caseId, tab: activeTab });
    trackExtractionEvent("extraction_tab_changed", { caseId, tab: activeTab });
  }, [activeTab, caseId]);

  function openEdit(target: EditableFieldTarget) {
    setEditTarget(target);
    trackExtractionEvent("extraction_field_edit_clicked", {
      caseId,
      entityType: target.entityType,
      fieldKey: target.fieldKey,
    });
  }

  async function refreshAfterMutation(updated?: ExtractionResponse | void) {
    if (updated) {
      extraction.setData(updated);
    } else {
      await extraction.refetch();
    }

    if (activeTab === "corrections") {
      corrections.refresh();
    }

    if (activeTab === "gaps") {
      issueList.refresh();
    }
  }

  async function saveField(value: unknown, reason?: string) {
    if (!editTarget) {
      return;
    }

    const updated = await updateField.mutate({
      updates: [
        {
          fieldId: editTarget.source?.fieldId,
          entityType: editTarget.entityType,
          entityId: editTarget.entityId,
          fieldKey: editTarget.fieldKey,
          newValue: value,
          reason,
        },
      ],
    });

    trackExtractionEvent("extraction_field_updated", {
      caseId,
      entityType: editTarget.entityType,
      fieldKey: editTarget.fieldKey,
    });
    setEditTarget(null);
    await refreshAfterMutation(updated);
  }

  async function markPending(target: PendingFieldTarget) {
    const updated = await updateField.mutate({
      updates: [
        {
          fieldId: target.source?.fieldId,
          entityType: target.entityType,
          entityId: target.entityId,
          fieldKey: "status",
          newValue: "pending_user_confirmation",
          reason: "Marcado como pendiente por el usuario.",
        },
      ],
    });

    trackExtractionEvent("extraction_field_updated", {
      caseId,
      entityType: target.entityType,
      fieldKey: target.fieldKey,
      status: "pending_user_confirmation",
    });
    await refreshAfterMutation(updated);
  }

  async function createEmployerAndRefresh(payload: Parameters<typeof createEmployer.mutate>[0]) {
    await createEmployer.mutate(payload);
    setEntityDrawer(null);
    await extraction.refetch();
  }

  async function createPeriodAndRefresh(payload: Parameters<typeof createPeriod.mutate>[0]) {
    await createPeriod.mutate(payload);
    setEntityDrawer(null);
    await extraction.refetch();
  }

  async function confirmIgnore(reason: string) {
    if (!ignoreTarget) {
      return;
    }

    await ignoreEntity.mutate({
      ...ignoreTarget,
      payload: { reason },
    });
    trackExtractionEvent("extraction_entity_ignored", {
      caseId,
      entityType: ignoreTarget.entityType,
    });
    setIgnoreTarget(null);
    await extraction.refetch();
  }

  async function resolveIssue(issue: ExtractionIssue) {
    await updateIssue.mutate({
      issueId: issue.id,
      status: "resolved",
      reason: "Resuelto desde la validacion de datos.",
    });
    trackExtractionEvent("extraction_issue_viewed", {
      caseId,
      entityType: issue.entityType,
      status: "resolved",
    });
    await extraction.refetch();
    issueList.refresh();
  }

  async function dismissIssue(issue: ExtractionIssue) {
    await updateIssue.mutate({
      issueId: issue.id,
      status: "dismissed",
      reason: "Descartado desde la validacion de datos.",
    });
    await extraction.refetch();
    issueList.refresh();
  }

  function viewSource(source: DocumentReference) {
    setSelectedSource(source);
    if (activeTab !== "pdf-data") {
      router.push(`/app/cases/${caseId}/extraction?tab=pdf-data`);
    }
  }

  function startConfirmation(withPending: boolean) {
    setConfirmWithPending(withPending);
    setConfirmModalOpen(true);
    trackExtractionEvent("extraction_confirmation_started", {
      caseId,
      tab: "confirm",
      status: withPending ? "with_pending" : "clean",
    });
  }

  async function submitConfirmation() {
    try {
      const result = await confirm.mutate({
        acceptLowConfidenceFields: Boolean(extraction.data?.lowConfidenceCount),
        markPendingFields: confirmWithPending,
        userStatement: statement,
      });

      trackExtractionEvent("extraction_confirmed", { caseId, status: result.status });
      setConfirmModalOpen(false);

      if (result.nextStep === "preliminary_analysis" || result.nextStep === "preanalysis") {
        router.push(`/app/cases/${caseId}/preanalysis`);
        return;
      }

      await extraction.refetch();
    } catch {
      trackExtractionEvent("extraction_confirm_failed", { caseId });
    }
  }

  if (caseDetail.isLoading || extraction.isLoading) {
    return <LoadingShell />;
  }

  const isEmptyExtraction =
    Boolean(extraction.error?.toLowerCase().includes("aun no hay")) ||
    Boolean(extraction.error?.toLowerCase().includes("not found"));

  if (extraction.error && !extraction.data && !isEmptyExtraction) {
    return (
      <section className="space-y-5">
        {!caseDetail.isLoading && caseDetail.data ? (
          <CaseHeader
            caseNumber={caseDetail.data.caseNumber}
            status={caseDetail.data.status}
            holderFullName={getHolderFullName(caseDetail.data.holder)}
            updatedAt={caseDetail.data.updatedAt}
          />
        ) : (
          <PageHeaderFallback caseId={caseId} />
        )}
        <ErrorState
          message={extraction.error}
          onRetry={extraction.refetch}
          documentsHref={`/app/cases/${caseId}/documents`}
        />
      </section>
    );
  }

  if (!extraction.data || isEmptyExtraction) {
    return (
      <section className="space-y-5">
        {!caseDetail.isLoading && caseDetail.data ? (
          <CaseHeader
            caseNumber={caseDetail.data.caseNumber}
            status={caseDetail.data.status}
            holderFullName={getHolderFullName(caseDetail.data.holder)}
            updatedAt={caseDetail.data.updatedAt}
          />
        ) : (
          <PageHeaderFallback caseId={caseId} />
        )}
        <EmptyState
          primaryAction={
            <button
              type="button"
              onClick={extraction.refetch}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Actualizar estado
            </button>
          }
          secondaryAction={
            <Link
              href={`/app/cases/${caseId}/documents`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Volver a documentos
            </Link>
          }
        />
      </section>
    );
  }

  const data = extraction.data;

  return (
    <section className="space-y-5 pb-24 md:pb-0">
      {!caseDetail.isLoading && caseDetail.data ? (
        <CaseHeader
          caseNumber={caseDetail.data.caseNumber}
          status={caseDetail.data.status}
          holderFullName={getHolderFullName(caseDetail.data.holder)}
          updatedAt={caseDetail.data.updatedAt}
        />
      ) : (
        <PageHeaderFallback caseId={caseId} />
      )}

      <ExtractionStatusHeader
        extraction={data}
        isRefreshing={extraction.isRefreshing}
        onRefresh={extraction.refresh}
      />

      <FeedbackBanner message={feedbackMessage} tone="success" />
      <FeedbackBanner message={feedbackError} tone="error" />

      <ExtractionLayout caseId={caseId} activeTab={activeTab} extraction={data}>
        {activeTab === "summary" ? (
          <SummaryTab extraction={data} caseId={caseId} />
        ) : null}

        {activeTab === "pdf-data" ? (
          <PdfSideBySideViewer
            extraction={data}
            selectedSource={selectedSource}
            onSelectSource={setSelectedSource}
            onEdit={openEdit}
            onMarkPending={markPending}
          />
        ) : null}

        {activeTab === "timeline" ? (
          <LaborTimeline
            periods={data.laborPeriods}
            gaps={data.gaps}
            onEdit={openEdit}
            onIgnore={(entityType, entityId) => setIgnoreTarget({ entityType, entityId })}
            onMarkPending={markPending}
            onAdd={() => setEntityDrawer("period")}
            onViewSource={viewSource}
          />
        ) : null}

        {activeTab === "employers" ? (
          <EmployersTab
            extraction={data}
            onEdit={openEdit}
            onIgnore={(entityType, entityId) => setIgnoreTarget({ entityType, entityId })}
            onAdd={() => setEntityDrawer("employer")}
          />
        ) : null}

        {activeTab === "weeks" ? (
          <div className="space-y-5">
            <ContributionWeeksSummary weeks={data.contributionWeeks} />
            <WeeksByYearChart weeks={data.contributionWeeks} />
            <ContributionWeeksTable
              weeks={data.contributionWeeks}
              onEdit={openEdit}
              onMarkPending={markPending}
              onViewSource={viewSource}
            />
          </div>
        ) : null}

        {activeTab === "salaries" ? (
          <div className="space-y-5">
            <SalaryOutlierAlert salaryBases={data.salaryBases} />
            <SalaryTrendPreview salaryBases={data.salaryBases} />
            <SalaryBaseTable
              salaryBases={data.salaryBases}
              onEdit={openEdit}
              onMarkPending={markPending}
              onViewSource={viewSource}
            />
          </div>
        ) : null}

        {activeTab === "gaps" ? (
          <div className="space-y-5">
            {issueList.error ? <FeedbackBanner message={issueList.error} tone="error" /> : null}
            <ExtractionIssuesList
              issues={issues}
              gaps={data.gaps}
              onResolve={resolveIssue}
              onDismiss={dismissIssue}
              onViewSource={viewSource}
            />
            <RequestAdditionalInfoCard caseId={caseId} />
          </div>
        ) : null}

        {activeTab === "corrections" ? (
          <div className="space-y-5">
            {corrections.isLoading ? <LoadingShell compact /> : null}
            {corrections.error ? <FeedbackBanner message={corrections.error} tone="error" /> : null}
            {!corrections.isLoading ? <CorrectionsTimeline corrections={corrections.data} /> : null}
          </div>
        ) : null}

        {activeTab === "confirm" ? (
          <div className="space-y-5">
            <BlockingReasonsAlert reasons={data.blockingReasons} />
            <ConfirmationChecklist extraction={data} />
            <PendingFieldsSummary extraction={data} />
            <LowConfidenceWarning extraction={data} />
            <UserConfirmationStatement value={statement} onChange={setStatement} />
            <ConfirmExtractionCTA
              canConfirm={data.canConfirm && data.blockingReasons.length === 0}
              hasPending={hasPending || data.lowConfidenceCount > 0}
              isLoading={confirm.isLoading}
              onConfirm={() => startConfirmation(false)}
              onConfirmWithPending={() => startConfirmation(true)}
              onReview={() => router.push(`/app/cases/${caseId}/extraction?tab=pdf-data`)}
            />
          </div>
        ) : null}
      </ExtractionLayout>

      {activeTab !== "confirm" ? (
        <MobileBottomCTA
          label="Ir a confirmacion"
          onClick={() => router.push(`/app/cases/${caseId}/extraction?tab=confirm`)}
        />
      ) : null}

      <EditFieldModal
        open={Boolean(editTarget)}
        target={editTarget}
        isLoading={updateField.isLoading}
        error={updateField.error}
        onClose={() => setEditTarget(null)}
        onSave={saveField}
      />

      <EditEntityDrawer
        open={Boolean(entityDrawer)}
        kind={entityDrawer || "employer"}
        employers={data.employers}
        isLoading={createEmployer.isLoading || createPeriod.isLoading}
        error={createEmployer.error || createPeriod.error}
        onClose={() => setEntityDrawer(null)}
        onCreateEmployer={createEmployerAndRefresh}
        onCreatePeriod={createPeriodAndRefresh}
      />

      <IgnoreEntityModal
        open={Boolean(ignoreTarget)}
        isLoading={ignoreEntity.isLoading}
        error={ignoreEntity.error}
        onClose={() => setIgnoreTarget(null)}
        onConfirm={confirmIgnore}
      />

      <ConfirmExtractionModal
        open={confirmModalOpen}
        isLoading={confirm.isLoading}
        error={confirm.error}
        pendingCount={pendingCount}
        lowConfidenceCount={data.lowConfidenceCount}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={submitConfirmation}
      />
    </section>
  );
}

function LoadingShell({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <div className="h-5 w-56 animate-pulse rounded bg-labora-ui" />
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-labora-ivory" />
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <div className="h-4 w-40 animate-pulse rounded bg-labora-ui" />
        <div className="mt-4 h-7 w-72 max-w-full animate-pulse rounded bg-labora-ui" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="h-4 w-40 animate-pulse rounded bg-labora-ui" />
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="h-16 animate-pulse rounded-xl bg-labora-ivory" />
              <div className="h-16 animate-pulse rounded-xl bg-labora-ivory" />
              <div className="h-16 animate-pulse rounded-xl bg-labora-ivory" />
              <div className="h-16 animate-pulse rounded-xl bg-labora-ivory" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryTab({
  extraction,
  caseId,
}: {
  extraction: ExtractionResponse;
  caseId: string;
}) {
  return (
    <div className="space-y-5">
      {extraction.status === "not_started" ? (
        <EmptyState
          primaryAction={
            <Link
              href={`/app/cases/${caseId}/documents`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
            >
              Ir a documentos
            </Link>
          }
        />
      ) : null}
      {extraction.status === "in_progress" ? (
        <section className="rounded-2xl border border-labora-mint bg-labora-mint/20 p-5 text-labora-deep shadow-panel">
          <div className="flex gap-3">
            <RefreshCcw className="mt-0.5 h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
            <p className="text-sm font-semibold">
              Estamos preparando los datos extraidos...
            </p>
          </div>
        </section>
      ) : null}
      {extraction.status === "requires_review" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-panel">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-semibold">
              Hay datos que necesitan tu revision antes de continuar.
            </p>
          </div>
        </section>
      ) : null}
      <BlockingReasonsAlert reasons={extraction.blockingReasons} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <ExtractionStatsGrid extraction={extraction} />
          <NextActionCard caseId={caseId} canConfirm={extraction.canConfirm} />
        </div>
        <aside className="space-y-5">
          <ExtractionProgressCard extraction={extraction} />
          <LowConfidenceWarning extraction={extraction} />
        </aside>
      </div>
    </div>
  );
}

function EmployersTab({
  extraction,
  onEdit,
  onIgnore,
  onAdd,
}: {
  extraction: ExtractionResponse;
  onEdit: (target: EditableFieldTarget) => void;
  onIgnore: (entityType: string, entityId: string) => void;
  onAdd: () => void;
}) {
  return (
    <EmployersTable
      employers={extraction.employers}
      periods={extraction.laborPeriods}
      onEdit={onEdit}
      onIgnore={onIgnore}
      onAdd={onAdd}
    />
  );
}

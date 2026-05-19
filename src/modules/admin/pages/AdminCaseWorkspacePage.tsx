"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Gavel,
  History,
  Lock,
  NotebookPen,
  RefreshCcw,
  UserPlus,
} from "lucide-react";

import type {
  AdminCaseDetail,
  AdminDocument,
  AiAlert,
  ExtractionItem,
} from "@/src/modules/admin/api/admin.types";
import {
  useAdminAudit,
  useAdminCalculations,
  useAdminCase,
  useAdminDocuments,
  useAdminExtraction,
  useAdminLegalAnalysis,
  useAdminLegalDrafts,
  useAdminReports,
  useAdminUsers,
  useApproveAdminReport,
  useAssignCase,
  useChangeCaseStatus,
  useCorrectExtraction,
  useCreateInternalNote,
  useReviewCalculations,
  useReviewDocument,
  useReviewLegalAnalysis,
  useReviewLegalDraft,
} from "@/src/modules/admin/hooks/useAdmin";
import {
  AiAlertDrawer,
  AiConfidenceBadge,
  AssignCaseModal,
  AuditEventItem,
  CaseTimeline,
  ChangeCaseStatusModal,
  DataSourceBadge,
  DocumentStatusBadge,
  EmptyState,
  ErrorState,
  ExtractionCorrectionDrawer,
  formatDateTime,
  formatPercent,
  InternalNoteDrawer,
  LoadingSkeleton,
  Panel,
  PaymentStatusChip,
  PdfViewer,
  Pill,
  PriorityBadge,
  ReviewDecisionBadge,
  SectionHeader,
  SensitiveDataMask,
  SplitPane,
  StatusChip,
  StickyActionBar,
  VersionBadge,
} from "@/src/modules/admin/components/admin-ui";
import { cn } from "@/lib/utils";

export type AdminCaseSection =
  | "overview"
  | "documents"
  | "extraction"
  | "legal-analysis"
  | "calculations"
  | "reports"
  | "legal-drafts"
  | "audit";

const caseTabs: Array<{ section: AdminCaseSection; label: string; icon: ReactNode }> = [
  { section: "overview", label: "Resumen", icon: <ClipboardCheck className="h-4 w-4" /> },
  { section: "documents", label: "Documentos", icon: <FileCheck2 className="h-4 w-4" /> },
  { section: "extraction", label: "Extraccion", icon: <FileText className="h-4 w-4" /> },
  { section: "legal-analysis", label: "Juridico", icon: <Gavel className="h-4 w-4" /> },
  { section: "calculations", label: "Calculos", icon: <Calculator className="h-4 w-4" /> },
  { section: "reports", label: "Informes", icon: <FileText className="h-4 w-4" /> },
  { section: "legal-drafts", label: "Escritos", icon: <FileText className="h-4 w-4" /> },
  { section: "audit", label: "Auditoria", icon: <History className="h-4 w-4" /> },
];

function ActionButton({
  children,
  onClick,
  tone = "neutral",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "primary" | "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
        tone === "primary"
          ? "bg-labora-green text-white hover:bg-labora-deep"
          : tone === "danger"
            ? "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
            : "border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory",
      )}
    >
      {children}
    </button>
  );
}

function CaseHeader({
  detail,
  onAssign,
  onStatus,
  onNote,
}: {
  detail: AdminCaseDetail;
  onAssign: () => void;
  onStatus: () => void;
  onNote: () => void;
}) {
  const criticalAlert = detail.aiAlerts.find((alert) => alert.severity === "critical" && !alert.resolved);

  return (
    <div className="grid gap-4">
      {criticalAlert ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">{criticalAlert.title}</p>
              <p className="mt-1 text-sm leading-6">{criticalAlert.description}</p>
            </div>
          </div>
        </div>
      ) : null}

      {!detail.payment.fullAnalysisUnlocked ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex gap-3">
            <Lock className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm leading-6">
              Pago no confirmado. El analisis completo, informes completos y escritos no deben marcarse como entregables al usuario.
            </p>
          </div>
        </div>
      ) : null}

      <Panel>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">Expediente</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
              {detail.caseNumber}
            </h1>
            <p className="mt-1 text-lg font-semibold text-labora-deep">{detail.holder.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusChip status={detail.adminStatus} />
              <PriorityBadge priority={detail.priority} />
              <PaymentStatusChip status={detail.payment.status} unlocked={detail.payment.fullAnalysisUnlocked} />
              {detail.analysisSummary?.confidenceScore ? (
                <AiConfidenceBadge
                  score={detail.analysisSummary.confidenceScore}
                  critical={detail.aiAlerts.some((alert) => alert.severity === "critical" && !alert.resolved)}
                />
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={onAssign}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Asignar
            </ActionButton>
            <ActionButton onClick={onStatus}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Cambiar estado
            </ActionButton>
            <ActionButton onClick={onNote}>
              <NotebookPen className="h-4 w-4" aria-hidden="true" />
              Agregar nota
            </ActionButton>
            <ActionButton onClick={onStatus} tone="danger">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Bloquear caso
            </ActionButton>
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-labora-ivory p-3">
            <p className="font-semibold text-labora-gray">Documento</p>
            <SensitiveDataMask value={`${detail.holder.documentType || ""} ${detail.holder.documentNumberMasked || ""}`} />
          </div>
          <div className="rounded-lg bg-labora-ivory p-3">
            <p className="font-semibold text-labora-gray">Asignado a</p>
            <p className="mt-1 text-labora-charcoal">{detail.assignments[0]?.userName || "Sin asignar"}</p>
          </div>
          <div className="rounded-lg bg-labora-ivory p-3">
            <p className="font-semibold text-labora-gray">Creacion</p>
            <p className="mt-1 text-labora-charcoal">{formatDateTime(detail.createdAt)}</p>
          </div>
          <div className="rounded-lg bg-labora-ivory p-3">
            <p className="font-semibold text-labora-gray">Ultima actividad</p>
            <p className="mt-1 text-labora-charcoal">{formatDateTime(detail.lastActivityAt)}</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function CaseTabs({ caseId, section }: { caseId: string; section: AdminCaseSection }) {
  return (
    <div className="overflow-x-auto">
      <nav className="flex min-w-max gap-2 rounded-lg border border-labora-ui bg-white p-2 shadow-panel">
        {caseTabs.map((tab) => (
          <Link
            key={tab.section}
            href={`/admin/cases/${caseId}/${tab.section}`}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
              tab.section === section
                ? "bg-labora-green text-white"
                : "text-labora-gray hover:bg-labora-ivory hover:text-labora-deep",
            )}
          >
            {tab.icon}
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function OverviewSection({
  detail,
  onAlert,
}: {
  detail: AdminCaseDetail;
  onAlert: (alert: AiAlert) => void;
}) {
  return (
    <div className="grid gap-5">
      <Panel>
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Linea de tiempo</h2>
        <div className="mt-4">
          <CaseTimeline currentStage={detail.currentStage} />
        </div>
      </Panel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-3">
            <Panel>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">Titular</h2>
              <div className="mt-3 grid gap-2 text-sm text-labora-gray">
                <p className="font-semibold text-labora-charcoal">{detail.holder.name}</p>
                <p>{detail.holder.email}</p>
                <p>Telefono <SensitiveDataMask value={detail.holder.phoneMasked} /></p>
              </div>
            </Panel>
            <Panel>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">Documentos</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Pill tone="blue">{detail.documentsSummary.total} total</Pill>
                <Pill tone="green">{detail.documentsSummary.valid} validos</Pill>
                <Pill tone="amber">{detail.documentsSummary.warnings} alertas</Pill>
                <Pill tone="red">{detail.documentsSummary.invalid} invalidos</Pill>
              </div>
            </Panel>
            <Panel>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">Analisis</h2>
              <p className="mt-3 text-sm font-semibold text-labora-deep">{detail.analysisSummary?.status}</p>
              <p className="mt-2 text-sm leading-6 text-labora-gray">{detail.analysisSummary?.mainFinding}</p>
            </Panel>
          </div>

          <Panel>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Proximas acciones</h2>
            <div className="mt-4 grid gap-3">
              {detail.nextActions.map((action) => (
                <div key={action} className="flex gap-3 rounded-lg border border-labora-ui p-3 text-sm text-labora-charcoal">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
                  {action}
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Notas internas</h2>
            <div className="mt-4 grid gap-3">
              {detail.internalNotes.map((note) => (
                <article key={note.id} className="rounded-lg border border-labora-ui bg-labora-ivory p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReviewDecisionBadge decision={note.noteType} />
                    <Pill tone={note.visibility === "internal" ? "red" : "amber"}>{note.visibility === "internal" ? "Interna - no visible al usuario" : note.visibility}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-labora-charcoal">{note.body}</p>
                  <p className="mt-3 text-xs font-semibold text-labora-gray">
                    {note.author.name} - {formatDateTime(note.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="grid gap-5">
          <Panel>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Asignaciones</h2>
            <div className="mt-4 grid gap-3">
              {detail.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-lg border border-labora-ui p-3">
                  <p className="font-semibold text-labora-charcoal">{assignment.userName}</p>
                  <p className="mt-1 text-sm text-labora-gray">{assignment.role} - {assignment.type}</p>
                  <p className="mt-2 text-xs font-semibold text-labora-gray">{formatDateTime(assignment.assignedAt)}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Alertas IA</h2>
            <div className="mt-4 grid gap-3">
              {detail.aiAlerts.map((alert) => (
                <button
                  type="button"
                  key={alert.id}
                  onClick={() => onAlert(alert)}
                  className="rounded-lg border border-labora-ui p-3 text-left transition hover:bg-labora-ivory"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-labora-charcoal">{alert.title}</p>
                    <AiConfidenceBadge score={alert.confidenceScore} critical={alert.severity === "critical"} />
                  </div>
                  <p className="mt-2 text-xs text-labora-gray">{alert.source}</p>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Auditoria reciente</h2>
            <div className="mt-4 grid gap-3">
              {detail.auditPreview.map((event) => (
                <AuditEventItem key={event.id} event={event} />
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function DocumentReviewForm({
  caseId,
  document,
}: {
  caseId: string;
  document: AdminDocument;
}) {
  const review = useReviewDocument(caseId, document.id);
  const [decision, setDecision] = useState("valid");
  const [observations, setObservations] = useState("");
  const [requiresReload, setRequiresReload] = useState(false);
  const [requiresAdditionalSupport, setRequiresAdditionalSupport] = useState(false);
  const [requestedDocuments, setRequestedDocuments] = useState("");
  const [blocksCase, setBlocksCase] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidation(null);

    if ((decision !== "valid" || requiresReload || requiresAdditionalSupport || blocksCase) && !observations.trim()) {
      setValidation("Las decisiones con observaciones, recarga, soportes o bloqueo exigen motivo.");
      return;
    }

    await review.run({
      decision: decision as "valid" | "valid_with_observations" | "reload" | "additional_support",
      observations,
      requiresReload,
      requiresAdditionalSupport,
      requestedDocuments,
      blocksCase,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Decision
        <select value={decision} onChange={(event) => setDecision(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm">
          <option value="valid">Marcar valido</option>
          <option value="valid_with_observations">Valido con observaciones</option>
          <option value="reload">Solicitar recarga</option>
          <option value="additional_support">Solicitar documentos adicionales</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Observaciones
        <textarea value={observations} onChange={(event) => setObservations(event.target.value)} rows={5} className="rounded-lg border border-labora-ui px-3 py-2 text-sm" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Documentos solicitados
        <input value={requestedDocuments} onChange={(event) => setRequestedDocuments(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm" />
      </label>
      <div className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        {[
          ["Requiere recarga", requiresReload, setRequiresReload],
          ["Requiere soportes adicionales", requiresAdditionalSupport, setRequiresAdditionalSupport],
          ["Bloquea el caso", blocksCase, setBlocksCase],
        ].map(([label, checked, setter]) => (
          <label key={String(label)} className="flex items-center gap-2 rounded-lg border border-labora-ui p-3">
            <input
              type="checkbox"
              checked={Boolean(checked)}
              onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)}
              className="accent-labora-green"
            />
            {String(label)}
          </label>
        ))}
      </div>
      {validation ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{validation}</div> : null}
      {review.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{review.error}</div> : null}
      {review.lastResult ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{review.lastResult.message}</div> : null}
      <button type="submit" disabled={review.isLoading} className="min-h-11 rounded-lg bg-labora-green px-4 text-sm font-semibold text-white hover:bg-labora-deep disabled:bg-labora-ui disabled:text-labora-gray">
        {review.isLoading ? "Guardando..." : "Guardar decision"}
      </button>
    </form>
  );
}

function DocumentsSection({ caseId }: { caseId: string }) {
  const documents = useAdminDocuments(caseId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = documents.data?.find((document) => document.id === (selectedId || documents.data?.[0]?.id));

  if (documents.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (documents.error || !documents.data) {
    return <ErrorState message={documents.error || "No encontramos documentos."} onRetry={documents.refetch} />;
  }

  if (!documents.data.length) {
    return <EmptyState title="No hay documentos cargados" body="El expediente aun no tiene soportes." />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
      <Panel className="p-4">
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">Documentos</h2>
        <div className="mt-4 grid gap-3">
          {documents.data.map((document) => (
            <button
              type="button"
              key={document.id}
              onClick={() => setSelectedId(document.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition",
                selected?.id === document.id ? "border-labora-green bg-emerald-50" : "border-labora-ui bg-white hover:bg-labora-ivory",
              )}
            >
              <p className="text-sm font-semibold text-labora-charcoal">{document.name}</p>
              <p className="mt-1 text-xs text-labora-gray">{document.type}</p>
              <div className="mt-3">
                <DocumentStatusBadge status={document.status} />
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <PdfViewer title={selected?.name || "Documento"} sourceUrl={selected?.sourceUrl} />

      <Panel>
        {selected ? (
          <div className="grid gap-5">
            <div>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">OCR y metadatos</h2>
              <div className="mt-3 grid gap-2 text-sm text-labora-gray">
                <p>Paginas: {selected.pages || "Sin dato"}</p>
                <p>Calidad: {formatPercent(selected.qualityScore)}</p>
                <p>OCR: {formatPercent(selected.ocrConfidence)}</p>
                <p>Cargado: {formatDateTime(selected.uploadedAt)}</p>
              </div>
              <div className="mt-4 rounded-lg border border-labora-ui bg-labora-ivory p-3 text-sm leading-6 text-labora-charcoal">
                {selected.ocrText || "OCR pendiente."}
              </div>
              {selected.observations?.length ? (
                <div className="mt-3 grid gap-2">
                  {selected.observations.map((observation) => (
                    <Pill key={observation} tone="amber">{observation}</Pill>
                  ))}
                </div>
              ) : null}
            </div>
            <DocumentReviewForm caseId={caseId} document={selected} />
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function ExtractionSection({ caseId }: { caseId: string }) {
  const extraction = useAdminExtraction(caseId);
  const correction = useCorrectExtraction(caseId);
  const [selected, setSelected] = useState<ExtractionItem | null>(null);
  const groups = ["periods", "employers", "weeks", "salaries", "novelties", "gaps", "inconsistencies"];

  if (extraction.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (extraction.error || !extraction.data) {
    return <ErrorState message={extraction.error || "No encontramos extraccion."} onRetry={extraction.refetch} />;
  }

  const extractionData = extraction.data;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_1.2fr]">
      <PdfViewer title="Fuente de extraccion" />
      <div className="grid gap-5">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Resumen OCR</h2>
            <AiConfidenceBadge score={extractionData.confidenceScore} />
          </div>
          <div className="mt-4 grid gap-2">
            {extractionData.issues.map((issue) => (
              <div key={issue} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {issue}
              </div>
            ))}
          </div>
        </Panel>

        {groups.map((group) => {
          const items = extractionData.items.filter((item) => item.group === group);

          if (!items.length) {
            return null;
          }

          return (
            <Panel key={group} className="p-0">
              <div className="border-b border-labora-ui p-4">
                <h2 className="font-heading text-lg font-semibold capitalize text-labora-charcoal">{group}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
                    <tr>
                      <th className="px-4 py-3">Campo</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Fuente</th>
                      <th className="px-4 py-3">Confianza</th>
                      <th className="px-4 py-3">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-labora-ui">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-semibold text-labora-charcoal">{item.field}</td>
                        <td className="px-4 py-3 text-labora-gray">{item.value}</td>
                        <td className="px-4 py-3"><DataSourceBadge source={item.source} /></td>
                        <td className="px-4 py-3"><AiConfidenceBadge score={item.confidence} /></td>
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => setSelected(item)} className="font-semibold text-labora-deep hover:text-labora-green">
                            Corregir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          );
        })}
      </div>
      <ExtractionCorrectionDrawer
        item={selected}
        isLoading={correction.isLoading}
        error={correction.error}
        result={correction.lastResult}
        onClose={() => setSelected(null)}
        onSubmit={correction.run}
      />
    </div>
  );
}

function ReviewForm({
  title,
  blocked,
  blockingReason,
  onSubmit,
  isLoading,
  error,
  result,
  options,
  extra,
}: {
  title: string;
  blocked?: boolean;
  blockingReason?: string;
  onSubmit: (payload: { decision: string; comment: string; flag: boolean }) => Promise<unknown>;
  isLoading: boolean;
  error?: string | null;
  result?: { message: string } | null;
  options: Array<[string, string]>;
  extra?: string;
}) {
  const [decision, setDecision] = useState(options[0]?.[0] || "");
  const [comment, setComment] = useState("");
  const [flag, setFlag] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidation(null);

    if (blocked && decision.includes("approve")) {
      setValidation(blockingReason || "No puedes aprobar hasta resolver bloqueos.");
      return;
    }

    if ((decision.includes("reject") || decision.includes("return") || flag) && !comment.trim()) {
      setValidation("Esta decision exige comentario o motivo.");
      return;
    }

    await onSubmit({ decision, comment, flag });
  }

  return (
    <Panel>
      <h2 className="font-heading text-xl font-semibold text-labora-charcoal">{title}</h2>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Decision
          <select value={decision} onChange={(event) => setDecision(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm">
            {options.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Comentario interno
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={5} className="rounded-lg border border-labora-ui px-3 py-2 text-sm" />
        </label>
        {extra ? (
          <label className="flex items-center gap-2 rounded-lg border border-labora-ui p-3 text-sm font-semibold text-labora-charcoal">
            <input type="checkbox" checked={flag} onChange={(event) => setFlag(event.target.checked)} className="accent-labora-green" />
            {extra}
          </label>
        ) : null}
        {validation ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{validation}</div> : null}
        {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
        {result ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{result.message}</div> : null}
        <button type="submit" disabled={isLoading} className="min-h-11 rounded-lg bg-labora-green px-4 text-sm font-semibold text-white hover:bg-labora-deep disabled:bg-labora-ui disabled:text-labora-gray">
          {isLoading ? "Guardando..." : "Guardar revision"}
        </button>
      </form>
    </Panel>
  );
}

function LegalAnalysisSection({ caseId }: { caseId: string }) {
  const legal = useAdminLegalAnalysis(caseId);
  const review = useReviewLegalAnalysis(caseId);

  if (legal.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (legal.error || !legal.data) {
    return <ErrorState message={legal.error || "No encontramos analisis juridico."} onRetry={legal.refetch} />;
  }

  const hasBlockingAlert = legal.data.alerts.some((alert) => alert.severity === "critical" && !alert.resolved);

  return (
    <SplitPane
      left={
        <div className="grid gap-5">
          {hasBlockingAlert ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Hay alertas criticas sin resolver. La aprobacion queda bloqueada hasta resolver o justificar.
            </div>
          ) : null}
          <Panel>
            <div className="flex flex-wrap items-center gap-2">
              <ReviewDecisionBadge decision={legal.data.classification} />
              <Pill tone="blue">{legal.data.route}</Pill>
              <Pill tone="green">{legal.data.detectedRegime}</Pill>
              <AiConfidenceBadge score={legal.data.confidenceScore} critical={hasBlockingAlert} />
            </div>
            <p className="mt-4 text-sm leading-6 text-labora-charcoal">{legal.data.preliminaryConclusion}</p>
            <div className="mt-4 rounded-lg border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray">
              Generado por IA: {legal.data.aiSummary}
            </div>
          </Panel>

          <div className="grid gap-5 md:grid-cols-2">
            <Panel>
              <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Reglas activadas</h2>
              <div className="mt-4 grid gap-3">
                {legal.data.rules.filter((rule) => rule.status === "triggered").map((rule) => (
                  <article key={rule.id} className="rounded-lg border border-labora-ui p-4">
                    <div className="flex flex-wrap gap-2">
                      <DataSourceBadge source={rule.source === "rule" ? "document" : "ocr"} />
                      {rule.confidence ? <AiConfidenceBadge score={rule.confidence} /> : null}
                    </div>
                    <h3 className="mt-3 font-semibold text-labora-charcoal">{rule.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-labora-gray">{rule.description}</p>
                  </article>
                ))}
              </div>
            </Panel>
            <Panel>
              <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Reglas descartadas</h2>
              <div className="mt-4 grid gap-3">
                {legal.data.rules.filter((rule) => rule.status === "discarded").map((rule) => (
                  <article key={rule.id} className="rounded-lg border border-labora-ui p-4">
                    <h3 className="font-semibold text-labora-charcoal">{rule.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-labora-gray">{rule.description}</p>
                  </article>
                ))}
              </div>
            </Panel>
          </div>

          <Panel>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Fundamentos y fuentes</h2>
            <div className="mt-4 grid gap-2">
              {legal.data.normativeSources.map((source) => (
                <Pill key={source} tone="blue">{source}</Pill>
              ))}
            </div>
            <ul className="mt-4 grid gap-2 text-sm text-labora-gray">
              {legal.data.findings.map((finding) => (
                <li key={finding} className="rounded-lg bg-labora-ivory p-3">{finding}</li>
              ))}
            </ul>
          </Panel>
        </div>
      }
      right={
        <ReviewForm
          title="Decision juridica"
          blocked={hasBlockingAlert}
          blockingReason="Resuelve o justifica las alertas criticas antes de aprobar."
          onSubmit={({ decision, comment, flag }) =>
            review.run({ decision, comment, requiresHumanReview: flag })
          }
          isLoading={review.isLoading}
          error={review.error}
          result={review.lastResult}
          options={[
            ["approve", "Aprobar analisis"],
            ["return", "Devolver para correccion"],
            ["human_review", "Marcar revision humana requerida"],
            ["resolve_alert", "Resolver alerta IA"],
          ]}
          extra="Revision humana requerida"
        />
      }
    />
  );
}

function CalculationsSection({ caseId }: { caseId: string }) {
  const calculations = useAdminCalculations(caseId);
  const review = useReviewCalculations(caseId);

  if (calculations.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (calculations.error || !calculations.data) {
    return <ErrorState message={calculations.error || "No encontramos calculos."} onRetry={calculations.refetch} />;
  }

  return (
    <SplitPane
      left={
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {calculations.data.scenarios.map((scenario) => (
              <Panel key={scenario.id}>
                <Pill tone={scenario.tone}>{scenario.label}</Pill>
                <p className="mt-4 font-heading text-2xl font-semibold text-labora-charcoal">{scenario.value}</p>
                <p className="mt-2 text-sm leading-6 text-labora-gray">{scenario.detail}</p>
              </Panel>
            ))}
          </div>
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Variables usadas</h2>
              <AiConfidenceBadge score={calculations.data.confidenceScore} />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
                  <tr>
                    <th className="px-4 py-3">Variable</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Fuente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-labora-ui">
                  {calculations.data.variables.map((variable) => (
                    <tr key={variable.name}>
                      <td className="px-4 py-3 font-semibold text-labora-charcoal">{variable.name}</td>
                      <td className="px-4 py-3 text-labora-gray">{variable.value}</td>
                      <td className="px-4 py-3 text-labora-gray">{variable.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <div className="grid gap-5 md:grid-cols-2">
            <Panel>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">Periodos incluidos</h2>
              <div className="mt-3 grid gap-2">{calculations.data.includedPeriods.map((item) => <Pill key={item} tone="green">{item}</Pill>)}</div>
            </Panel>
            <Panel>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">Advertencias y supuestos</h2>
              <div className="mt-3 grid gap-2">
                {[...calculations.data.assumptions, ...calculations.data.warnings].map((item) => <Pill key={item} tone="amber">{item}</Pill>)}
              </div>
            </Panel>
          </div>
        </div>
      }
      right={
        <ReviewForm
          title="Decision de calculo"
          onSubmit={({ decision, comment, flag }) =>
            review.run({ decision, comment, blocking: flag })
          }
          isLoading={review.isLoading}
          error={review.error}
          result={review.lastResult}
          options={[
            ["approve", "Aprobar calculo"],
            ["return", "Devolver para correccion"],
            ["block", "Marcar como bloqueante"],
          ]}
          extra="Marcar como bloqueante"
        />
      }
    />
  );
}

function ReportsSection({ caseId, detail }: { caseId: string; detail: AdminCaseDetail }) {
  const reports = useAdminReports(caseId);
  const [selectedReportId, setSelectedReportId] = useState("");
  const selectedReport =
    reports.data?.reports.find((report) => report.id === selectedReportId) ||
    reports.data?.reports[0];
  const approve = useApproveAdminReport(caseId, selectedReport?.id || selectedReportId || "report");
  const [comment, setComment] = useState("");
  const [markVisibleToUser, setMarkVisibleToUser] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  async function handleApprove() {
    setValidation(null);

    if (!selectedReport) {
      setValidation("Selecciona un informe.");
      return;
    }

    if (selectedReport.paymentRequired && !detail.payment.fullAnalysisUnlocked && markVisibleToUser) {
      setValidation("Este informe completo no puede entregarse al usuario hasta confirmar pago o desbloqueo administrativo autorizado.");
      return;
    }

    await approve.run({ comment, markVisibleToUser });
  }

  if (reports.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (reports.error || !reports.data) {
    return <ErrorState message={reports.error || "No encontramos informes."} onRetry={reports.refetch} />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
      <Panel>
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Versiones</h2>
        <div className="mt-4 grid gap-3">
          {reports.data.reports.map((report) => (
            <article key={report.id} className="rounded-lg border border-labora-ui p-4">
              <div className="flex flex-wrap items-center gap-2">
                <VersionBadge version={report.version} />
                <ReviewDecisionBadge decision={report.status} />
              </div>
              <h3 className="mt-3 font-semibold text-labora-charcoal">{report.title}</h3>
              <p className="mt-2 text-sm text-labora-gray">{report.diffSummary || "Sin diferencias registradas."}</p>
              {report.approvedBy ? <p className="mt-2 text-xs text-labora-gray">Aprobado por {report.approvedBy}</p> : null}
            </article>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Vista previa</h2>
        <div className="mt-4 grid gap-4">
          {reports.data.reports.map((report) => (
            <article key={report.id} className="rounded-lg border border-labora-ui bg-labora-ivory p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={report.type === "full" ? "amber" : "blue"}>{report.type}</Pill>
                {report.paymentRequired ? <Pill tone="red">Requiere pago para entrega</Pill> : null}
              </div>
              <h3 className="mt-4 font-heading text-xl font-semibold text-labora-charcoal">{report.title}</h3>
              <p className="mt-3 text-sm leading-6 text-labora-gray">{report.preview}</p>
            </article>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Aprobacion</h2>
        {!detail.payment.fullAnalysisUnlocked ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            Este informe completo no puede entregarse al usuario hasta confirmar pago o desbloqueo administrativo autorizado.
          </div>
        ) : null}
        <label className="mt-4 grid gap-2 text-sm font-semibold text-labora-charcoal">
          Informe
          <select
            value={selectedReport?.id || ""}
            onChange={(event) => setSelectedReportId(event.target.value)}
            className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm"
          >
            {reports.data.reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.title} v{report.version}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 grid gap-2 text-sm font-semibold text-labora-charcoal">
          Comentario interno
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={5} className="rounded-lg border border-labora-ui px-3 py-2 text-sm" />
        </label>
        <label className="mt-4 flex items-center gap-2 rounded-lg border border-labora-ui p-3 text-sm font-semibold text-labora-charcoal">
          <input type="checkbox" checked={markVisibleToUser} onChange={(event) => setMarkVisibleToUser(event.target.checked)} className="accent-labora-green" />
          Marcar visible al usuario
        </label>
        {validation ? <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{validation}</div> : null}
        {approve.error ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{approve.error}</div> : null}
        {approve.lastResult ? <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{approve.lastResult.message}</div> : null}
        <button type="button" onClick={handleApprove} disabled={approve.isLoading} className="mt-4 min-h-11 w-full rounded-lg bg-labora-green px-4 text-sm font-semibold text-white hover:bg-labora-deep disabled:bg-labora-ui disabled:text-labora-gray">
          Aprobar informe seleccionado
        </button>
      </Panel>
    </div>
  );
}

function LegalDraftsSection({ caseId }: { caseId: string }) {
  const drafts = useAdminLegalDrafts(caseId);
  const selected = drafts.data?.drafts[0];
  const review = useReviewLegalDraft(caseId, selected?.id || "draft");

  if (drafts.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (drafts.error || !drafts.data) {
    return <ErrorState message={drafts.error || "No encontramos escritos."} onRetry={drafts.refetch} />;
  }

  return (
    <SplitPane
      left={
        <div className="grid gap-5">
          {drafts.data.drafts.map((draft) => (
            <Panel key={draft.id}>
              <div className="flex flex-wrap items-center gap-2">
                <VersionBadge version={draft.version} />
                <ReviewDecisionBadge decision={draft.status} />
                {draft.status === "needs_professional_review" ? <Pill tone="red">Revision profesional recomendada</Pill> : null}
              </div>
              <h2 className="mt-4 font-heading text-xl font-semibold text-labora-charcoal">{draft.title}</h2>
              <p className="mt-2 text-sm leading-6 text-labora-gray">{draft.preview}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {draft.checklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg border border-labora-ui p-3 text-sm">
                    {item.passed ? <CheckCircle2 className="h-4 w-4 text-labora-green" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                    <span className={item.passed ? "text-labora-charcoal" : "text-amber-900"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      }
      right={
        <ReviewForm
          title="Revision de escrito"
          onSubmit={({ decision, comment, flag }) =>
            review.run({ decision, comment, professionalReviewRequired: flag })
          }
          isLoading={review.isLoading}
          error={review.error}
          result={review.lastResult}
          options={[
            ["approve", "Aprobar escrito"],
            ["return", "Devolver para edicion"],
            ["professional_review", "Revision profesional requerida"],
          ]}
          extra="Marcar revision profesional requerida"
        />
      }
    />
  );
}

function AuditSection({ caseId }: { caseId: string }) {
  const audit = useAdminAudit(caseId);
  const [type, setType] = useState("all");
  const [actor, setActor] = useState("");
  const [entity, setEntity] = useState("");

  if (audit.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (audit.error || !audit.data) {
    return <ErrorState message={audit.error || "No encontramos auditoria."} onRetry={audit.refetch} />;
  }

  const filtered = audit.data.filter((event) => {
    if (type !== "all" && !event.action.toLowerCase().includes(type)) {
      return false;
    }

    if (actor && !event.actor.toLowerCase().includes(actor.toLowerCase())) {
      return false;
    }

    if (entity && !event.entity.toLowerCase().includes(entity.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Tipo de evento
            <select value={type} onChange={(event) => setType(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm">
              <option value="all">Todos</option>
              <option value="documento">Documento</option>
              <option value="alerta">Alerta</option>
              <option value="asigno">Asignacion</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Usuario admin
            <input value={actor} onChange={(event) => setActor(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Entidad
            <input value={entity} onChange={(event) => setEntity(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm" />
          </label>
          <div className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Resultado
            <div className="flex min-h-11 items-center rounded-lg border border-labora-ui px-3 text-sm text-labora-gray">
              {filtered.length} evento(s)
            </div>
          </div>
        </div>
      </Panel>
      {filtered.length ? (
        <div className="grid gap-3">
          {filtered.map((event) => (
            <AuditEventItem key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState title="Sin eventos" body="No hay trazabilidad para los filtros aplicados." />
      )}
    </div>
  );
}

function SectionBody({
  section,
  caseId,
  detail,
  onAlert,
}: {
  section: AdminCaseSection;
  caseId: string;
  detail: AdminCaseDetail;
  onAlert: (alert: AiAlert) => void;
}) {
  if (section === "overview") {
    return <OverviewSection detail={detail} onAlert={onAlert} />;
  }

  if (section === "documents") {
    return <DocumentsSection caseId={caseId} />;
  }

  if (section === "extraction") {
    return <ExtractionSection caseId={caseId} />;
  }

  if (section === "legal-analysis") {
    return <LegalAnalysisSection caseId={caseId} />;
  }

  if (section === "calculations") {
    return <CalculationsSection caseId={caseId} />;
  }

  if (section === "reports") {
    return <ReportsSection caseId={caseId} detail={detail} />;
  }

  if (section === "legal-drafts") {
    return <LegalDraftsSection caseId={caseId} />;
  }

  return <AuditSection caseId={caseId} />;
}

export function AdminCaseWorkspacePage({
  caseId,
  section,
}: {
  caseId: string;
  section: AdminCaseSection;
}) {
  const detail = useAdminCase(caseId);
  const users = useAdminUsers();
  const assign = useAssignCase(caseId);
  const status = useChangeCaseStatus(caseId);
  const note = useCreateInternalNote(caseId);
  const [drawer, setDrawer] = useState<"assign" | "status" | "note" | null>(null);
  const [activeAlert, setActiveAlert] = useState<AiAlert | null>(null);

  if (detail.isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (detail.error || !detail.data) {
    return <ErrorState message={detail.error || "No encontramos este expediente."} onRetry={detail.refetch} />;
  }

  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="Operacion de expediente"
        title={detail.data.holder.name}
        body={`${detail.data.caseNumber} - ${detail.data.currentStage}`}
      />
      <CaseHeader
        detail={detail.data}
        onAssign={() => setDrawer("assign")}
        onStatus={() => setDrawer("status")}
        onNote={() => setDrawer("note")}
      />
      <CaseTabs caseId={caseId} section={section} />
      <SectionBody section={section} caseId={caseId} detail={detail.data} onAlert={setActiveAlert} />

      <AssignCaseModal
        open={drawer === "assign"}
        users={users.data || []}
        isLoading={assign.isLoading}
        error={assign.error}
        result={assign.lastResult}
        onClose={() => setDrawer(null)}
        onSubmit={assign.run}
      />
      <ChangeCaseStatusModal
        open={drawer === "status"}
        isLoading={status.isLoading}
        error={status.error}
        result={status.lastResult}
        onClose={() => setDrawer(null)}
        onSubmit={status.run}
      />
      <InternalNoteDrawer
        open={drawer === "note"}
        isLoading={note.isLoading}
        error={note.error}
        result={note.lastResult}
        onClose={() => setDrawer(null)}
        onSubmit={note.run}
      />
      <AiAlertDrawer alert={activeAlert} onClose={() => setActiveAlert(null)} />

      <StickyActionBar>
        <button type="button" onClick={() => setDrawer("note")} className="min-h-11 rounded-lg border border-labora-ui bg-white text-sm font-semibold text-labora-deep">
          Nota
        </button>
        <button type="button" onClick={() => setDrawer("status")} className="min-h-11 rounded-lg bg-labora-green text-sm font-semibold text-white">
          Estado
        </button>
      </StickyActionBar>
    </div>
  );
}

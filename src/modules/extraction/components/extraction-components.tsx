"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Eye,
  FileSearch,
  FileText,
  History,
  Layers3,
  Loader2,
  LockKeyhole,
  PenLine,
  Plus,
  RefreshCcw,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  ContributionGap,
  ContributionWeek,
  CorrectionItem,
  CreateEmployerPayload,
  CreateLaborPeriodPayload,
  DocumentReference,
  Employer,
  ExtractionIssue,
  ExtractionIssueSeverity,
  ExtractionResponse,
  ExtractionStatus,
  ExtractionTab,
  FieldStatus,
  LaborPeriod,
  SalaryBase,
} from "@/src/modules/extraction/api/extraction.types";
import {
  formatConfidencePercent,
  getConfidenceMeta,
} from "@/src/modules/extraction/utils/formatConfidence";
import { formatCurrency } from "@/src/modules/extraction/utils/formatCurrency";
import {
  formatDate,
  formatDateTime,
  monthLabel,
  toDateInputValue,
} from "@/src/modules/extraction/utils/formatDate";
import {
  validateDateRange,
  validateSalaryBase,
  validateWeeks,
} from "@/src/modules/extraction/utils/validation";

type Tone = "success" | "warning" | "danger" | "neutral" | "progress" | "info";

export type EditableFieldTarget = {
  entityType: string;
  entityId?: string;
  fieldKey: string;
  label: string;
  value: unknown;
  inputType?: "text" | "number" | "date" | "currency";
  confidence?: number | null;
  source?: DocumentReference;
};

export type PendingFieldTarget = EditableFieldTarget;

export const extractionTabs: Array<{
  id: ExtractionTab;
  label: string;
  hrefSegment?: string;
}> = [
  { id: "summary", label: "Resumen" },
  { id: "pdf-data", label: "PDF vs datos" },
  { id: "timeline", label: "Timeline" },
  { id: "employers", label: "Empleadores" },
  { id: "weeks", label: "Semanas" },
  { id: "salaries", label: "Salarios" },
  { id: "gaps", label: "Vacios" },
  { id: "corrections", label: "Correcciones" },
  { id: "confirm", label: "Confirmacion" },
];

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-labora-ui bg-white text-labora-gray",
  progress: "border-labora-mint bg-labora-mint/20 text-labora-deep",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

const statusLabels: Record<ExtractionStatus, string> = {
  not_started: "Sin iniciar",
  in_progress: "En extraccion",
  completed: "Completada",
  blocked: "Bloqueada",
  requires_review: "Requiere revision",
  error: "Error",
};

const fieldStatusLabels: Record<FieldStatus, string> = {
  extracted: "Extraido",
  normalized: "Normalizado",
  low_confidence: "Baja confianza",
  corrected_by_user: "Corregido por ti",
  corrected_by_admin: "Corregido por revision",
  pending_user_confirmation: "Pendiente",
  confirmed: "Confirmado",
  ignored: "Ignorado",
  conflict: "Conflicto",
};

const employerTypeLabels: Record<string, string> = {
  private: "Privado",
  public: "Publico",
  teacher: "Docente",
  unknown: "Sin clasificar",
};

const periodTypeLabels: Record<string, string> = {
  worked: "Laborado",
  contributed: "Cotizado",
  reported: "Reportado",
  gap: "Vacio",
  unknown: "Sin clasificar",
};

const regimeLabels: Record<string, string> = {
  general: "General",
  public: "Publico",
  teacher: "Docente",
  special: "Especial",
  unknown: "Sin pista",
};

const issueSeverityLabels: Record<ExtractionIssueSeverity, string> = {
  info: "Informativo",
  warning: "Revisar",
  critical: "Critico",
};

function statusTone(status: ExtractionStatus): Tone {
  if (status === "completed") {
    return "success";
  }

  if (status === "in_progress") {
    return "progress";
  }

  if (status === "requires_review") {
    return "warning";
  }

  if (status === "blocked" || status === "error") {
    return "danger";
  }

  return "neutral";
}

function fieldStatusTone(status: FieldStatus): Tone {
  if (status === "confirmed" || status === "corrected_by_user" || status === "corrected_by_admin") {
    return "success";
  }

  if (status === "low_confidence" || status === "pending_user_confirmation" || status === "conflict") {
    return "warning";
  }

  if (status === "ignored") {
    return "neutral";
  }

  return "info";
}

function issueTone(severity: ExtractionIssueSeverity): Tone {
  if (severity === "critical") {
    return "danger";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "info";
}

function StatusIcon({ tone }: { tone: Tone }) {
  if (tone === "success") {
    return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  }

  if (tone === "danger") {
    return <XCircle className="h-4 w-4" aria-hidden="true" />;
  }

  if (tone === "progress") {
    return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;
  }

  if (tone === "info") {
    return <FileSearch className="h-4 w-4" aria-hidden="true" />;
  }

  return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
}

function stringifyValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "Pendiente";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getEntitySource(entity: { source?: DocumentReference }) {
  return entity.source;
}

function collectSources(extraction: ExtractionResponse) {
  const entitySources = [
    ...extraction.laborPeriods.map(getEntitySource),
    ...extraction.contributionWeeks.map(getEntitySource),
    ...extraction.salaryBases.map(getEntitySource),
    ...extraction.gaps.map(getEntitySource),
    ...extraction.issues.map(getEntitySource),
  ].filter(Boolean) as DocumentReference[];

  const all = [...extraction.documentReferences, ...entitySources];
  const seen = new Set<string>();

  return all.filter((source) => {
    const key = `${source.documentId}-${source.page || "doc"}-${source.fieldId || source.sourceText || ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function ExtractionLayout({
  caseId,
  activeTab,
  extraction,
  children,
}: {
  caseId: string;
  activeTab: ExtractionTab;
  extraction: ExtractionResponse;
  children: ReactNode;
}) {
  const pendingCount = [
    ...extraction.employers,
    ...extraction.laborPeriods,
    ...extraction.contributionWeeks,
    ...extraction.salaryBases,
    ...extraction.gaps,
  ].filter((item) => item.status === "pending_user_confirmation").length;

  return (
    <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel xl:sticky xl:top-6 xl:self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
          Expediente
        </p>
        <nav className="mt-4 grid gap-2 text-sm" aria-label="Secciones del expediente">
          {[
            ["Resumen", `/app/cases/${caseId}`],
            ["Documentos", `/app/cases/${caseId}/documents`],
            ["Datos extraidos", `/app/cases/${caseId}/extraction`],
            ["Cuestionario", `/app/cases/${caseId}/questionnaire`],
            ["Historial", `/app/cases/${caseId}/history`],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={label === "Datos extraidos" ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 font-semibold transition hover:bg-labora-ivory hover:text-labora-deep",
                label === "Datos extraidos" ? "bg-labora-ivory text-labora-deep" : "text-labora-gray",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-5 rounded-xl border border-labora-ui bg-labora-ivory p-3 text-sm">
          <p className="font-semibold text-labora-charcoal">Pendientes</p>
          <p className="mt-1 text-labora-gray">
            {pendingCount} campos marcados y {extraction.lowConfidenceCount} de baja confianza.
          </p>
        </div>
      </aside>

      <div className="min-w-0 space-y-5">
        <ExtractionTabs caseId={caseId} activeTab={activeTab} />
        {children}
      </div>
    </div>
  );
}

export function ExtractionTabs({
  caseId,
  activeTab,
}: {
  caseId: string;
  activeTab: ExtractionTab;
}) {
  return (
    <nav
      aria-label="Secciones de extraccion"
      className="overflow-x-auto rounded-2xl border border-labora-ui bg-white p-2 shadow-panel"
    >
      <div className="flex min-w-max gap-2">
        {extractionTabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/app/cases/${caseId}/extraction?tab=${tab.id}`}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
              activeTab === tab.id
                ? "bg-labora-green text-white"
                : "text-labora-gray hover:bg-labora-ivory hover:text-labora-deep",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function ExtractionStatusHeader({
  extraction,
  isRefreshing,
  onRefresh,
}: {
  extraction: ExtractionResponse;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}) {
  const tone = statusTone(extraction.status);
  const reviewed =
    extraction.summary.employersCount +
    extraction.summary.laborPeriodsCount +
    extraction.summary.salaryBasesCount;
  const total =
    reviewed +
    extraction.lowConfidenceCount +
    extraction.summary.gapsCount +
    extraction.issues.length;
  const progress = total ? Math.max(15, Math.round((reviewed / total) * 100)) : 0;

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Extraccion y validacion
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
            Datos extraidos del expediente
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
            Revisa empleadores, periodos, semanas y valores detectados antes del
            preanalisis. Esta vista no contiene liquidacion ni conclusiones juridicas finales.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row lg:flex-col lg:items-end">
          <span className={cn("inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold", toneClasses[tone])}>
            <StatusIcon tone={tone} />
            {statusLabels[extraction.status]}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || isRefreshing}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} aria-hidden="true" />
            Actualizar
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_240px]">
        <div className="rounded-xl border border-labora-ui bg-labora-ivory p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold text-labora-charcoal">Progreso de revision</span>
            <span className="font-semibold text-labora-deep">{progress}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-labora-green" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <ConfidenceSummaryCard
          confidenceAvg={extraction.confidenceAvg}
          lowConfidenceCount={extraction.lowConfidenceCount}
        />
      </div>
    </section>
  );
}

export function ConfidenceSummaryCard({
  confidenceAvg,
  lowConfidenceCount,
}: {
  confidenceAvg: number | null;
  lowConfidenceCount: number;
}) {
  return (
    <div className="rounded-xl border border-labora-ui bg-white p-4">
      <p className="text-sm font-semibold text-labora-charcoal">Confianza promedio</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <ConfidenceBadge value={confidenceAvg} />
        <span className="text-sm font-semibold text-labora-gray">
          {lowConfidenceCount} baja confianza
        </span>
      </div>
    </div>
  );
}

export function ExtractionStatsGrid({ extraction }: { extraction: ExtractionResponse }) {
  const stats = [
    ["Empleadores", extraction.summary.employersCount],
    ["Periodos", extraction.summary.laborPeriodsCount],
    ["Semanas detectadas", extraction.summary.contributionWeeksTotal.toFixed(2)],
    ["Bases salariales", extraction.summary.salaryBasesCount],
    ["Vacios", extraction.summary.gapsCount],
    ["Novedades", extraction.summary.noveltiesCount],
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map(([label, value]) => (
        <article key={label} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <p className="text-sm text-labora-gray">{label}</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
            {value}
          </p>
        </article>
      ))}
    </section>
  );
}

export function ConfidenceBadge({ value }: { value?: number | null }) {
  const meta = getConfidenceMeta(value);
  const tone = meta.tone === "success" ? "success" : meta.tone === "warning" ? "warning" : meta.tone === "danger" ? "danger" : "neutral";

  return (
    <span className={cn("inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", toneClasses[tone])}>
      <StatusIcon tone={tone} />
      <span>{meta.label}</span>
      <span className="font-bold">{meta.valueText}</span>
    </span>
  );
}

export function FieldStatusBadge({ status }: { status: FieldStatus }) {
  const tone = fieldStatusTone(status);

  return (
    <span className={cn("inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", toneClasses[tone])}>
      <StatusIcon tone={tone} />
      {fieldStatusLabels[status]}
    </span>
  );
}

export function IssueSeverityBadge({ severity }: { severity: ExtractionIssueSeverity }) {
  const tone = issueTone(severity);

  return (
    <span className={cn("inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", toneClasses[tone])}>
      <StatusIcon tone={tone} />
      {issueSeverityLabels[severity]}
    </span>
  );
}

export function SourceReferenceButton({
  source,
  onClick,
}: {
  source?: DocumentReference;
  onClick?: (source: DocumentReference) => void;
}) {
  if (!source) {
    return (
      <span className="inline-flex min-h-8 items-center rounded-full border border-labora-ui bg-white px-3 py-1 text-xs font-semibold text-labora-gray">
        Sin fuente
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(source)}
      className="inline-flex min-h-8 items-center gap-2 rounded-full border border-labora-ui bg-white px-3 py-1 text-xs font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
    >
      <Eye className="h-4 w-4" aria-hidden="true" />
      {source.documentName || "Documento"}
      {source.page ? ` p. ${source.page}` : ""}
    </button>
  );
}

export function EditableField({
  target,
  status,
  onEdit,
  onMarkPending,
  onViewSource,
}: {
  target: EditableFieldTarget;
  status?: FieldStatus;
  onEdit: (target: EditableFieldTarget) => void;
  onMarkPending?: (target: PendingFieldTarget) => void;
  onViewSource?: (source: DocumentReference) => void;
}) {
  return (
    <div className="rounded-xl border border-labora-ui bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
            {target.label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-labora-charcoal">
            {stringifyValue(target.value)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ConfidenceBadge value={target.confidence} />
            {status ? <FieldStatusBadge status={status} /> : null}
            <SourceReferenceButton source={target.source} onClick={onViewSource} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(target)}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-labora-ui bg-white px-3 py-2 text-xs font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Editar
          </button>
          {onMarkPending ? (
            <button
              type="button"
              onClick={() => onMarkPending(target)}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              Pendiente
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PdfSideBySideViewer({
  extraction,
  selectedSource,
  onSelectSource,
  onEdit,
  onMarkPending,
}: {
  extraction: ExtractionResponse;
  selectedSource?: DocumentReference | null;
  onSelectSource?: (source: DocumentReference) => void;
  onEdit: (target: EditableFieldTarget) => void;
  onMarkPending?: (target: PendingFieldTarget) => void;
}) {
  const sources = collectSources(extraction);
  const activeSource = selectedSource || sources[0];
  const fields = [
    ...extraction.employers.slice(0, 5).map((employer) => ({
      key: `employer-${employer.id}`,
      status: employer.status,
      target: {
        entityType: "employer",
        entityId: employer.id,
        fieldKey: "name",
        label: "Empleador",
        value: employer.name,
        confidence: employer.confidence,
        inputType: "text" as const,
      },
    })),
    ...extraction.laborPeriods.slice(0, 5).map((period) => ({
      key: `period-${period.id}`,
      status: period.status,
      target: {
        entityType: "labor_period",
        entityId: period.id,
        fieldKey: "startDate",
        label: `${period.employerName || "Periodo"} - inicio`,
        value: period.startDate,
        confidence: period.confidence,
        inputType: "date" as const,
        source: period.source,
      },
    })),
    ...extraction.salaryBases.slice(0, 5).map((salary) => ({
      key: `salary-${salary.id}`,
      status: salary.status,
      target: {
        entityType: "salary_base",
        entityId: salary.id,
        fieldKey: "normalizedValue",
        label: `${salary.employerName || "Base"} ${salary.year}`,
        value: salary.normalizedValue,
        confidence: salary.confidence,
        inputType: "currency" as const,
        source: salary.source,
      },
    })),
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <article className="overflow-hidden rounded-2xl border border-labora-ui bg-white shadow-panel">
        <div className="border-b border-labora-ui p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-labora-green" aria-hidden="true" />
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Fuente documental
            </h2>
          </div>
        </div>
        <div className="grid min-h-[520px] gap-4 bg-labora-ivory p-4 lg:grid-cols-[150px_1fr]">
          <DocumentPageSelector
            sources={sources}
            selectedSource={activeSource}
            onSelectSource={onSelectSource}
          />
          <div className="relative flex min-h-[460px] items-center justify-center rounded-xl border border-labora-ui bg-white p-5">
            <div className="h-full w-full max-w-xl rounded-lg border border-labora-ui bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-gray">
                {activeSource?.documentName || "Documento fuente"}
              </p>
              <p className="mt-2 text-sm font-semibold text-labora-charcoal">
                Pagina {activeSource?.page || 1}
              </p>
              <div className="mt-6 rounded-xl border border-dashed border-labora-mint bg-labora-mint/10 p-4 text-sm leading-6 text-labora-deep">
                {activeSource?.sourceText ||
                  "El backend no envio fragmento visible para esta referencia."}
              </div>
              {activeSource?.bbox ? <SourceHighlightOverlay /> : null}
            </div>
          </div>
        </div>
      </article>

      <ExtractedFieldsPanel
        fields={fields}
        onEdit={onEdit}
        onMarkPending={onMarkPending}
        onViewSource={onSelectSource}
      />
    </section>
  );
}

export function DocumentPageSelector({
  sources,
  selectedSource,
  onSelectSource,
}: {
  sources: DocumentReference[];
  selectedSource?: DocumentReference;
  onSelectSource?: (source: DocumentReference) => void;
}) {
  if (!sources.length) {
    return (
      <div className="rounded-xl border border-labora-ui bg-white p-4 text-sm text-labora-gray">
        No hay fuentes documentales asociadas.
      </div>
    );
  }

  return (
    <div className="grid max-h-[460px] gap-2 overflow-y-auto">
      {sources.map((source, index) => {
        const selected =
          selectedSource?.documentId === source.documentId &&
          selectedSource?.page === source.page &&
          selectedSource?.fieldId === source.fieldId;

        return (
          <button
            type="button"
            key={`${source.documentId}-${source.page || index}-${source.fieldId || index}`}
            onClick={() => onSelectSource?.(source)}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
              selected
                ? "border-labora-green bg-labora-green text-white"
                : "border-labora-ui bg-white text-labora-gray hover:bg-labora-ivory",
            )}
          >
            {source.documentName || "Documento"}
            <span className="mt-1 block font-normal">
              Pagina {source.page || 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SourceHighlightOverlay() {
  return (
    <div className="pointer-events-none absolute inset-x-8 top-1/3 h-20 rounded-xl border-2 border-labora-green bg-labora-mint/25" />
  );
}

export function ExtractedFieldsPanel({
  fields,
  onEdit,
  onMarkPending,
  onViewSource,
}: {
  fields: Array<{ key: string; target: EditableFieldTarget; status?: FieldStatus }>;
  onEdit: (target: EditableFieldTarget) => void;
  onMarkPending?: (target: PendingFieldTarget) => void;
  onViewSource?: (source: DocumentReference) => void;
}) {
  return (
    <aside className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <Layers3 className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Campos extraidos
        </h2>
      </div>
      <div className="mt-4 grid gap-3">
        {fields.length ? (
          fields.map((field) => (
            <EditableField
              key={field.key}
              target={field.target}
              status={field.status}
              onEdit={onEdit}
              onMarkPending={onMarkPending}
              onViewSource={onViewSource}
            />
          ))
        ) : (
          <p className="rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm text-labora-gray">
            Aun no hay campos estructurados para comparar.
          </p>
        )}
      </div>
    </aside>
  );
}

export function LaborTimeline({
  periods,
  gaps,
  onEdit,
  onIgnore,
  onMarkPending,
  onAdd,
  onViewSource,
}: {
  periods: LaborPeriod[];
  gaps: ContributionGap[];
  onEdit: (target: EditableFieldTarget) => void;
  onIgnore?: (entityType: string, entityId: string) => void;
  onMarkPending?: (target: PendingFieldTarget) => void;
  onAdd?: () => void;
  onViewSource?: (source: DocumentReference) => void;
}) {
  const sorted = useMemo(
    () =>
      [...periods].sort((first, second) =>
        first.startDate.localeCompare(second.startDate),
      ),
    [periods],
  );

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-labora-green" aria-hidden="true" />
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Linea de tiempo laboral
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            {sorted.length} periodos detectados y {gaps.length} vacios asociados.
          </p>
        </div>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar periodo
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4">
        {sorted.map((period, index) => (
          <TimelinePeriodCard
            key={period.id}
            period={period}
            previousPeriod={sorted[index - 1]}
            onEdit={onEdit}
            onIgnore={onIgnore}
            onMarkPending={onMarkPending}
            onViewSource={onViewSource}
          />
        ))}
        {!sorted.length ? (
          <p className="rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm text-labora-gray">
            No hay periodos laborales extraidos.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function TimelinePeriodCard({
  period,
  previousPeriod,
  onEdit,
  onIgnore,
  onMarkPending,
  onViewSource,
}: {
  period: LaborPeriod;
  previousPeriod?: LaborPeriod;
  onEdit: (target: EditableFieldTarget) => void;
  onIgnore?: (entityType: string, entityId: string) => void;
  onMarkPending?: (target: PendingFieldTarget) => void;
  onViewSource?: (source: DocumentReference) => void;
}) {
  const overlaps =
    previousPeriod?.endDate &&
    new Date(`${period.startDate}T00:00:00`) <
      new Date(`${previousPeriod.endDate}T00:00:00`);

  return (
    <article className="relative rounded-2xl border border-labora-ui bg-white p-4">
      <div className="absolute left-5 top-10 hidden h-[calc(100%-2rem)] w-px bg-labora-ui sm:block" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-labora-mint bg-labora-mint/20 text-labora-deep">
          <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
                {period.employerName || "Empleador pendiente"}
              </h3>
              <p className="mt-1 text-sm text-labora-gray">
                {formatDate(period.startDate)} - {period.endDate ? formatDate(period.endDate) : "Vigente"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ConfidenceBadge value={period.confidence} />
              <FieldStatusBadge status={period.status} />
            </div>
          </div>
          {overlaps ? <PeriodOverlapAlert /> : null}
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-xl bg-labora-ivory p-3">
              <dt className="text-labora-gray">Tipo</dt>
              <dd className="mt-1 font-semibold text-labora-charcoal">{periodTypeLabels[period.periodType]}</dd>
            </div>
            <div className="rounded-xl bg-labora-ivory p-3">
              <dt className="text-labora-gray">Regimen</dt>
              <dd className="mt-1 font-semibold text-labora-charcoal">{regimeLabels[period.regimeHint || "unknown"]}</dd>
            </div>
            <div className="rounded-xl bg-labora-ivory p-3">
              <dt className="text-labora-gray">Semanas</dt>
              <dd className="mt-1 font-semibold text-labora-charcoal">{period.weeksDetected ?? "-"}</dd>
            </div>
            <div className="rounded-xl bg-labora-ivory p-3">
              <dt className="text-labora-gray">Dias</dt>
              <dd className="mt-1 font-semibold text-labora-charcoal">{period.daysDetected ?? "-"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onEdit({
                  entityType: "labor_period",
                  entityId: period.id,
                  fieldKey: "startDate",
                  label: "Fecha inicio",
                  value: period.startDate,
                  inputType: "date",
                  confidence: period.confidence,
                  source: period.source,
                })
              }
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-labora-ui bg-white px-3 py-2 text-xs font-semibold text-labora-deep transition hover:bg-labora-ivory"
            >
              <PenLine className="h-4 w-4" aria-hidden="true" />
              Editar
            </button>
            {onMarkPending ? (
              <button
                type="button"
                onClick={() =>
                  onMarkPending({
                    entityType: "labor_period",
                    entityId: period.id,
                    fieldKey: "status",
                    label: "Periodo pendiente",
                    value: period.status,
                    inputType: "text",
                    confidence: period.confidence,
                    source: period.source,
                  })
                }
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
              >
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                Pendiente
              </button>
            ) : null}
            <SourceReferenceButton source={period.source} onClick={onViewSource} />
            {onIgnore ? (
              <button
                type="button"
                onClick={() => onIgnore("labor_period", period.id)}
                className="inline-flex min-h-9 items-center rounded-lg border border-labora-ui bg-white px-3 py-2 text-xs font-semibold text-labora-gray transition hover:bg-labora-ivory"
              >
                Ignorar
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function GapMarker({ gap }: { gap: ContributionGap }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <p className="font-semibold">Vacio detectado</p>
      <p className="mt-1">
        {formatDate(gap.startDate)} - {formatDate(gap.endDate)}
        {gap.weeks ? ` · ${gap.weeks} semanas` : ""}
      </p>
    </div>
  );
}

export function PeriodOverlapAlert() {
  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
      Hay una posible superposicion de fechas. Puedes corregirla o dejarla en revision.
    </div>
  );
}

export function EmployersTable({
  employers,
  periods,
  onEdit,
  onIgnore,
  onAdd,
}: {
  employers: Employer[];
  periods: LaborPeriod[];
  onEdit: (target: EditableFieldTarget) => void;
  onIgnore?: (entityType: string, entityId: string) => void;
  onAdd?: () => void;
}) {
  const periodCountByEmployer = periods.reduce<Record<string, number>>((acc, period) => {
    if (period.employerId) {
      acc[period.employerId] = (acc[period.employerId] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-labora-green" aria-hidden="true" />
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Empleadores detectados
            </h2>
          </div>
          <p className="mt-2 text-sm text-labora-gray">{employers.length} registros para revisar.</p>
        </div>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar empleador
          </button>
        ) : null}
      </div>
      <DuplicateEmployerAlert employers={employers} />

      <div className="mt-5 hidden overflow-x-auto rounded-xl border border-labora-ui md:block">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3 font-semibold">Detectado</th>
              <th className="px-4 py-3 font-semibold">Normalizado</th>
              <th className="px-4 py-3 font-semibold">NIT</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Periodos</th>
              <th className="px-4 py-3 font-semibold">Confianza</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui bg-white">
            {employers.map((employer) => (
              <tr key={employer.id} className="align-top">
                <td className="px-4 py-3 text-labora-gray">{employer.rawName || employer.name}</td>
                <td className="px-4 py-3 font-semibold text-labora-charcoal">{employer.name}</td>
                <td className="px-4 py-3 text-labora-gray">{employer.nit || "-"}</td>
                <td className="px-4 py-3">
                  <EmployerTypeBadge type={employer.employerType || "unknown"} />
                </td>
                <td className="px-4 py-3 text-labora-gray">{periodCountByEmployer[employer.id] || 0}</td>
                <td className="px-4 py-3"><ConfidenceBadge value={employer.confidence} /></td>
                <td className="px-4 py-3"><FieldStatusBadge status={employer.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEdit({
                          entityType: "employer",
                          entityId: employer.id,
                          fieldKey: "name",
                          label: "Nombre normalizado",
                          value: employer.name,
                          inputType: "text",
                          confidence: employer.confidence,
                        })
                      }
                      className="rounded-lg border border-labora-ui px-3 py-2 text-xs font-semibold text-labora-deep hover:bg-labora-ivory"
                    >
                      Editar
                    </button>
                    {onIgnore ? (
                      <button
                        type="button"
                        onClick={() => onIgnore("employer", employer.id)}
                        className="rounded-lg border border-labora-ui px-3 py-2 text-xs font-semibold text-labora-gray hover:bg-labora-ivory"
                      >
                        Ignorar
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!employers.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-labora-gray">
                  No hay empleadores extraidos.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-3 md:hidden">
        {employers.map((employer) => (
          <EmployerCard
            key={employer.id}
            employer={employer}
            periodCount={periodCountByEmployer[employer.id] || 0}
            onEdit={onEdit}
            onIgnore={onIgnore}
          />
        ))}
      </div>
    </section>
  );
}

export function EmployerCard({
  employer,
  periodCount,
  onEdit,
  onIgnore,
}: {
  employer: Employer;
  periodCount: number;
  onEdit: (target: EditableFieldTarget) => void;
  onIgnore?: (entityType: string, entityId: string) => void;
}) {
  return (
    <article className="rounded-xl border border-labora-ui bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-labora-charcoal">{employer.name}</h3>
          <p className="mt-1 text-sm text-labora-gray">{employer.nit || "NIT pendiente"}</p>
        </div>
        <EmployerTypeBadge type={employer.employerType || "unknown"} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <ConfidenceBadge value={employer.confidence} />
        <FieldStatusBadge status={employer.status} />
        <span className="rounded-full border border-labora-ui px-3 py-1 text-xs font-semibold text-labora-gray">
          {periodCount} periodos
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onEdit({
              entityType: "employer",
              entityId: employer.id,
              fieldKey: "name",
              label: "Nombre normalizado",
              value: employer.name,
              inputType: "text",
              confidence: employer.confidence,
            })
          }
          className="inline-flex min-h-9 items-center rounded-lg border border-labora-ui px-3 py-2 text-xs font-semibold text-labora-deep"
        >
          Editar
        </button>
        {onIgnore ? (
          <button
            type="button"
            onClick={() => onIgnore("employer", employer.id)}
            className="inline-flex min-h-9 items-center rounded-lg border border-labora-ui px-3 py-2 text-xs font-semibold text-labora-gray"
          >
            Ignorar
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function EmployerTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex min-h-8 items-center rounded-full border border-labora-ui bg-labora-ivory px-3 py-1 text-xs font-semibold text-labora-deep">
      {employerTypeLabels[type] || employerTypeLabels.unknown}
    </span>
  );
}

export function DuplicateEmployerAlert({ employers }: { employers: Employer[] }) {
  const duplicateNames = employers
    .map((employer) => employer.name.toLowerCase())
    .filter((name, index, list) => list.indexOf(name) !== index);

  if (!duplicateNames.length) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
      Hay posibles duplicados de empleador. Revisa nombres normalizados antes de confirmar.
    </div>
  );
}

export function ContributionWeeksSummary({ weeks }: { weeks: ContributionWeek[] }) {
  const total = weeks.reduce((acc, item) => acc + item.weeks, 0);
  const years = new Set(weeks.map((item) => item.year)).size;

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <p className="text-sm text-labora-gray">Semanas totales</p>
        <p className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
          {total.toFixed(2)}
        </p>
      </article>
      <article className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <p className="text-sm text-labora-gray">Anios con datos</p>
        <p className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
          {years}
        </p>
      </article>
      <WeeksValidationAlert weeks={weeks} />
    </section>
  );
}

export function WeeksByYearChart({ weeks }: { weeks: ContributionWeek[] }) {
  const byYear = weeks.reduce<Record<number, number>>((acc, item) => {
    acc[item.year] = (acc[item.year] || 0) + item.weeks;
    return acc;
  }, {});
  const rows = Object.entries(byYear).sort(([a], [b]) => Number(a) - Number(b));
  const max = Math.max(...rows.map(([, total]) => total), 1);

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
        Distribucion por ano
      </h2>
      <div className="mt-4 grid gap-3">
        {rows.map(([year, total]) => (
          <div key={year} className="grid gap-2 sm:grid-cols-[80px_1fr_80px] sm:items-center">
            <span className="text-sm font-semibold text-labora-charcoal">{year}</span>
            <span className="h-3 overflow-hidden rounded-full bg-labora-ivory">
              <span
                className="block h-full rounded-full bg-labora-green"
                style={{ width: `${Math.max(6, (total / max) * 100)}%` }}
              />
            </span>
            <span className="text-sm font-semibold text-labora-gray">{total.toFixed(2)}</span>
          </div>
        ))}
        {!rows.length ? (
          <p className="text-sm text-labora-gray">No hay semanas para graficar.</p>
        ) : null}
      </div>
    </section>
  );
}

export function ContributionWeeksTable({
  weeks,
  onEdit,
  onMarkPending,
  onViewSource,
}: {
  weeks: ContributionWeek[];
  onEdit: (target: EditableFieldTarget) => void;
  onMarkPending?: (target: PendingFieldTarget) => void;
  onViewSource?: (source: DocumentReference) => void;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
        Semanas y periodos
      </h2>
      <div className="mt-5 overflow-x-auto rounded-xl border border-labora-ui">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3 font-semibold">Ano</th>
              <th className="px-4 py-3 font-semibold">Mes</th>
              <th className="px-4 py-3 font-semibold">Empleador</th>
              <th className="px-4 py-3 font-semibold">Semanas</th>
              <th className="px-4 py-3 font-semibold">Confianza</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Fuente</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui bg-white">
            {weeks.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-3 font-semibold text-labora-charcoal">{item.year}</td>
                <td className="px-4 py-3 text-labora-gray">{monthLabel(item.month)}</td>
                <td className="px-4 py-3 text-labora-gray">{item.employerName || "-"}</td>
                <td className="px-4 py-3 font-semibold text-labora-charcoal">{item.weeks.toFixed(2)}</td>
                <td className="px-4 py-3"><ConfidenceBadge value={item.confidence} /></td>
                <td className="px-4 py-3"><FieldStatusBadge status={item.status} /></td>
                <td className="px-4 py-3"><SourceReferenceButton source={item.source} onClick={onViewSource} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEdit({
                          entityType: "contribution_week",
                          entityId: item.id,
                          fieldKey: "weeks",
                          label: "Semanas",
                          value: item.weeks,
                          inputType: "number",
                          confidence: item.confidence,
                          source: item.source,
                        })
                      }
                      className="rounded-lg border border-labora-ui px-3 py-2 text-xs font-semibold text-labora-deep hover:bg-labora-ivory"
                    >
                      Editar
                    </button>
                    {onMarkPending ? (
                      <button
                        type="button"
                        onClick={() =>
                          onMarkPending({
                            entityType: "contribution_week",
                            entityId: item.id,
                            fieldKey: "status",
                            label: "Semanas pendientes",
                            value: item.status,
                            inputType: "text",
                          })
                        }
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
                      >
                        Pendiente
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!weeks.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-labora-gray">
                  No hay semanas detectadas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function WeeksValidationAlert({ weeks }: { weeks: ContributionWeek[] }) {
  const excessive = weeks.some((item) => item.weeks > 5);

  return (
    <article className={cn("rounded-2xl border p-5 shadow-panel", excessive ? toneClasses.warning : toneClasses.success)}>
      <p className="font-semibold">
        {excessive ? "Revisar semanas atipicas" : "Semanas sin alertas criticas"}
      </p>
      <p className="mt-1 text-sm leading-6">
        {excessive
          ? "Hay meses con semanas superiores a lo usual. Verifica la fuente antes de confirmar."
          : "No detectamos semanas negativas o excesivas en la tabla actual."}
      </p>
    </article>
  );
}

export function SalaryTrendPreview({ salaryBases }: { salaryBases: SalaryBase[] }) {
  const values = salaryBases
    .map((item) => item.normalizedValue || item.originalValue || 0)
    .filter((value) => value > 0);
  const max = Math.max(...values, 1);

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
        Vista de bases detectadas
      </h2>
      <p className="mt-2 text-sm leading-6 text-labora-gray">
        Son datos base extraidos, no una liquidacion final.
      </p>
      <div className="mt-4 flex h-32 items-end gap-2 overflow-hidden">
        {salaryBases.slice(-18).map((salary) => {
          const value = salary.normalizedValue || salary.originalValue || 0;
          return (
            <span
              key={salary.id}
              title={`${salary.year} ${formatCurrency(value)}`}
              className="min-h-2 flex-1 rounded-t bg-labora-green"
              style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
            />
          );
        })}
        {!salaryBases.length ? (
          <p className="self-center text-sm text-labora-gray">No hay bases para graficar.</p>
        ) : null}
      </div>
    </section>
  );
}

export function CurrencyValueCell({ value }: { value?: number | null }) {
  return <span className="font-semibold text-labora-charcoal">{formatCurrency(value)}</span>;
}

export function SalaryOutlierAlert({ salaryBases }: { salaryBases: SalaryBase[] }) {
  const values = salaryBases
    .map((item) => item.normalizedValue || item.originalValue || 0)
    .filter((value) => value > 0);
  const average = values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : 0;
  const hasOutlier = average > 0 && values.some((value) => value > average * 3 || value < average * 0.25);

  if (!hasOutlier) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
      Hay valores atipicos frente al promedio detectado. Revisa el documento fuente.
    </div>
  );
}

export function SalaryBaseTable({
  salaryBases,
  onEdit,
  onMarkPending,
  onViewSource,
}: {
  salaryBases: SalaryBase[];
  onEdit: (target: EditableFieldTarget) => void;
  onMarkPending?: (target: PendingFieldTarget) => void;
  onViewSource?: (source: DocumentReference) => void;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
        Salarios y bases detectadas
      </h2>
      <p className="mt-2 text-sm leading-6 text-labora-gray">
        Estos valores son datos base extraidos del soporte documental.
      </p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-labora-ui">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3 font-semibold">Ano</th>
              <th className="px-4 py-3 font-semibold">Mes</th>
              <th className="px-4 py-3 font-semibold">Empleador</th>
              <th className="px-4 py-3 font-semibold">Valor original</th>
              <th className="px-4 py-3 font-semibold">Valor normalizado</th>
              <th className="px-4 py-3 font-semibold">Confianza</th>
              <th className="px-4 py-3 font-semibold">Fuente</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui bg-white">
            {salaryBases.map((salary) => (
              <tr key={salary.id} className="align-top">
                <td className="px-4 py-3 font-semibold text-labora-charcoal">{salary.year}</td>
                <td className="px-4 py-3 text-labora-gray">{monthLabel(salary.month)}</td>
                <td className="px-4 py-3 text-labora-gray">{salary.employerName || "-"}</td>
                <td className="px-4 py-3"><CurrencyValueCell value={salary.originalValue} /></td>
                <td className="px-4 py-3"><CurrencyValueCell value={salary.normalizedValue} /></td>
                <td className="px-4 py-3"><ConfidenceBadge value={salary.confidence} /></td>
                <td className="px-4 py-3"><SourceReferenceButton source={salary.source} onClick={onViewSource} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEdit({
                          entityType: "salary_base",
                          entityId: salary.id,
                          fieldKey: "normalizedValue",
                          label: "Valor normalizado",
                          value: salary.normalizedValue,
                          inputType: "currency",
                          confidence: salary.confidence,
                          source: salary.source,
                        })
                      }
                      className="rounded-lg border border-labora-ui px-3 py-2 text-xs font-semibold text-labora-deep hover:bg-labora-ivory"
                    >
                      Editar
                    </button>
                    {onMarkPending ? (
                      <button
                        type="button"
                        onClick={() =>
                          onMarkPending({
                            entityType: "salary_base",
                            entityId: salary.id,
                            fieldKey: "status",
                            label: "Base salarial pendiente",
                            value: salary.status,
                            inputType: "text",
                          })
                        }
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
                      >
                        Pendiente
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!salaryBases.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-labora-gray">
                  No hay salarios o bases detectadas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ExtractionIssuesList({
  issues,
  gaps,
  onResolve,
  onDismiss,
  onViewSource,
}: {
  issues: ExtractionIssue[];
  gaps?: ContributionGap[];
  onResolve?: (issue: ExtractionIssue) => void;
  onDismiss?: (issue: ExtractionIssue) => void;
  onViewSource?: (source: DocumentReference) => void;
}) {
  const visibleIssues = issues.filter((issue) => issue.status !== "resolved" && issue.status !== "dismissed");

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Vacios, novedades e inconsistencias
        </h2>
      </div>
      {gaps?.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {gaps.map((gap) => (
            <GapMarker key={gap.id} gap={gap} />
          ))}
        </div>
      ) : null}
      <div className="mt-5 grid gap-3">
        {visibleIssues.map((issue) => (
          <IssueResolutionCard
            key={issue.id}
            issue={issue}
            onResolve={onResolve}
            onDismiss={onDismiss}
            onViewSource={onViewSource}
          />
        ))}
        {!visibleIssues.length && !gaps?.length ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            No hay inconsistencias abiertas para revisar.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function IssueResolutionCard({
  issue,
  onResolve,
  onDismiss,
  onViewSource,
}: {
  issue: ExtractionIssue;
  onResolve?: (issue: ExtractionIssue) => void;
  onDismiss?: (issue: ExtractionIssue) => void;
  onViewSource?: (source: DocumentReference) => void;
}) {
  return (
    <article className={cn("rounded-xl border p-4", toneClasses[issueTone(issue.severity)])}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <StatusIcon tone={issueTone(issue.severity)} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{issue.title}</h3>
              <IssueSeverityBadge severity={issue.severity} />
            </div>
            <p className="mt-2 text-sm leading-6">{issue.message}</p>
            {issue.suggestedAction ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em]">
                {issue.suggestedAction}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SourceReferenceButton source={issue.source} onClick={onViewSource} />
          {onResolve ? <MarkIssueResolvedButton onClick={() => onResolve(issue)} /> : null}
          {onDismiss ? (
            <button
              type="button"
              onClick={() => onDismiss(issue)}
              className="inline-flex min-h-9 items-center rounded-lg border border-current/25 bg-white/70 px-3 py-2 text-xs font-semibold transition hover:bg-white"
            >
              Descartar
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function RequestAdditionalInfoCard({ caseId }: { caseId: string }) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-labora-ivory p-5 text-sm leading-6 text-labora-gray">
      <div className="flex gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
        <div>
          <p className="font-semibold text-labora-charcoal">Soporte adicional</p>
          <p className="mt-1">
            Si un dato no aparece claro, puedes volver a documentos y cargar soporte.
          </p>
          <Link
            href={`/app/cases/${caseId}/documents`}
            className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep transition hover:bg-white"
          >
            Ir a documentos
          </Link>
        </div>
      </div>
    </section>
  );
}

export function MarkIssueResolvedButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-current/25 bg-white/70 px-3 py-2 text-xs font-semibold transition hover:bg-white"
    >
      <Check className="h-4 w-4" aria-hidden="true" />
      Resolver
    </button>
  );
}

export function CorrectionsTimeline({ corrections }: { corrections: CorrectionItem[] }) {
  const [filter, setFilter] = useState("all");
  const entityTypes = Array.from(new Set(corrections.map((item) => item.entityType)));
  const visible =
    filter === "all"
      ? corrections
      : corrections.filter((item) => item.entityType === filter);

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-labora-green" aria-hidden="true" />
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Historial de correcciones
          </h2>
        </div>
        <CorrectionFilterBar
          value={filter}
          options={entityTypes}
          onChange={setFilter}
        />
      </div>
      <div className="mt-5 grid gap-3">
        {visible.map((correction) => (
          <CorrectionDiffCard key={correction.id} correction={correction} />
        ))}
        {!visible.length ? (
          <p className="rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm text-labora-gray">
            Aun no hay correcciones registradas para este filtro.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function CorrectionFilterBar({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
      Filtrar entidad
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green/20"
      >
        <option value="all">Todas</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CorrectionDiffCard({ correction }: { correction: CorrectionItem }) {
  return (
    <article className="rounded-xl border border-labora-ui bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-labora-charcoal">
            {correction.label || correction.fieldKey}
          </h3>
          <p className="mt-1 text-sm text-labora-gray">
            {correction.entityType}
            {correction.actorName ? ` · ${correction.actorName}` : ""}
            {correction.actorRole ? ` · ${correction.actorRole}` : ""}
          </p>
        </div>
        <span className="text-xs font-semibold text-labora-gray">
          {formatDateTime(correction.createdAt)}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-red-100 bg-red-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-700">
            Antes
          </p>
          <p className="mt-1 break-words text-sm text-red-800">
            {stringifyValue(correction.previousValue)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
            Ahora
          </p>
          <p className="mt-1 break-words text-sm text-emerald-800">
            {stringifyValue(correction.newValue)}
          </p>
        </div>
      </div>
      {correction.reason ? (
        <p className="mt-3 text-sm leading-6 text-labora-gray">{correction.reason}</p>
      ) : null}
    </article>
  );
}

export function ConfirmationChecklist({
  extraction,
}: {
  extraction: ExtractionResponse;
}) {
  const items = [
    {
      label: "Empleadores revisados",
      done: extraction.employers.every((item) => item.status !== "low_confidence"),
    },
    {
      label: "Periodos revisados",
      done: extraction.laborPeriods.every((item) => item.status !== "low_confidence"),
    },
    {
      label: "Semanas revisadas",
      done: extraction.contributionWeeks.every((item) => item.status !== "low_confidence"),
    },
    {
      label: "Salarios/base revisados",
      done: extraction.salaryBases.every((item) => item.status !== "low_confidence"),
    },
    {
      label: "Vacios revisados",
      done: extraction.gaps.every((item) => item.status !== "low_confidence"),
    },
    {
      label: "Campos de baja confianza tratados",
      done: extraction.lowConfidenceCount === 0,
    },
    {
      label: "Bloqueos criticos resueltos",
      done: extraction.blockingReasons.length === 0,
    },
  ];

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <SearchCheck className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Checklist de confirmacion
        </h2>
      </div>
      <ul className="mt-5 grid gap-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-3 rounded-xl border border-labora-ui bg-labora-ivory/70 p-3">
            <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", item.done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800")}>
              {item.done ? <Check className="h-4 w-4" aria-hidden="true" /> : <AlertCircle className="h-4 w-4" aria-hidden="true" />}
            </span>
            <span className="text-sm font-semibold text-labora-charcoal">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PendingFieldsSummary({ extraction }: { extraction: ExtractionResponse }) {
  const pending = [
    ...extraction.employers,
    ...extraction.laborPeriods,
    ...extraction.contributionWeeks,
    ...extraction.salaryBases,
    ...extraction.gaps,
  ].filter((item) => item.status === "pending_user_confirmation");

  if (!pending.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-panel">
      <h2 className="font-heading text-lg font-semibold">Campos pendientes</h2>
      <p className="mt-2 text-sm leading-6">
        Hay {pending.length} campos marcados como pendientes. Puedes confirmar con pendientes si aceptas que esto puede afectar el analisis posterior.
      </p>
    </section>
  );
}

export function LowConfidenceWarning({ extraction }: { extraction: ExtractionResponse }) {
  if (!extraction.lowConfidenceCount) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-panel">
      <div className="flex gap-3">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm leading-6">
          Hay {extraction.lowConfidenceCount} campos de baja confianza. Revisalos o confirma que aceptas avanzar con esos campos.
        </p>
      </div>
    </section>
  );
}

export function UserConfirmationStatement({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 rounded-2xl border border-labora-ui bg-white p-5 text-sm font-semibold text-labora-charcoal shadow-panel">
      Declaracion de confirmacion
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-medium text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
      />
    </label>
  );
}

export function ConfirmExtractionCTA({
  canConfirm,
  hasPending,
  isLoading,
  onConfirm,
  onConfirmWithPending,
  onReview,
}: {
  canConfirm: boolean;
  hasPending: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onConfirmWithPending: () => void;
  onReview: () => void;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
        Acciones finales
      </h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm || isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          Confirmar datos
        </button>
        {hasPending ? (
          <button
            type="button"
            onClick={onConfirmWithPending}
            disabled={isLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Confirmar con pendientes
          </button>
        ) : null}
        <button
          type="button"
          onClick={onReview}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
        >
          Volver a revisar
        </button>
      </div>
      {!canConfirm ? (
        <p className="mt-3 text-sm leading-6 text-labora-gray">
          La confirmacion principal se habilita cuando no hay bloqueos criticos.
        </p>
      ) : null}
    </section>
  );
}

export function BlockingReasonsAlert({ reasons }: { reasons: string[] }) {
  if (!reasons.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-panel">
      <div className="flex gap-3">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold">No es posible confirmar todavia</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <Circle className="mt-2 h-2 w-2 shrink-0 fill-current" aria-hidden="true" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function EmptyState({
  title = "Aun no hay datos extraidos para este expediente.",
  description = "Cuando la lectura documental finalice, aqui podras revisar empleadores, periodos, semanas y valores detectados.",
  primaryAction,
  secondaryAction,
}: {
  title?: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-labora-mint bg-white p-8 text-center shadow-panel">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-labora-ivory text-labora-green">
        <FileSearch className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-heading text-2xl font-semibold text-labora-charcoal">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-labora-gray">
        {description}
      </p>
      {(primaryAction || secondaryAction) ? (
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </section>
  );
}

export function LoadingState() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <div className="h-4 w-40 animate-pulse rounded bg-labora-ui" />
          <div className="mt-4 h-7 w-72 max-w-full animate-pulse rounded bg-labora-ui" />
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="h-16 animate-pulse rounded-xl bg-labora-ivory" />
            <div className="h-16 animate-pulse rounded-xl bg-labora-ivory" />
            <div className="h-16 animate-pulse rounded-xl bg-labora-ivory" />
            <div className="h-16 animate-pulse rounded-xl bg-labora-ivory" />
          </div>
        </div>
      ))}
      <p className="sr-only">Estamos preparando los datos extraidos...</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  documentsHref,
}: {
  message?: string | null;
  onRetry?: () => void;
  documentsHref?: string;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-panel">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-xl font-semibold">
            No pudimos cargar los datos extraidos
          </h2>
          <p className="mt-2 text-sm leading-6">
            {message || "Intenta nuevamente o contacta soporte si el problema continua."}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        ) : null}
        {documentsHref ? (
          <Link
            href={documentsHref}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Ir a documentos
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function MobileBottomCTA({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="fixed inset-x-4 bottom-4 z-20 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white shadow-panel transition hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray md:hidden"
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    focusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (!elements.length) {
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-labora-charcoal/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-labora-ui bg-white p-5 shadow-panel"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-labora-gray transition hover:bg-labora-ivory hover:text-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EditFieldModal({
  target,
  open,
  isLoading,
  error,
  onClose,
  onSave,
}: {
  target: EditableFieldTarget | null;
  open: boolean;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (value: unknown, reason?: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) {
      return;
    }

    if (target.inputType === "date") {
      setValue(toDateInputValue(String(target.value || "")));
    } else if (target.value === null || target.value === undefined) {
      setValue("");
    } else {
      setValue(String(target.value));
    }
    setReason("");
    setLocalError(null);
  }, [target]);

  if (!open || !target) {
    return null;
  }

  const inputType = target.inputType || "text";

  async function submit() {
    setLocalError(null);
    let parsed: unknown = value;

    if (inputType === "number" || inputType === "currency") {
      parsed = value === "" ? null : Number(value);
      const validation =
        inputType === "currency"
          ? validateSalaryBase(parsed as number | null)
          : validateWeeks(parsed as number | null);
      if (validation) {
        setLocalError(validation);
        return;
      }
    }

    if (inputType === "date" && !value) {
      setLocalError("La fecha no puede quedar vacia.");
      return;
    }

    await onSave(parsed, reason.trim() || undefined);
  }

  return (
    <ModalShell title={`Editar ${target.label}`} onClose={onClose}>
      <div className="mt-5 grid gap-4">
        <div className="rounded-xl border border-labora-ui bg-labora-ivory p-3 text-sm">
          <p className="font-semibold text-labora-charcoal">Valor actual</p>
          <p className="mt-1 break-words text-labora-gray">{stringifyValue(target.value)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ConfidenceBadge value={target.confidence} />
            <SourceReferenceButton source={target.source} />
          </div>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Valor nuevo
          <input
            value={value}
            type={inputType === "currency" ? "number" : inputType}
            min={inputType === "currency" || inputType === "number" ? 0 : undefined}
            step={inputType === "number" ? "0.01" : "1"}
            onChange={(event) => setValue(event.target.value)}
            className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-medium text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Motivo opcional
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-medium text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
            placeholder="OCR lo leyo mal, soporte adicional, correccion manual"
          />
        </label>
      </div>
      {localError || error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {localError || error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          Guardar
        </button>
      </div>
    </ModalShell>
  );
}

export function EditEntityDrawer({
  open,
  kind,
  employers,
  isLoading,
  error,
  onClose,
  onCreateEmployer,
  onCreatePeriod,
}: {
  open: boolean;
  kind: "employer" | "period";
  employers: Employer[];
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onCreateEmployer: (payload: CreateEmployerPayload) => Promise<void> | void;
  onCreatePeriod: (payload: CreateLaborPeriodPayload) => Promise<void> | void;
}) {
  const [employerName, setEmployerName] = useState("");
  const [nit, setNit] = useState("");
  const [employerType, setEmployerType] = useState<CreateEmployerPayload["employerType"]>("unknown");
  const [employerId, setEmployerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [periodType, setPeriodType] = useState<CreateLaborPeriodPayload["periodType"]>("worked");
  const [weeksDetected, setWeeksDetected] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setEmployerName("");
    setNit("");
    setEmployerType("unknown");
    setEmployerId("");
    setStartDate("");
    setEndDate("");
    setPeriodType("worked");
    setWeeksDetected("");
    setReason("");
    setLocalError(null);
  }, [open, kind]);

  if (!open) {
    return null;
  }

  async function submit() {
    setLocalError(null);
    if (kind === "employer") {
      if (!employerName.trim()) {
        setLocalError("Ingresa el nombre del empleador.");
        return;
      }

      await onCreateEmployer({
        name: employerName.trim(),
        nit: nit.trim() || undefined,
        employerType,
        reason: reason.trim() || undefined,
      });
      return;
    }

    const dateError = validateDateRange(startDate, endDate || null);
    if (dateError) {
      setLocalError(dateError);
      return;
    }

    const weeks =
      weeksDetected.trim() === "" ? undefined : Number(weeksDetected);
    const weeksError = validateWeeks(weeks);
    if (weeksError) {
      setLocalError(weeksError);
      return;
    }

    await onCreatePeriod({
      employerId: employerId || undefined,
      startDate,
      endDate: endDate || null,
      periodType,
      weeksDetected: weeks,
      regimeHint: "unknown",
      reason: reason.trim() || undefined,
    });
  }

  return (
    <ModalShell
      title={kind === "employer" ? "Agregar empleador" : "Agregar periodo laboral"}
      onClose={onClose}
    >
      <div className="mt-5 grid gap-4">
        {kind === "employer" ? (
          <>
            <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
              Nombre
              <input
                value={employerName}
                onChange={(event) => setEmployerName(event.target.value)}
                className="min-h-11 rounded-lg border border-labora-ui px-3 py-2"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
              NIT opcional
              <input
                value={nit}
                onChange={(event) => setNit(event.target.value)}
                className="min-h-11 rounded-lg border border-labora-ui px-3 py-2"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
              Tipo
              <select
                value={employerType}
                onChange={(event) => setEmployerType(event.target.value as CreateEmployerPayload["employerType"])}
                className="min-h-11 rounded-lg border border-labora-ui px-3 py-2"
              >
                <option value="private">Privado</option>
                <option value="public">Publico</option>
                <option value="teacher">Docente</option>
                <option value="unknown">Sin clasificar</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
              Empleador
              <select
                value={employerId}
                onChange={(event) => setEmployerId(event.target.value)}
                className="min-h-11 rounded-lg border border-labora-ui px-3 py-2"
              >
                <option value="">Sin asociar</option>
                {employers.map((employer) => (
                  <option key={employer.id} value={employer.id}>
                    {employer.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
                Fecha inicio
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="min-h-11 rounded-lg border border-labora-ui px-3 py-2"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
                Fecha fin
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="min-h-11 rounded-lg border border-labora-ui px-3 py-2"
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
              Tipo de periodo
              <select
                value={periodType}
                onChange={(event) => setPeriodType(event.target.value as CreateLaborPeriodPayload["periodType"])}
                className="min-h-11 rounded-lg border border-labora-ui px-3 py-2"
              >
                <option value="worked">Laborado</option>
                <option value="contributed">Cotizado</option>
                <option value="reported">Reportado</option>
                <option value="gap">Vacio</option>
                <option value="unknown">Sin clasificar</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
              Semanas detectadas
              <input
                type="number"
                min={0}
                step="0.01"
                value={weeksDetected}
                onChange={(event) => setWeeksDetected(event.target.value)}
                className="min-h-11 rounded-lg border border-labora-ui px-3 py-2"
              />
            </label>
          </>
        )}
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Motivo opcional
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="rounded-lg border border-labora-ui px-3 py-2"
          />
        </label>
      </div>
      {localError || error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {localError || error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          Crear
        </button>
      </div>
    </ModalShell>
  );
}

export function IgnoreEntityModal({
  open,
  isLoading,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}) {
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setLocalError(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function submit() {
    if (!reason.trim()) {
      setLocalError("El motivo es obligatorio.");
      return;
    }

    await onConfirm(reason.trim());
  }

  return (
    <ModalShell title="Ignorar dato extraido" onClose={onClose}>
      <label className="mt-5 grid gap-2 text-sm font-semibold text-labora-charcoal">
        Por que quieres ignorar este dato?
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          className="rounded-lg border border-labora-ui px-3 py-2"
          placeholder="Duplicado, OCR lo leyo mal, no corresponde a mi historia laboral"
        />
      </label>
      {localError || error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {localError || error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          Ignorar
        </button>
      </div>
    </ModalShell>
  );
}

export function ConfirmExtractionModal({
  open,
  isLoading,
  error,
  pendingCount,
  lowConfidenceCount,
  onClose,
  onConfirm,
}: {
  open: boolean;
  isLoading?: boolean;
  error?: string | null;
  pendingCount: number;
  lowConfidenceCount: number;
  onClose: () => void;
  onConfirm: (acceptedImpact: boolean) => Promise<void> | void;
}) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (open) {
      setAccepted(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <ModalShell title="Confirmas los datos revisados?" onClose={onClose}>
      <div className="mt-5 grid gap-3 text-sm leading-6 text-labora-gray">
        <p>
          Estos datos seran usados para generar el preanalisis y, si pagas, el analisis completo.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-labora-ui bg-labora-ivory p-3">
            <span className="text-labora-gray">Pendientes</span>
            <strong className="ml-2 text-labora-charcoal">{pendingCount}</strong>
          </div>
          <div className="rounded-xl border border-labora-ui bg-labora-ivory p-3">
            <span className="text-labora-gray">Baja confianza</span>
            <strong className="ml-2 text-labora-charcoal">{lowConfidenceCount}</strong>
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-labora-ui bg-white p-3 text-labora-charcoal">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green focus:ring-labora-green"
          />
          <span className="text-sm font-semibold">
            Entiendo que los datos confirmados seran usados para el analisis posterior.
          </span>
        </label>
      </div>
      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep"
        >
          Volver a revisar
        </button>
        <button
          type="button"
          onClick={() => onConfirm(accepted)}
          disabled={!accepted || isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          Confirmar datos
        </button>
      </div>
    </ModalShell>
  );
}

export function ExtractionProgressCard({ extraction }: { extraction: ExtractionResponse }) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
            Estado de confirmacion
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            {extraction.confirmationStatus.replace(/_/g, " ")}
          </p>
        </div>
      </div>
    </section>
  );
}

export function NextActionCard({
  caseId,
  canConfirm,
}: {
  caseId: string;
  canConfirm: boolean;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
            Siguiente accion
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            {canConfirm
              ? "Puedes revisar el checklist final y confirmar la informacion."
              : "Completa la revision de campos pendientes para avanzar."}
          </p>
        </div>
        <Link
          href={`/app/cases/${caseId}/extraction?tab=${canConfirm ? "confirm" : "pdf-data"}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
        >
          {canConfirm ? "Ir a confirmacion" : "Continuar revision"}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

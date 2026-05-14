"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FileSearch,
  FileText,
  FileUp,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/src/modules/cases/utils/caseFormatters";
import {
  getAdminPrecheck,
  getAdminPrechecks,
  getPrecheckErrorMessage,
} from "@/src/modules/document-precheck/api/document-precheck.api";
import type {
  AdminDocumentPrecheckItem,
  AdminPrecheckListParams,
  DocumentIssueDto,
  DocumentPrecheckDecision,
  DocumentPrecheckDto,
  DocumentPrecheckStatus,
  IssueSeverity,
  OcrPagePreviewDto,
  OcrPreviewSummaryDto,
  TrafficLight,
} from "@/src/modules/document-precheck/api/document-precheck.types";
import { useAdminPrecheckDecision } from "@/src/modules/document-precheck/hooks/useDocumentPrecheck";

type Tone = "success" | "warning" | "danger" | "neutral" | "progress" | "info";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-labora-ui bg-white text-labora-gray",
  progress: "border-labora-mint bg-labora-mint/20 text-labora-deep",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

const statusLabel: Record<DocumentPrecheckStatus, string> = {
  not_started: "Sin iniciar",
  queued: "En cola",
  in_progress: "En revision",
  completed: "Completada",
  blocked: "Bloqueada",
  requires_review: "Revision humana",
  error: "Error",
};

const suggestedActionLabel: Record<string, string> = {
  continue: "Continuar",
  upload_better_scan: "Subir mejor version",
  upload_correct_document: "Subir documento correcto",
  add_supporting_document: "Agregar soporte",
  rotate_or_rescan: "Escanear nuevamente",
  contact_support: "Contactar soporte",
  wait_and_retry: "Intentar de nuevo",
  human_review: "Solicitar revision",
};

const trafficLightCopy: Record<
  TrafficLight,
  { title: string; description: string; tone: Tone }
> = {
  green: {
    title: "Documento apto",
    description:
      "Tu documento es legible y parece corresponder a una historia laboral o soporte laboral/pensional.",
    tone: "success",
  },
  yellow: {
    title: "Documento apto con observaciones",
    description:
      "Puedes continuar, pero encontramos aspectos que podrian afectar la precision.",
    tone: "warning",
  },
  red: {
    title: "Documento requiere nueva carga",
    description:
      "No podemos continuar con este archivo porque la calidad o el tipo de documento no es suficiente.",
    tone: "danger",
  },
  gray: {
    title: "Documento en revision",
    description:
      "Estamos verificando si el documento tiene calidad suficiente para continuar.",
    tone: "progress",
  },
};

function percent(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Sin dato";
  }

  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
}

function truncate(text = "", limit = 260) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit).trim()}...`;
}

function statusTone(status: DocumentPrecheckStatus): Tone {
  if (status === "completed") {
    return "success";
  }

  if (status === "queued" || status === "in_progress") {
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

function severityTone(severity: IssueSeverity): Tone {
  if (severity === "critical") {
    return "danger";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "info";
}

function decisionAllowsContinue(decision: DocumentPrecheckDecision | null) {
  return decision === "suitable" || decision === "suitable_with_observations";
}

function decisionRequiresReupload(decision: DocumentPrecheckDecision | null) {
  return decision === "requires_reupload" || decision === "unsupported" || decision === "failed";
}

function StatusIcon({ tone }: { tone: Tone }) {
  if (tone === "success") {
    return <CheckCircle2 className="h-5 w-5" aria-hidden="true" />;
  }

  if (tone === "danger") {
    return <XCircle className="h-5 w-5" aria-hidden="true" />;
  }

  if (tone === "progress") {
    return <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />;
  }

  if (tone === "info") {
    return <FileSearch className="h-5 w-5" aria-hidden="true" />;
  }

  return <AlertCircle className="h-5 w-5" aria-hidden="true" />;
}

export function DocumentPrecheckHeader({
  precheck,
  documentName,
  isRefreshing,
  onRefresh,
}: {
  precheck?: DocumentPrecheckDto | null;
  documentName?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            IA preliminar documental
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
            Revision automatica del documento
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
            Revisaremos automaticamente si tu documento es legible, completo y compatible
            con el analisis de Labora. Esta revision no reemplaza el analisis juridico completo.
          </p>
          {documentName || precheck?.documentName ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-labora-ui bg-labora-ivory px-3 py-2 text-sm font-semibold text-labora-charcoal">
              <FileText className="h-4 w-4 text-labora-green" aria-hidden="true" />
              {documentName || precheck?.documentName}
            </p>
          ) : null}
        </div>
        {precheck ? (
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
                toneClasses[statusTone(precheck.status)],
              )}
            >
              <StatusIcon tone={statusTone(precheck.status)} />
              {statusLabel[precheck.status]}
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={!onRefresh || isRefreshing}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                aria-hidden="true"
              />
              Actualizar
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function DocumentStatusStepper({
  status,
}: {
  status: DocumentPrecheckStatus;
}) {
  const steps = [
    "Documento recibido",
    "Lectura preliminar",
    "Validacion de calidad",
    "Resultado documental",
  ];
  const activeIndex =
    status === "not_started"
      ? 0
      : status === "queued"
        ? 1
        : status === "in_progress"
          ? 2
          : 3;

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-labora-mint bg-labora-mint/20 text-labora-deep">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Estamos verificando el documento
          </h2>
          <p className="mt-1 text-sm leading-6 text-labora-gray">
            Revisamos legibilidad, tipo de documento y senales basicas para continuar.
          </p>
        </div>
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-4">
        {steps.map((step, index) => {
          const done = index < activeIndex || status === "completed";
          const active = index === activeIndex && status !== "completed";

          return (
            <li
              key={step}
              className={cn(
                "rounded-xl border p-3 text-sm",
                done && "border-emerald-200 bg-emerald-50 text-emerald-800",
                active && "border-labora-mint bg-labora-mint/20 text-labora-deep",
                !done && !active && "border-labora-ui bg-labora-ivory text-labora-gray",
              )}
            >
              <span className="font-semibold">{step}</span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/70">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    done && "w-full bg-emerald-500",
                    active && "w-2/3 animate-pulse bg-labora-green",
                    !done && !active && "w-1/5 bg-labora-ui",
                  )}
                />
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function TrafficLightCard({
  trafficLight,
  decision,
  confidenceScore,
  title,
  summary,
}: {
  trafficLight: TrafficLight;
  decision: DocumentPrecheckDecision | null;
  confidenceScore?: number | null;
  title?: string;
  summary?: string;
}) {
  const copy = trafficLightCopy[trafficLight];

  return (
    <section className={cn("rounded-2xl border p-5 shadow-panel", toneClasses[copy.tone])}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70">
            <StatusIcon tone={copy.tone} />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">
              {title || copy.title}
            </h2>
            <p className="mt-1 text-sm leading-6">{summary || copy.description}</p>
            {decision === "requires_human_review" ? (
              <p className="mt-2 text-sm font-semibold">
                El sistema no pudo validar el documento con suficiente confianza.
              </p>
            ) : null}
          </div>
        </div>
        <ConfidenceIndicator value={confidenceScore ?? null} label="Confianza" />
      </div>
    </section>
  );
}

export function ConfidenceIndicator({
  value,
  label = "Confianza",
  showPercent = true,
}: {
  value: number | null;
  label?: string;
  showPercent?: boolean;
}) {
  const raw = typeof value === "number" && Number.isFinite(value) ? value : null;
  const normalized = raw === null ? 0 : raw <= 1 ? raw : raw / 100;
  const width = `${Math.max(0, Math.min(100, Math.round(normalized * 100)))}%`;

  return (
    <div className="min-w-[150px] rounded-xl border border-white/70 bg-white/70 p-3 text-labora-charcoal">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
        <span>{label}</span>
        {showPercent ? <span>{percent(value)}</span> : null}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-labora-ui">
        <div className="h-full rounded-full bg-labora-green" style={{ width }} />
      </div>
    </div>
  );
}

export function DocumentIssueList({
  issues,
  onViewPage,
  onAction,
}: {
  issues: DocumentIssueDto[];
  onViewPage?: (pageNumber: number) => void;
  onAction?: (issue: DocumentIssueDto) => void;
}) {
  if (!issues.length) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="font-medium">No hay observaciones documentales reportadas.</p>
        </div>
      </section>
    );
  }

  const grouped = issues.reduce<Record<string, DocumentIssueDto[]>>((acc, issue) => {
    const key = issue.pageNumber ? `Pagina ${issue.pageNumber}` : "Documento";
    acc[key] = [...(acc[key] || []), issue];
    return acc;
  }, {});

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Observaciones por pagina
        </h2>
      </div>
      <div className="mt-4 grid gap-4">
        {Object.entries(grouped).map(([group, groupIssues]) => (
          <div key={group} className="grid gap-2">
            <h3 className="text-sm font-semibold text-labora-charcoal">{group}</h3>
            {groupIssues.map((issue, index) => (
              <DocumentIssueItem
                key={`${issue.code}-${issue.pageNumber || "document"}-${index}`}
                issue={issue}
                onViewPage={onViewPage}
                onAction={onAction}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function DocumentIssueItem({
  issue,
  onViewPage,
  onAction,
}: {
  issue: DocumentIssueDto;
  onViewPage?: (pageNumber: number) => void;
  onAction?: (issue: DocumentIssueDto) => void;
}) {
  const tone = severityTone(issue.severity);

  return (
    <article className={cn("rounded-xl border p-4 text-sm", toneClasses[tone])}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <StatusIcon tone={tone} />
          <div>
            <p className="font-semibold">{issue.title}</p>
            <p className="mt-1 leading-6">{issue.message}</p>
            {issue.suggestedAction ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em]">
                {suggestedActionLabel[issue.suggestedAction] || issue.suggestedAction}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {issue.pageNumber ? (
            <button
              type="button"
              onClick={() => onViewPage?.(issue.pageNumber || 1)}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-current/25 bg-white/70 px-3 py-2 text-xs font-semibold transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Ver pagina
            </button>
          ) : null}
          {issue.suggestedAction ? (
            <button
              type="button"
              onClick={() => onAction?.(issue)}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-current/25 bg-white/70 px-3 py-2 text-xs font-semibold transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
            >
              Aplicar accion
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function OcrPreviewPanel({
  ocr,
  isLoading,
  onRefresh,
}: {
  ocr?: OcrPreviewSummaryDto;
  isLoading?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-labora-green" aria-hidden="true" />
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Resultado OCR preliminar
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            Mostramos solo fragmentos limitados para proteger la informacion sensible.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!onRefresh || isLoading}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className={cn("h-4 w-4", isLoading && "animate-spin")} aria-hidden="true" />
          Refrescar OCR
        </button>
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-xl bg-labora-ivory p-3">
          <dt className="text-labora-gray">Paginas</dt>
          <dd className="mt-1 font-semibold text-labora-charcoal">{ocr?.pagesTotal ?? "-"}</dd>
        </div>
        <div className="rounded-xl bg-labora-ivory p-3">
          <dt className="text-labora-gray">Procesadas</dt>
          <dd className="mt-1 font-semibold text-labora-charcoal">{ocr?.pagesProcessed ?? "-"}</dd>
        </div>
        <div className="rounded-xl bg-labora-ivory p-3">
          <dt className="text-labora-gray">Texto</dt>
          <dd className="mt-1 font-semibold text-labora-charcoal">
            {ocr?.textDetected === undefined ? "-" : ocr.textDetected ? "Detectado" : "No detectado"}
          </dd>
        </div>
        <div className="rounded-xl bg-labora-ivory p-3">
          <dt className="text-labora-gray">Densidad</dt>
          <dd className="mt-1 font-semibold text-labora-charcoal">{percent(ocr?.avgTextDensity)}</dd>
        </div>
      </dl>
      <OcrPageTable pages={ocr?.pages || []} />
    </section>
  );
}

export function OcrPageTable({ pages }: { pages: OcrPagePreviewDto[] }) {
  if (!pages.length) {
    return (
      <div className="mt-5 rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm text-labora-gray">
        Aun no hay fragmentos OCR disponibles para mostrar.
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-labora-ui">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
          <tr>
            <th className="px-4 py-3 font-semibold">Pagina</th>
            <th className="px-4 py-3 font-semibold">Confianza</th>
            <th className="px-4 py-3 font-semibold">Densidad</th>
            <th className="px-4 py-3 font-semibold">Senales</th>
            <th className="px-4 py-3 font-semibold">Preview</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-labora-ui bg-white">
          {pages.map((page) => (
            <tr key={page.pageNumber} className="align-top">
              <td className="px-4 py-3 font-semibold text-labora-charcoal">{page.pageNumber}</td>
              <td className="px-4 py-3 text-labora-gray">{percent(page.confidenceScore)}</td>
              <td className="px-4 py-3 text-labora-gray">{percent(page.textDensity)}</td>
              <td className="px-4 py-3 text-labora-gray">
                {[page.isBlurry && "Borrosa", page.isRotated && "Rotada", page.hasTableLikeContent && "Tabla"]
                  .filter(Boolean)
                  .join(", ") || "Sin alertas"}
              </td>
              <td className="max-w-[340px] px-4 py-3 text-labora-gray">
                {truncate(page.textPreview || "Sin texto preliminar.")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocumentPageViewer({
  selectedPage,
  pages,
  onSelectPage,
}: {
  selectedPage?: number | null;
  pages: OcrPagePreviewDto[];
  onSelectPage?: (page: number) => void;
}) {
  const page = pages.find((item) => item.pageNumber === selectedPage) || pages[0];

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Visor de pagina
        </h2>
      </div>
      {page ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {pages.slice(0, 12).map((item) => (
              <button
                key={item.pageNumber}
                type="button"
                onClick={() => onSelectPage?.(item.pageNumber)}
                className={cn(
                  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold",
                  item.pageNumber === page.pageNumber
                    ? "border-labora-green bg-labora-green text-white"
                    : "border-labora-ui bg-white text-labora-gray hover:bg-labora-ivory",
                )}
              >
                {item.pageNumber}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-labora-ui bg-labora-ivory p-4">
            <p className="text-sm font-semibold text-labora-charcoal">
              Pagina {page.pageNumber}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-labora-gray">
              {truncate(page.textPreview || "No hay preview textual disponible para esta pagina.", 520)}
            </p>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm leading-6 text-labora-gray">
          El visor mostrara fragmentos por pagina cuando el backend entregue el OCR preliminar.
        </p>
      )}
    </section>
  );
}

export function ReuploadDocumentCard({
  onReupload,
  isPrimary,
}: {
  onReupload: () => void;
  isPrimary?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-panel">
      <div className="flex gap-3">
        <FileUp className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-xl font-semibold">
            Necesitamos una nueva carga
          </h2>
          <p className="mt-2 text-sm leading-6">
            Sube una version mas clara para evitar errores en la lectura preliminar.
          </p>
          <ul className="mt-4 grid gap-2 text-sm">
            <li>PDF sin contrasena.</li>
            <li>Escaneo nitido y sin paginas cortadas.</li>
            <li>Todas las paginas en un solo archivo cuando aplique.</li>
            {isPrimary ? <li>Documento exportado desde el fondo si es posible.</li> : null}
          </ul>
          <button
            type="button"
            onClick={onReupload}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Volver a cargar documento
          </button>
        </div>
      </div>
    </section>
  );
}

export function PrecheckActions({
  status,
  decision,
  onContinue,
  onReupload,
  onRequestReview,
  onBack,
  onStart,
  isStarting,
}: {
  status: DocumentPrecheckStatus;
  decision: DocumentPrecheckDecision | null;
  onContinue: () => void;
  onReupload: () => void;
  onRequestReview: () => void;
  onBack: () => void;
  onStart?: () => void;
  isStarting?: boolean;
}) {
  const canContinue = status === "completed" && decisionAllowsContinue(decision);
  const canReupload = status === "blocked" || decisionRequiresReupload(decision);
  const canRequestReview =
    status === "requires_review" || decision === "requires_human_review";

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
        Siguiente paso
      </h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {status === "not_started" && onStart ? (
          <button
            type="button"
            onClick={onStart}
            disabled={isStarting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileSearch className="h-4 w-4" aria-hidden="true" />}
            Iniciar revision automatica
          </button>
        ) : null}
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {decision === "suitable_with_observations" ? "Continuar con observaciones" : "Continuar al preanalisis"}
        </button>
        {canReupload ? (
          <button
            type="button"
            onClick={onReupload}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Cargar mejor version
          </button>
        ) : null}
        {canRequestReview ? (
          <button
            type="button"
            onClick={onRequestReview}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            <UserCheck className="h-4 w-4" aria-hidden="true" />
            Solicitar revision
          </button>
        ) : null}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a documentos
        </button>
      </div>
      {!canContinue && status !== "not_started" ? (
        <p className="mt-3 text-sm leading-6 text-labora-gray">
          El avance se habilita cuando el backend confirme que el documento es apto.
        </p>
      ) : null}
    </section>
  );
}

export function PrivacyNoticeCard({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-labora-ui bg-labora-ivory p-5 text-sm leading-6 text-labora-gray",
        className,
      )}
    >
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
        <p>
          Tus documentos contienen informacion sensible. Solo usaremos esta revision
          para validar la calidad y continuar con tu expediente.
        </p>
      </div>
    </section>
  );
}

export function PrecheckSkeleton() {
  return (
    <div className="grid gap-5" aria-hidden="true">
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
    </div>
  );
}

export function PrecheckErrorState({
  message,
  onRetry,
  href,
}: {
  message?: string | null;
  onRetry?: () => void;
  href?: string;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-panel">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-xl font-semibold">
            No pudimos completar la revision
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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Intentar de nuevo
          </button>
        ) : null}
        {href ? (
          <Link
            href={href}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Ir a autorizaciones
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function AdminPrecheckQueue() {
  const [params, setParams] = useState<AdminPrecheckListParams>({
    status: "all",
    trafficLight: "all",
    page: 1,
    pageSize: 20,
  });
  const [data, setData] = useState<AdminDocumentPrecheckItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    setIsLoading(true);
    setError(null);

    getAdminPrechecks(params)
      .then((response) => {
        if (canceled) {
          return;
        }
        setData(response.items);
        setTotal(response.total);
      })
      .catch((requestError) => {
        if (!canceled) {
          setError(getPrecheckErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!canceled) {
          setIsLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [params]);

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Backoffice documental
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
            Revision documental preliminar
          </h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:w-[620px]">
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Estado
            <select
              value={params.status}
              onChange={(event) =>
                setParams((current) => ({ ...current, status: event.target.value as AdminPrecheckListParams["status"] }))
              }
              className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal"
            >
              <option value="all">Todos</option>
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Semaforo
            <select
              value={params.trafficLight}
              onChange={(event) =>
                setParams((current) => ({ ...current, trafficLight: event.target.value as AdminPrecheckListParams["trafficLight"] }))
              }
              className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal"
            >
              <option value="all">Todos</option>
              <option value="green">Verde</option>
              <option value="yellow">Amarillo</option>
              <option value="red">Rojo</option>
              <option value="gray">Gris</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Buscar
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-labora-gray" aria-hidden="true" />
              <input
                value={params.query || ""}
                onChange={(event) =>
                  setParams((current) => ({ ...current, query: event.target.value }))
                }
                className="min-h-11 w-full rounded-lg border border-labora-ui bg-white py-2 pl-9 pr-3 text-sm text-labora-charcoal"
                placeholder="Caso o documento"
              />
            </span>
          </label>
        </div>
      </div>

      {error ? <PrecheckErrorState message={error} onRetry={() => setParams((current) => ({ ...current }))} /> : null}

      <div className="mt-5 overflow-x-auto rounded-xl border border-labora-ui">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3 font-semibold">Caso</th>
              <th className="px-4 py-3 font-semibold">Documento</th>
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Semaforo</th>
              <th className="px-4 py-3 font-semibold">Confianza</th>
              <th className="px-4 py-3 font-semibold">Criticos</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-labora-gray">
                  Cargando revisiones...
                </td>
              </tr>
            ) : null}
            {!isLoading && data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-labora-gray">
                  No hay revisiones documentales para los filtros actuales.
                </td>
              </tr>
            ) : null}
            {data.map((item) => (
              <tr key={item.precheckId} className="align-top">
                <td className="px-4 py-3 font-semibold text-labora-charcoal">
                  {item.caseNumber || item.caseId}
                </td>
                <td className="max-w-[260px] px-4 py-3 text-labora-gray">
                  {item.documentName || item.documentId}
                </td>
                <td className="px-4 py-3 text-labora-gray">{item.userName || "-"}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", toneClasses[statusTone(item.status)])}>
                    {statusLabel[item.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-labora-gray">{trafficLightCopy[item.trafficLight].title}</td>
                <td className="px-4 py-3 text-labora-gray">{percent(item.confidenceScore)}</td>
                <td className="px-4 py-3 text-labora-gray">
                  {item.criticalIssuesCount ?? item.issues.filter((issue) => issue.severity === "critical").length}
                </td>
                <td className="px-4 py-3 text-labora-gray">{formatDateTime(item.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/document-precheck/${item.precheckId}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-labora-ui bg-white px-3 py-2 text-xs font-semibold text-labora-deep transition hover:bg-labora-ivory"
                  >
                    Revisar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-labora-gray">{total} revisiones encontradas.</p>
    </section>
  );
}

export function AdminPrecheckDetail({ precheckId }: { precheckId: string }) {
  const [precheck, setPrecheck] = useState<AdminDocumentPrecheckItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const decision = useAdminPrecheckDecision(precheckId);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getAdminPrecheck(precheckId)
      .then(setPrecheck)
      .catch((requestError) => setError(getPrecheckErrorMessage(requestError)))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, [precheckId]);

  async function submit(action: "approve" | "reject" | "request_reupload" | "mark_human_review") {
    const updated = await decision.mutate({ action });
    setPrecheck(updated);
  }

  if (isLoading) {
    return <PrecheckSkeleton />;
  }

  if (error || !precheck) {
    return <PrecheckErrorState message={error || "No encontramos esta revision."} onRetry={load} />;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <Link
          href="/admin/document-precheck"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a cola
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-labora-charcoal">
          {precheck.documentName || "Revision documental"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          {precheck.caseNumber || precheck.caseId} · {precheck.userName || "Usuario sin dato"}
        </p>
      </div>

      <TrafficLightCard
        trafficLight={precheck.trafficLight}
        decision={precheck.decision}
        confidenceScore={precheck.confidenceScore}
        summary={precheck.summary}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <DocumentPageViewer pages={precheck.ocr?.pages || []} />
          <OcrPreviewPanel ocr={precheck.ocr} />
          <DocumentIssueList issues={precheck.issues} />
        </div>
        <aside className="space-y-5">
          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Acciones internas
            </h2>
            {decision.error ? <p className="mt-3 text-sm text-red-700">{decision.error}</p> : null}
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => submit("approve")}
                disabled={decision.isLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep disabled:opacity-60"
              >
                Aprobar como apto
              </button>
              <button
                type="button"
                onClick={() => submit("request_reupload")}
                disabled={decision.isLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory disabled:opacity-60"
              >
                Pedir nueva carga
              </button>
              <button
                type="button"
                onClick={() => submit("mark_human_review")}
                disabled={decision.isLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory disabled:opacity-60"
              >
                Marcar revision humana
              </button>
              <button
                type="button"
                onClick={() => submit("reject")}
                disabled={decision.isLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                Rechazar documento
              </button>
            </div>
          </section>
          <PrivacyNoticeCard />
        </aside>
      </div>
    </section>
  );
}

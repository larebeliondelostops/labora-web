"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  FileSearch,
  FileText,
  Gauge,
  GitCompare,
  HelpCircle,
  Layers3,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  Scale,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/src/modules/cases/utils/caseFormatters";
import type {
  AnalysisInconsistency,
  CalculationResult,
  ConfidenceBreakdownItem,
  ConfidenceLevel,
  ConfidenceResponse,
  ExecutiveResult,
  FullAnalysis,
  FullAnalysisBlockedReason,
  FullAnalysisReadinessItem,
  FullAnalysisStatus,
  LegalRuleResult,
  Paginated,
  RecommendedRoute,
  ResultStatus,
  RuleResult,
  Scenario,
  SourceRef,
  StepStatus,
  ViabilityLevel,
} from "@/src/modules/full-analysis/api/full-analysis.types";

export type FullAnalysisTab =
  | "resumen"
  | "reglas"
  | "calculos"
  | "escenarios"
  | "matriz"
  | "confianza";

type Tone = "success" | "warning" | "danger" | "neutral" | "progress";

const tabs: Array<{ id: FullAnalysisTab; label: string; icon: ReactNode }> = [
  { id: "resumen", label: "Resumen", icon: <FileSearch className="h-4 w-4" aria-hidden="true" /> },
  { id: "reglas", label: "Reglas", icon: <BookOpenCheck className="h-4 w-4" aria-hidden="true" /> },
  { id: "calculos", label: "Calculos", icon: <Calculator className="h-4 w-4" aria-hidden="true" /> },
  { id: "escenarios", label: "Escenarios", icon: <GitCompare className="h-4 w-4" aria-hidden="true" /> },
  { id: "matriz", label: "Matriz", icon: <ClipboardList className="h-4 w-4" aria-hidden="true" /> },
  { id: "confianza", label: "Confianza", icon: <Gauge className="h-4 w-4" aria-hidden="true" /> },
];

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-labora-ui bg-white text-labora-gray",
  progress: "border-labora-mint bg-labora-mint/20 text-labora-deep",
};

const statusCopy: Record<FullAnalysisStatus, { label: string; tone: Tone }> = {
  not_started: { label: "No iniciado", tone: "neutral" },
  queued: { label: "En cola", tone: "progress" },
  in_progress: { label: "En proceso", tone: "progress" },
  rules_running: { label: "Reglas juridicas", tone: "progress" },
  calculations_running: { label: "Calculos", tone: "progress" },
  scenario_comparison_running: { label: "Escenarios", tone: "progress" },
  confidence_evaluation_running: { label: "Confianza", tone: "progress" },
  requires_review: { label: "Requiere revision", tone: "warning" },
  completed: { label: "Completado", tone: "success" },
  blocked: { label: "Bloqueado", tone: "warning" },
  failed: { label: "Con error", tone: "danger" },
  cancelled: { label: "Cancelado", tone: "neutral" },
};

const stepIcon: Record<StepStatus, ReactNode> = {
  pending: <Circle className="h-3 w-3" aria-hidden="true" />,
  active: <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />,
  completed: <Check className="h-4 w-4" aria-hidden="true" />,
  warning: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
  error: <XCircle className="h-4 w-4" aria-hidden="true" />,
  blocked: <LockKeyhole className="h-4 w-4" aria-hidden="true" />,
};

const resultCopy: Record<ResultStatus, { label: string; tone: Tone; message: string }> = {
  well_liquidated: {
    label: "Sin error relevante detectado",
    tone: "success",
    message: "No se detecta una diferencia relevante con la informacion disponible.",
  },
  possible_error: {
    label: "Posible error detectado",
    tone: "warning",
    message: "Hay senales que deben revisarse con cuidado antes de concluir.",
  },
  relevant_error: {
    label: "Error relevante detectado",
    tone: "danger",
    message: "Detectamos una posible diferencia relevante segun los datos disponibles.",
  },
  insufficient_information: {
    label: "Informacion insuficiente",
    tone: "neutral",
    message: "Faltan soportes o datos para emitir una conclusion fuerte.",
  },
};

const viabilityCopy: Record<ViabilityLevel, { label: string; tone: Tone }> = {
  high: { label: "Viabilidad alta", tone: "success" },
  medium: { label: "Viabilidad media", tone: "warning" },
  low: { label: "Viabilidad baja", tone: "neutral" },
  insufficient_information: { label: "Informacion insuficiente", tone: "neutral" },
};

const routeCopy: Record<RecommendedRoute, string> = {
  no_action: "No iniciar accion por ahora",
  request_documents: "Solicitar documentos",
  administrative_claim: "Reclamacion administrativa",
  reliquidation_request: "Solicitud de reliquidacion",
  petition: "Derecho de peticion",
  lawsuit_draft: "Preparar demanda",
  professional_review: "Revision profesional",
};

const scenarioTypeCopy: Record<Scenario["scenarioType"], string> = {
  recognized_by_entity: "Reconocido por entidad",
  calculated_correct: "Calculado por Labora",
  alternative: "Alternativo",
  missing_documents: "Con soportes pendientes",
  user_claimed: "Reportado por usuario",
};

const severityCopy: Record<AnalysisInconsistency["severity"], { label: string; tone: Tone }> = {
  low: { label: "Baja", tone: "neutral" },
  medium: { label: "Media", tone: "warning" },
  high: { label: "Alta", tone: "danger" },
  critical: { label: "Critica", tone: "danger" },
};

const ruleResultCopy: Record<RuleResult, { label: string; tone: Tone }> = {
  passed: { label: "Aplicada", tone: "success" },
  failed: { label: "No cumple", tone: "danger" },
  not_applicable: { label: "No aplica", tone: "neutral" },
  warning: { label: "Advertencia", tone: "warning" },
  inconclusive: { label: "Inconclusa", tone: "warning" },
};

const confidenceCopy: Record<ConfidenceLevel, { label: string; tone: Tone }> = {
  high: { label: "Alta", tone: "success" },
  medium: { label: "Media", tone: "warning" },
  low: { label: "Baja", tone: "warning" },
  critical: { label: "Critica", tone: "danger" },
};

const blockedCopy: Record<
  FullAnalysisBlockedReason,
  { title: string; message: string; href: (caseId: string) => string; label: string }
> = {
  payment_required: {
    title: "El expediente necesita desbloqueo",
    message: "Para ver el analisis completo debes completar el pago.",
    href: (caseId) => `/app/cases/${caseId}/checkout`,
    label: "Ir al pago",
  },
  payment_pending: {
    title: "Pago pendiente de confirmacion",
    message: "Cuando el backend confirme el pago, habilitaremos el analisis completo.",
    href: (caseId) => `/app/cases/${caseId}/checkout`,
    label: "Ver estado de pago",
  },
  missing_documents: {
    title: "Faltan documentos",
    message: "Agrega los soportes solicitados antes de iniciar el analisis completo.",
    href: (caseId) => `/app/cases/${caseId}/documents`,
    label: "Agregar documentos",
  },
  validation_incomplete: {
    title: "Validacion incompleta",
    message: "Completa las validaciones pendientes para continuar.",
    href: (caseId) => `/app/cases/${caseId}/questionnaire`,
    label: "Completar datos",
  },
  consent_required: {
    title: "Autorizaciones pendientes",
    message: "Debes aceptar las autorizaciones requeridas.",
    href: () => "/app/consentimientos",
    label: "Ir a consentimientos",
  },
  case_not_ready: {
    title: "Expediente no listo",
    message: "El backend indica que falta informacion antes de iniciar.",
    href: (caseId) => `/app/cases/${caseId}`,
    label: "Volver al expediente",
  },
  unknown: {
    title: "Analisis bloqueado",
    message: "No podemos iniciar el analisis completo con el estado actual.",
    href: (caseId) => `/app/cases/${caseId}`,
    label: "Volver al expediente",
  },
};

function emitFullAnalysisEvent(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("labora:analytics", {
      detail: {
        event,
        payload,
      },
    }),
  );
}

export function formatMoney(value?: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatPercent(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return "No disponible";
  }

  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`;
}

function formatValue(value?: number, unit?: string) {
  if (value === undefined) {
    return "No disponible";
  }

  if (unit === "COP") {
    return `${formatMoney(value)} COP`;
  }

  if (unit === "weeks") {
    return `${new Intl.NumberFormat("es-CO", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value)} semanas`;
  }

  if (unit === "percentage") {
    return formatPercent(value);
  }

  return `${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 2,
  }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function formatUnknownValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "No disponible";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (Array.isArray(value)) {
    return value.map(formatUnknownValue).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
        variant === "primary" && "bg-labora-green text-white hover:bg-labora-deep",
        variant === "secondary" &&
          "border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory",
        variant === "ghost" &&
          "border border-transparent bg-transparent text-labora-deep hover:bg-labora-ivory",
      )}
    >
      {children}
    </Link>
  );
}

export function ActionButton({
  children,
  onClick,
  disabled,
  isLoading,
  variant = "primary",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-labora-green text-white hover:bg-labora-deep",
        variant === "secondary" &&
          "border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory",
      )}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: FullAnalysisStatus }) {
  const copy = statusCopy[status] || statusCopy.not_started;

  return (
    <ToneBadge tone={copy.tone}>
      {copy.tone === "progress" ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : copy.tone === "danger" ? (
        <XCircle className="h-4 w-4" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      )}
      {copy.label}
    </ToneBadge>
  );
}

export function FullAnalysisSkeleton() {
  return (
    <div className="grid gap-5" aria-live="polite" aria-busy="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <div className="h-4 w-32 animate-pulse rounded bg-labora-ui" />
          <div className="mt-4 h-7 w-2/3 animate-pulse rounded bg-labora-ui" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-labora-ui" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-labora-ui" />
        </div>
      ))}
    </div>
  );
}

export function CaseAnalysisHeader({
  caseId,
  analysis,
}: {
  caseId: string;
  analysis: FullAnalysis;
}) {
  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <nav
        aria-label="Ruta del analisis completo"
        className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-labora-gray"
      >
        <Link href="/app/cases" className="hover:text-labora-deep">
          Mis casos
        </Link>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/app/cases/${caseId}`} className="hover:text-labora-deep">
          {caseId}
        </Link>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-labora-green">Analisis completo</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
            <Scale className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Analisis completo
            </p>
            <h1 className="mt-2 max-w-4xl font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
              Analisis completo juridico y de calculo
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
              Reglas verificables, calculos trazables, escenarios comparados y
              confianza explicita para entender tu expediente.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <StatusBadge status={analysis.status} />
          {analysis.confidence ? (
            <ToneBadge tone={confidenceCopy[analysis.confidence.level].tone}>
              <Gauge className="h-4 w-4" aria-hidden="true" />
              Confianza {formatPercent(analysis.confidence.globalScore)}
            </ToneBadge>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function FullAnalysisTabs({
  caseId,
  activeTab,
}: {
  caseId: string;
  activeTab: FullAnalysisTab;
}) {
  return (
    <nav
      aria-label="Secciones del analisis completo"
      className="flex gap-2 overflow-x-auto rounded-2xl border border-labora-ui bg-white p-2 shadow-panel"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;

        return (
          <Link
            key={tab.id}
            href={`/app/cases/${caseId}/full-analysis?tab=${tab.id}`}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
              active
                ? "bg-labora-green text-white"
                : "text-labora-gray hover:bg-labora-ivory hover:text-labora-deep",
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ReadinessChecklist({
  items,
}: {
  items: FullAnalysisReadinessItem[];
}) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li
          key={item.key}
          className={cn(
            "flex gap-3 rounded-xl border p-3 text-sm leading-6",
            item.ready
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          {item.ready ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <span>
            <span className="block font-semibold">{item.label}</span>
            {item.description ? <span className="block">{item.description}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function FullAnalysisStartCard({
  analysis,
  caseId,
  onStart,
  isStarting,
  startError,
}: {
  analysis: FullAnalysis;
  caseId: string;
  onStart: () => void;
  isStarting?: boolean;
  startError?: string | null;
}) {
  const ready = analysis.readiness.every((item) => item.ready);
  const disabled = !ready || !analysis.canStart;

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
            <Layers3 className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Listo para ejecutar
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
              Analisis completo juridico y de calculo
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
              Tu expediente ya esta desbloqueado. Ahora ejecutaremos el motor
              juridico, motor de calculo, comparador de escenarios y evaluacion
              de confianza.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <ActionButton
            onClick={onStart}
            disabled={disabled}
            isLoading={isStarting}
            title={disabled ? "El backend aun no permite iniciar el analisis." : undefined}
          >
            <SearchCheck className="h-4 w-4" aria-hidden="true" />
            Iniciar analisis completo
          </ActionButton>
          <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al expediente
          </ButtonLink>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-labora-ui bg-labora-ivory p-5">
          <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
            Checklist de preparacion
          </h3>
          <div className="mt-4">
            <ReadinessChecklist items={analysis.readiness} />
          </div>
        </section>
        <section className="rounded-2xl border border-labora-mint bg-labora-mint/15 p-5 text-sm leading-6 text-labora-deep">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              Las estimaciones se muestran como posibles resultados, no como
              certeza absoluta. Podras revisar fuentes, reglas y calculos.
            </p>
          </div>
        </section>
      </div>

      {startError ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {startError}
        </p>
      ) : null}
    </section>
  );
}

export function AnalysisStepper({ analysis }: { analysis: FullAnalysis }) {
  return (
    <ol className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      {analysis.progress.steps.map((step) => (
        <li
          key={step.key}
          className={cn(
            "rounded-2xl border p-4 text-sm",
            step.status === "completed" && "border-emerald-200 bg-emerald-50 text-emerald-800",
            step.status === "active" && "border-labora-mint bg-labora-mint/20 text-labora-deep",
            step.status === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
            step.status === "error" && "border-red-200 bg-red-50 text-red-700",
            (step.status === "pending" || step.status === "blocked") &&
              "border-labora-ui bg-white text-labora-gray",
          )}
        >
          <span className="flex items-center gap-2">
            {stepIcon[step.status]}
            <span className="font-semibold">{step.label}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function FullAnalysisProcessing({
  analysis,
  caseId,
}: {
  analysis: FullAnalysis;
  caseId: string;
}) {
  return (
    <section className="space-y-5" aria-live="polite">
      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-mint/20 text-labora-deep">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                Procesando
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
                Estamos analizando tu caso
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
                Revisamos datos extraidos, reglas aplicables, calculos y posibles
                inconsistencias. Este proceso puede tardar unos minutos.
              </p>
            </div>
          </div>
          <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
            Volver al expediente
          </ButtonLink>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <AnalysisStepper analysis={analysis} />
          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
              Registro de procesamiento
            </h3>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-labora-gray">
              <li>Motor actual: {statusCopy[analysis.status].label}</li>
              <li>Paso actual: {analysis.progress.currentStep}</li>
              <li>Version del analisis: {analysis.version}</li>
            </ul>
          </section>
        </div>
        <aside className="space-y-5">
          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Progreso
            </p>
            <strong className="mt-3 block font-heading text-4xl text-labora-deep">
              {formatPercent(analysis.progress.percentage)}
            </strong>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-labora-ui">
              <div
                className="h-full rounded-full bg-labora-green transition-all"
                style={{ width: `${Math.max(0, Math.min(100, analysis.progress.percentage))}%` }}
              />
            </div>
          </section>
          <section className="rounded-2xl border border-labora-mint bg-labora-mint/15 p-5 text-sm leading-6 text-labora-deep">
            <div className="flex gap-3">
              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>
                El resultado sera estimado y trazable. No cierres necesariamente
                esta pantalla; tambien podras volver desde el expediente.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

export function FullAnalysisBlockedState({
  caseId,
  reason = "unknown",
}: {
  caseId: string;
  reason?: FullAnalysisBlockedReason;
}) {
  const copy = blockedCopy[reason] || blockedCopy.unknown;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-panel">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <AlertCircle className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-2xl font-semibold">{copy.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6">{copy.message}</p>
          </div>
        </div>
        <ButtonLink href={copy.href(caseId)} variant="secondary">
          {copy.label}
        </ButtonLink>
      </div>
    </section>
  );
}

export function FullAnalysisReviewState({
  analysis,
  caseId,
}: {
  analysis: FullAnalysis;
  caseId: string;
}) {
  const title = analysis.reviewGuidance?.title || "Este analisis requiere revision";
  const message =
    analysis.reviewGuidance?.message ||
    "El analisis no fallo, pero necesita validacion por baja confianza, contradicciones o documentos faltantes.";
  const reasons = analysis.reviewGuidance?.reasons.length
    ? analysis.reviewGuidance.reasons
    : analysis.confidence?.reasons || [];

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-panel">
      <div className="flex gap-3">
        <ShieldAlert className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-2xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6">{message}</p>
          {reasons.length ? (
            <ul className="mt-4 grid gap-2 text-sm leading-6">
              {reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {reason}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={`/app/cases/${caseId}/full-analysis?tab=confianza`} variant="secondary">
              Ver motivos
            </ButtonLink>
            <ButtonLink href={`/app/cases/${caseId}/documents`} variant="secondary">
              Agregar documentos
            </ButtonLink>
            <ButtonLink href={`/app/cases/${caseId}/professional-review`} variant="secondary">
              Solicitar revision profesional
            </ButtonLink>
            <ButtonLink href={`/app/cases/${caseId}`} variant="ghost">
              Volver al expediente
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FullAnalysisErrorState({
  caseId,
  message,
  onRetry,
  canRetry,
  isRetrying,
}: {
  caseId: string;
  message?: string | null;
  onRetry?: () => void;
  canRetry?: boolean;
  isRetrying?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-panel">
      <div className="flex gap-3">
        <XCircle className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-2xl font-semibold">
            Tuvimos un problema con el analisis
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6">
            {message || "No pudimos completar el analisis completo en este momento."}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {canRetry && onRetry ? (
              <ActionButton onClick={onRetry} isLoading={isRetrying}>
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Reintentar analisis
              </ActionButton>
            ) : null}
            <ButtonLink href="/contacto" variant="secondary">
              Contactar soporte
            </ButtonLink>
            <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
              Volver al expediente
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-gray">
            {label}
          </p>
          <div className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
            {value}
          </div>
        </div>
        <span className="text-labora-green">{icon}</span>
      </div>
      {helper ? <p className="mt-2 text-sm leading-6 text-labora-gray">{helper}</p> : null}
    </article>
  );
}

export function ExecutiveResultTab({
  analysis,
  caseId,
}: {
  analysis: FullAnalysis;
  caseId: string;
}) {
  const result = analysis.executiveResult;

  if (!result) {
    return (
      <EmptyPanel
        title="Aun no hay resultado ejecutivo"
        message="Cuando el backend complete el analisis, veras aqui la conclusion principal."
      />
    );
  }

  const resultMeta = resultCopy[result.resultStatus];
  const viability = viabilityCopy[result.viabilityLevel];

  return (
    <section className="space-y-5">
      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
              <Scale className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <ToneBadge tone={resultMeta.tone}>{resultMeta.label}</ToneBadge>
              <h2 className="mt-3 font-heading text-2xl font-semibold text-labora-charcoal">
                {result.mainFinding}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
                {resultMeta.message}
              </p>
            </div>
          </div>
          <ToneBadge tone={viability.tone}>{viability.label}</ToneBadge>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Ruta recomendada"
          value={routeCopy[result.recommendedRoute]}
          helper="Siguiente paso sugerido segun el analisis."
          icon={<ChevronRight className="h-5 w-5" aria-hidden="true" />}
        />
        <SummaryMetric
          label="Diferencia estimada"
          value={
            result.estimatedDifference === undefined
              ? "No disponible"
              : formatMoney(result.estimatedDifference, result.currency)
          }
          helper="Valor aproximado, sujeto a validacion."
          icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
        />
        <SummaryMetric
          label="Confianza global"
          value={analysis.confidence ? formatPercent(analysis.confidence.globalScore) : "N/D"}
          helper="Basada en documentos, datos y consistencia."
          icon={<Gauge className="h-5 w-5" aria-hidden="true" />}
        />
        <SummaryMetric
          label="Revision humana"
          value={analysis.confidence?.requiresHumanReview ? "Sugerida" : "No requerida"}
          helper="Puede cambiar si llegan nuevos soportes."
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
          Acciones siguientes
        </h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href={`/app/cases/${caseId}/full-analysis?tab=matriz`} variant="secondary">
            Ver matriz de inconsistencias
          </ButtonLink>
          <ButtonLink href={`/app/cases/${caseId}/full-analysis?tab=calculos`} variant="secondary">
            Ver calculos
          </ButtonLink>
          <ButtonLink href={`/app/cases/${caseId}/full-analysis?tab=reglas`} variant="secondary">
            Ver reglas activadas
          </ButtonLink>
          <ButtonLink href={`/app/cases/${caseId}/report`}>
            Continuar a informe
          </ButtonLink>
        </div>
      </section>
    </section>
  );
}

export function EmptyPanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-labora-mint bg-white p-8 text-center shadow-panel">
      <FileSearch className="mx-auto h-10 w-10 text-labora-green" aria-hidden="true" />
      <h2 className="mt-4 font-heading text-xl font-semibold text-labora-charcoal">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-labora-gray">
        {message}
      </p>
    </section>
  );
}

export function DataErrorPanel({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-panel">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold">
            No pudimos cargar esta seccion
          </h2>
          <p className="mt-2 text-sm leading-6">{message || "Intenta nuevamente."}</p>
          {onRetry ? (
            <div className="mt-4">
              <ActionButton onClick={onRetry} variant="secondary">
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Intentar nuevamente
              </ActionButton>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SourceRefsList({ refs }: { refs: SourceRef[] }) {
  if (!refs.length) {
    return <p className="text-sm text-labora-gray">Sin fuentes reportadas.</p>;
  }

  return (
    <ul className="grid gap-2">
      {refs.map((ref) => (
        <li
          key={`${ref.type}-${ref.id}`}
          className="rounded-lg border border-labora-ui bg-labora-ivory px-3 py-2 text-sm text-labora-gray"
        >
          <span className="font-semibold text-labora-charcoal">{ref.label}</span>
          <span className="ml-2 text-xs uppercase tracking-[0.12em]">{ref.type}</span>
        </li>
      ))}
    </ul>
  );
}

function WarningsList({ warnings }: { warnings: Array<{ code: string; message: string }> }) {
  if (!warnings.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <h3 className="font-semibold">Advertencias</h3>
      <ul className="mt-2 grid gap-2 text-sm leading-6">
        {warnings.map((warning) => (
          <li key={`${warning.code}-${warning.message}`} className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">{warning.code}:</span> {warning.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecordList({ values }: { values: Record<string, unknown> }) {
  const entries = Object.entries(values);

  if (!entries.length) {
    return <p className="text-sm text-labora-gray">Sin datos reportados.</p>;
  }

  return (
    <dl className="grid gap-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="grid gap-1 rounded-lg border border-labora-ui bg-labora-ivory px-3 py-2 sm:grid-cols-[160px,minmax(0,1fr)]"
        >
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
            {key}
          </dt>
          <dd className="break-words text-sm text-labora-charcoal">
            {formatUnknownValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DetailDrawer({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-labora-charcoal/30 p-4 sm:items-center sm:justify-end"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="max-h-[88vh] w-full overflow-y-auto rounded-2xl border border-labora-ui bg-white p-5 shadow-panel sm:max-w-xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui text-labora-gray hover:bg-labora-ivory"
            aria-label="Cerrar detalle"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

export function RulesTab({
  data,
  isLoading,
  error,
  onRetry,
  filter = "all",
  onFilterChange,
}: {
  data: Paginated<LegalRuleResult> | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  filter?: "all" | "applied" | "warnings" | "not_applicable" | "inconclusive" | "requires_review";
  onFilterChange?: (filter: "all" | "applied" | "warnings" | "not_applicable" | "inconclusive" | "requires_review") => void;
}) {
  const [selected, setSelected] = useState<LegalRuleResult | null>(null);

  if (isLoading) {
    return <FullAnalysisSkeleton />;
  }

  if (error) {
    return <DataErrorPanel message={error} onRetry={onRetry} />;
  }

  if (!data?.items.length) {
    return <EmptyPanel title="Sin reglas reportadas" message="El backend aun no envio reglas evaluadas." />;
  }

  const applied = data.items.filter((item) => item.result === "passed").length;
  const warnings = data.items.filter((item) => item.result === "warning").length;
  const review = data.items.filter((item) => item.requiresReview).length;

  function openRuleDetail(item: LegalRuleResult) {
    setSelected(item);
    emitFullAnalysisEvent("full_analysis_rule_detail_opened", {
      ruleId: item.id,
      ruleCode: item.ruleCode,
      result: item.result,
      requiresReview: item.requiresReview,
    });
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <SummaryMetric label="Reglas evaluadas" value={data.total} icon={<BookOpenCheck className="h-5 w-5" aria-hidden="true" />} />
        <SummaryMetric label="Aplicadas" value={applied} icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} />
        <SummaryMetric label="Requieren revision" value={review || warnings} icon={<ShieldAlert className="h-5 w-5" aria-hidden="true" />} />
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-labora-ui bg-white p-2 shadow-panel">
        {[
          ["all", "Todas"],
          ["applied", "Aplicadas"],
          ["warnings", "Advertencias"],
          ["not_applicable", "No aplicables"],
          ["inconclusive", "Inconclusas"],
          ["requires_review", "Requieren revision"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              onFilterChange?.(
                value as "all" | "applied" | "warnings" | "not_applicable" | "inconclusive" | "requires_review",
              )
            }
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center rounded-lg px-4 py-2 text-sm font-semibold transition",
              filter === value
                ? "bg-labora-green text-white"
                : "text-labora-gray hover:bg-labora-ivory hover:text-labora-deep",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-labora-ui bg-white shadow-panel md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3">Regla</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Resultado</th>
              <th className="px-4 py-3">Fuente/Dato</th>
              <th className="px-4 py-3">Confianza</th>
              <th className="px-4 py-3">Revision</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-t border-labora-ui">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openRuleDetail(item)}
                    className="text-left font-semibold text-labora-deep hover:text-labora-green"
                  >
                    {item.ruleName}
                  </button>
                  <p className="text-xs text-labora-gray">{item.ruleCode}</p>
                </td>
                <td className="px-4 py-3 text-labora-gray">{item.category}</td>
                <td className="px-4 py-3">
                  <ToneBadge tone={ruleResultCopy[item.result].tone}>
                    {ruleResultCopy[item.result].label}
                  </ToneBadge>
                </td>
                <td className="px-4 py-3 text-labora-gray">{item.sourceRefs[0]?.label || "Sin fuente"}</td>
                <td className="px-4 py-3 text-labora-gray">{formatPercent(item.confidence)}</td>
                <td className="px-4 py-3 text-labora-gray">{item.requiresReview ? "Si" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {data.items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-labora-charcoal">{item.ruleName}</h3>
                <p className="text-xs text-labora-gray">{item.ruleCode}</p>
              </div>
              <ToneBadge tone={ruleResultCopy[item.result].tone}>
                {ruleResultCopy[item.result].label}
              </ToneBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-labora-gray">{item.explanation}</p>
            <button
              type="button"
              onClick={() => openRuleDetail(item)}
              className="mt-3 text-sm font-semibold text-labora-deep hover:text-labora-green"
            >
              Ver detalle
            </button>
          </article>
        ))}
      </div>

      {selected ? (
        <DetailDrawer title={selected.ruleName} onClose={() => setSelected(null)}>
          <div className="grid gap-4 text-sm leading-6 text-labora-gray">
            <p>{selected.explanation}</p>
            <div className="flex flex-wrap gap-2">
              <ToneBadge tone={ruleResultCopy[selected.result].tone}>
                {ruleResultCopy[selected.result].label}
              </ToneBadge>
              {selected.requiresReview ? (
                <ToneBadge tone="warning">Requiere revision</ToneBadge>
              ) : null}
            </div>
            <p><strong className="text-labora-charcoal">Codigo:</strong> {selected.ruleCode}</p>
            <p><strong className="text-labora-charcoal">Version:</strong> {selected.version || "No reportada"}</p>
            <p><strong className="text-labora-charcoal">Categoria:</strong> {selected.category}</p>
            <p><strong className="text-labora-charcoal">Confianza:</strong> {formatPercent(selected.confidence)}</p>
            <div>
              <h3 className="font-semibold text-labora-charcoal">Fuentes y datos usados</h3>
              <div className="mt-2"><SourceRefsList refs={selected.sourceRefs} /></div>
            </div>
            <WarningsList warnings={selected.warnings} />
          </div>
        </DetailDrawer>
      ) : null}
    </section>
  );
}

export function CalculationsTab({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: Paginated<CalculationResult> | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const [selected, setSelected] = useState<CalculationResult | null>(null);

  function openCalculationDetail(item: CalculationResult) {
    setSelected(item);
    emitFullAnalysisEvent("full_analysis_calculation_detail_opened", {
      calculationId: item.id,
      calculationCode: item.calculationCode,
      type: item.type,
      unit: item.resultUnit,
    });
  }

  if (isLoading) {
    return <FullAnalysisSkeleton />;
  }

  if (error) {
    return <DataErrorPanel message={error} onRetry={onRetry} />;
  }

  if (!data?.items.length) {
    return <EmptyPanel title="Sin calculos reportados" message="El backend aun no envio calculos trazables." />;
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <SummaryMetric label="Calculos" value={data.total} icon={<Calculator className="h-5 w-5" aria-hidden="true" />} />
        <SummaryMetric label="Monetarios" value={data.items.filter((item) => item.resultUnit === "COP").length} icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />} />
        <SummaryMetric label="Con formula" value={data.items.filter((item) => item.formulaExpression).length} icon={<FileText className="h-5 w-5" aria-hidden="true" />} />
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-labora-ui bg-white shadow-panel md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3">Calculo</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Resultado</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Confianza</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-t border-labora-ui">
                <td className="px-4 py-3 font-semibold text-labora-charcoal">{item.name}</td>
                <td className="px-4 py-3 text-labora-gray">{item.type}</td>
                <td className="px-4 py-3 text-labora-gray">{formatValue(item.resultValue, item.resultUnit)}</td>
                <td className="px-4 py-3 text-labora-gray">{item.resultUnit || "N/D"}</td>
                <td className="px-4 py-3 text-labora-gray">{formatPercent(item.confidence)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openCalculationDetail(item)}
                    className="font-semibold text-labora-deep hover:text-labora-green"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {data.items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">{item.type}</p>
            <h3 className="mt-1 font-semibold text-labora-charcoal">{item.name}</h3>
            <strong className="mt-3 block font-heading text-2xl text-labora-deep">
              {formatValue(item.resultValue, item.resultUnit)}
            </strong>
            <p className="mt-2 text-sm text-labora-gray">Confianza {formatPercent(item.confidence)}</p>
            <button
              type="button"
              onClick={() => openCalculationDetail(item)}
              className="mt-3 text-sm font-semibold text-labora-deep hover:text-labora-green"
            >
              Ver detalle
            </button>
          </article>
        ))}
      </div>

      {selected ? (
        <DetailDrawer title={selected.name} onClose={() => setSelected(null)}>
          <div className="grid gap-4 text-sm leading-6 text-labora-gray">
            <p><strong className="text-labora-charcoal">Resultado:</strong> {formatValue(selected.resultValue, selected.resultUnit)}</p>
            <p><strong className="text-labora-charcoal">Codigo:</strong> {selected.calculationCode}</p>
            <p><strong className="text-labora-charcoal">Tipo:</strong> {selected.type}</p>
            <p><strong className="text-labora-charcoal">Confianza:</strong> {formatPercent(selected.confidence)}</p>
            <div className="rounded-xl border border-labora-ui bg-labora-ivory p-4">
              <h3 className="font-semibold text-labora-charcoal">Formula trazable</h3>
              <p className="mt-2 break-words font-mono text-xs text-labora-gray">
                {selected.formulaExpression || "No reportada"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-labora-charcoal">Valores de entrada</h3>
              <div className="mt-2"><RecordList values={selected.inputValues} /></div>
            </div>
            {selected.resultDetail ? (
              <div>
                <h3 className="font-semibold text-labora-charcoal">Detalle del resultado</h3>
                <div className="mt-2"><RecordList values={selected.resultDetail} /></div>
              </div>
            ) : null}
            <div>
              <h3 className="font-semibold text-labora-charcoal">Fuentes</h3>
              <div className="mt-2"><SourceRefsList refs={selected.sourceRefs} /></div>
            </div>
            <WarningsList warnings={selected.warnings} />
          </div>
        </DetailDrawer>
      ) : null}
    </section>
  );
}

export function ScenariosTab({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: { items: Scenario[] } | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return <FullAnalysisSkeleton />;
  }

  if (error) {
    return <DataErrorPanel message={error} onRetry={onRetry} />;
  }

  if (!data?.items.length) {
    return <EmptyPanel title="Sin escenarios reportados" message="El backend aun no envio escenarios comparables." />;
  }

  const maxDifference = data.items.reduce(
    (max, item) => Math.max(max, Math.abs(item.differenceVsRecognized || 0)),
    0,
  );
  const hasPendingSupports = data.items.some(
    (item) => item.scenarioType === "missing_documents" || item.warnings.length,
  );

  return (
    <section className="space-y-5">
      <section className="rounded-2xl border border-labora-mint bg-labora-mint/15 p-5 text-labora-deep shadow-panel">
        <div className="flex gap-3">
          <GitCompare className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Diferencia destacada: {formatMoney(maxDifference)} COP
            </h2>
            <p className="mt-2 text-sm leading-6">
              Los escenarios son estimados y pueden cambiar si llegan nuevos soportes.
            </p>
            {hasPendingSupports ? (
              <p className="mt-2 text-sm font-semibold">
                Hay escenarios o advertencias asociados a documentos pendientes.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="hidden overflow-hidden rounded-2xl border border-labora-ui bg-white shadow-panel md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3">Escenario</th>
              <th className="px-4 py-3">Semanas estimadas</th>
              <th className="px-4 py-3">Mesada/valor estimado</th>
              <th className="px-4 py-3">Retroactivo estimado</th>
              <th className="px-4 py-3">Diferencia</th>
              <th className="px-4 py-3">Confianza</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-t border-labora-ui">
                <td className="px-4 py-3">
                  <p className="font-semibold text-labora-charcoal">{item.name}</p>
                  <p className="text-xs text-labora-gray">{scenarioTypeCopy[item.scenarioType]}</p>
                </td>
                <td className="px-4 py-3 text-labora-gray">{formatValue(item.weeksEstimated, "weeks")}</td>
                <td className="px-4 py-3 text-labora-gray">{formatValue(item.amountEstimated, "COP")}</td>
                <td className="px-4 py-3 text-labora-gray">{formatValue(item.retroactiveEstimated, "COP")}</td>
                <td className="px-4 py-3 font-semibold text-labora-deep">{formatValue(item.differenceVsRecognized, "COP")}</td>
                <td className="px-4 py-3 text-labora-gray">{formatPercent(item.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {data.items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-green">
              {scenarioTypeCopy[item.scenarioType]}
            </p>
            <h3 className="mt-2 font-heading text-xl font-semibold text-labora-charcoal">
              {item.name}
            </h3>
            {item.description ? (
              <p className="mt-2 text-sm leading-6 text-labora-gray">{item.description}</p>
            ) : null}
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-labora-gray">Semanas</dt>
                <dd className="font-semibold text-labora-charcoal">{formatValue(item.weeksEstimated, "weeks")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-labora-gray">Valor</dt>
                <dd className="font-semibold text-labora-charcoal">{formatValue(item.amountEstimated, "COP")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-labora-gray">Retroactivo</dt>
                <dd className="font-semibold text-labora-charcoal">{formatValue(item.retroactiveEstimated, "COP")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-labora-gray">Diferencia</dt>
                <dd className="font-semibold text-labora-charcoal">{formatValue(item.differenceVsRecognized, "COP")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-labora-gray">Confianza</dt>
                <dd className="font-semibold text-labora-charcoal">{formatPercent(item.confidence)}</dd>
              </div>
            </dl>
            <WarningsList warnings={item.warnings} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function InconsistenciesTab({
  data,
  isLoading,
  error,
  onRetry,
  caseId,
}: {
  data: { items: AnalysisInconsistency[] } | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  caseId: string;
}) {
  const [selected, setSelected] = useState<AnalysisInconsistency | null>(null);

  function openInconsistencyDetail(item: AnalysisInconsistency) {
    setSelected(item);
    emitFullAnalysisEvent("full_analysis_inconsistency_detail_opened", {
      inconsistencyId: item.id,
      type: item.type,
      severity: item.severity,
    });
  }

  if (isLoading) {
    return <FullAnalysisSkeleton />;
  }

  if (error) {
    return <DataErrorPanel message={error} onRetry={onRetry} />;
  }

  if (!data?.items.length) {
    return <EmptyPanel title="Sin inconsistencias reportadas" message="El backend no reporto inconsistencias accionables." />;
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-5 md:grid-cols-4">
        {(["critical", "high", "medium", "low"] as const).map((severity) => (
          <SummaryMetric
            key={severity}
            label={severityCopy[severity].label}
            value={data.items.filter((item) => item.severity === severity).length}
            icon={<TriangleAlert className="h-5 w-5" aria-hidden="true" />}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-labora-ui bg-white shadow-panel lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3">Inconsistencia</th>
              <th className="px-4 py-3">Evidencia</th>
              <th className="px-4 py-3">Impacto economico</th>
              <th className="px-4 py-3">Impacto juridico</th>
              <th className="px-4 py-3">Documento faltante</th>
              <th className="px-4 py-3">Accion recomendada</th>
              <th className="px-4 py-3">Confianza</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-t border-labora-ui">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openInconsistencyDetail(item)}
                    className="text-left font-semibold text-labora-deep hover:text-labora-green"
                  >
                    {item.title}
                  </button>
                  <p className="text-xs text-labora-gray">{severityCopy[item.severity].label}</p>
                </td>
                <td className="px-4 py-3 text-labora-gray">{item.evidenceRefs[0]?.label || "Sin evidencia"}</td>
                <td className="px-4 py-3 text-labora-gray">{formatValue(item.economicImpactEstimated, "COP")}</td>
                <td className="px-4 py-3 text-labora-gray">{item.legalImpact || "No reportado"}</td>
                <td className="px-4 py-3 text-labora-gray">{item.missingDocuments[0] || "No reportado"}</td>
                <td className="px-4 py-3 text-labora-gray">
                  <span>{item.recommendedAction || "Por definir"}</span>
                  <button
                    type="button"
                    onClick={() => openInconsistencyDetail(item)}
                    className="mt-1 block font-semibold text-labora-deep hover:text-labora-green"
                  >
                    Ver detalle
                  </button>
                </td>
                <td className="px-4 py-3 text-labora-gray">{formatPercent(item.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {data.items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
            <ToneBadge tone={severityCopy[item.severity].tone}>
              {severityCopy[item.severity].label}
            </ToneBadge>
            <h3 className="mt-3 font-semibold text-labora-charcoal">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-labora-gray">{item.description}</p>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-labora-gray">Impacto economico</dt>
                <dd className="font-semibold text-labora-charcoal">
                  {formatValue(item.economicImpactEstimated, "COP")}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-labora-gray">Confianza</dt>
                <dd className="font-semibold text-labora-charcoal">{formatPercent(item.confidence)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => openInconsistencyDetail(item)}
              className="mt-3 text-sm font-semibold text-labora-deep hover:text-labora-green"
            >
              Ver detalle
            </button>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/app/cases/${caseId}/legal-actions`} variant="secondary">
          Ver acciones juridicas disponibles
        </ButtonLink>
        <ButtonLink href={`/app/cases/${caseId}/documents`} variant="secondary">
          Agregar soporte
        </ButtonLink>
      </div>

      {selected ? (
        <DetailDrawer title={selected.title} onClose={() => setSelected(null)}>
          <div className="grid gap-4 text-sm leading-6 text-labora-gray">
            <p>{selected.description}</p>
            <ToneBadge tone={severityCopy[selected.severity].tone}>
              Severidad {severityCopy[selected.severity].label}
            </ToneBadge>
            <p><strong className="text-labora-charcoal">Impacto juridico:</strong> {selected.legalImpact || "No reportado"}</p>
            <p><strong className="text-labora-charcoal">Impacto economico:</strong> {formatValue(selected.economicImpactEstimated, "COP")}</p>
            <p><strong className="text-labora-charcoal">Accion recomendada:</strong> {selected.recommendedAction || "Por definir"}</p>
            <div>
              <h3 className="font-semibold text-labora-charcoal">Documentos faltantes</h3>
              {selected.missingDocuments.length ? (
                <ul className="mt-2 grid gap-2">
                  {selected.missingDocuments.map((document) => (
                    <li key={document} className="rounded-lg border border-labora-ui bg-labora-ivory px-3 py-2">
                      {document}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">No reportado.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-labora-charcoal">Evidencias</h3>
              <div className="mt-2"><SourceRefsList refs={selected.evidenceRefs} /></div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {selected.relatedRuleId ? (
                <ButtonLink href={`/app/cases/${caseId}/full-analysis?tab=reglas`} variant="secondary">
                  Ver regla aplicada
                </ButtonLink>
              ) : null}
              {selected.relatedCalculationId ? (
                <ButtonLink href={`/app/cases/${caseId}/full-analysis?tab=calculos`} variant="secondary">
                  Ver calculo asociado
                </ButtonLink>
              ) : null}
              {selected.missingDocuments.length ? (
                <ButtonLink href={`/app/cases/${caseId}/documents`} variant="secondary">
                  Agregar soporte
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </DetailDrawer>
      ) : null}
    </section>
  );
}

export function ConfidenceTab({
  data,
  fallback,
  isLoading,
  error,
  onRetry,
}: {
  data: ConfidenceResponse | null;
  fallback?: FullAnalysis["confidence"];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return <FullAnalysisSkeleton />;
  }

  if (error) {
    return <DataErrorPanel message={error} onRetry={onRetry} />;
  }

  const confidence = data || (fallback
    ? {
        ...fallback,
        breakdown: [] as ConfidenceBreakdownItem[],
        warnings: [],
      }
    : null);

  if (!confidence) {
    return <EmptyPanel title="Sin confianza reportada" message="El backend aun no envio la evaluacion de confianza." />;
  }

  const meta = confidenceCopy[confidence.level];

  return (
    <section className="space-y-5">
      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="grid gap-5 lg:grid-cols-[240px,minmax(0,1fr)]">
          <div className="flex aspect-square flex-col items-center justify-center rounded-full border-[10px] border-labora-mint bg-labora-ivory text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-gray">
              Confianza
            </span>
            <strong className="mt-2 font-heading text-4xl text-labora-deep">
              {formatPercent(confidence.globalScore)}
            </strong>
            <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-labora-charcoal">
              Evaluacion de confianza
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              El analisis tiene confianza {meta.label.toLowerCase()} segun la calidad
              documental, datos validados y consistencia de reglas y calculos.
            </p>
            {confidence.requiresHumanReview ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                El analisis encontro informacion que debe revisarse con cuidado.
                Puedes agregar soportes o solicitar revision profesional.
              </div>
            ) : null}
            {confidence.reasons.length ? (
              <ul className="mt-4 grid gap-2 text-sm leading-6 text-labora-gray">
                {confidence.reasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
                    {reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      {confidence.breakdown.length ? (
        <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
            Desglose de confianza
          </h3>
          <div className="mt-4 grid gap-3">
            {confidence.breakdown.map((item) => (
              <article key={item.key} className="rounded-xl border border-labora-ui bg-labora-ivory p-4">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-semibold text-labora-charcoal">{item.label}</h4>
                  <ToneBadge tone={confidenceCopy[item.level].tone}>
                    {formatPercent(item.score)}
                  </ToneBadge>
                </div>
                {item.reasons.length ? (
                  <p className="mt-2 text-sm leading-6 text-labora-gray">{item.reasons.join(" ")}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <WarningsList warnings={confidence.warnings} />
    </section>
  );
}

export function FullAnalysisFooterMeta({ analysis }: { analysis: FullAnalysis }) {
  return (
    <p className="text-xs text-labora-gray">
      {analysis.completedAt
        ? `Completado ${formatDateTime(analysis.completedAt)}`
        : analysis.createdAt
          ? `Creado ${formatDateTime(analysis.createdAt)}`
          : null}
    </p>
  );
}

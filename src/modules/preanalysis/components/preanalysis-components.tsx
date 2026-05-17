"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  FileSearch,
  FileText,
  FileUp,
  Info,
  ListChecks,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  Scale,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/src/modules/cases/utils/caseFormatters";
import { usePreAnalysisStatus } from "@/src/modules/preanalysis/hooks/usePreAnalysis";
import type {
  BlockedReason,
  IssueSeverity,
  MissingDocumentDto,
  MissingDocumentPriority,
  PreAnalysisCtaDto,
  PreAnalysisResultDto,
  PreAnalysisReviewGuidanceDto,
  PreAnalysisWarningDto,
  PreAnalysisStatus,
  PreIssueDto,
  TrafficLight,
  ViabilityLevel,
} from "@/src/modules/preanalysis/api/preanalysis.types";

type Tone = "success" | "warning" | "danger" | "neutral" | "progress";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-labora-ui bg-white text-labora-gray",
  progress: "border-labora-mint bg-labora-mint/20 text-labora-deep",
};

const toneDotClasses: Record<Tone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-labora-gray",
  progress: "bg-labora-green",
};

export const trafficLightCopy: Record<
  TrafficLight,
  { title: string; description: string; tone: Tone }
> = {
  green: {
    title: "Sin senales criticas preliminares",
    description:
      "No encontramos alertas criticas con la informacion disponible. El analisis completo puede validar calculos y fundamentos.",
    tone: "success",
  },
  yellow: {
    title: "Hay senales que merecen revision",
    description:
      "Podrian existir inconsistencias o puntos que necesitan validacion adicional antes de una conclusion completa.",
    tone: "warning",
  },
  red: {
    title: "Se detectaron senales relevantes",
    description:
      "Hay indicios preliminares o informacion insuficiente critica que amerita un analisis mas profundo.",
    tone: "danger",
  },
  gray: {
    title: "Informacion insuficiente",
    description:
      "El expediente requiere soportes adicionales para clasificar mejor el resultado preliminar.",
    tone: "neutral",
  },
};

export const viabilityCopy: Record<
  ViabilityLevel,
  { label: string; description: string; tone: Tone }
> = {
  high: {
    label: "Viabilidad preliminar alta",
    description: "Hay senales iniciales consistentes para revisar el caso en detalle.",
    tone: "success",
  },
  medium: {
    label: "Viabilidad preliminar media",
    description: "Hay indicios utiles, pero el expediente necesita validaciones adicionales.",
    tone: "warning",
  },
  low: {
    label: "Viabilidad preliminar baja",
    description: "Con la informacion actual no se observan senales fuertes.",
    tone: "neutral",
  },
  insufficient: {
    label: "Informacion insuficiente",
    description: "Aun faltan datos o soportes para estimar una viabilidad preliminar.",
    tone: "neutral",
  },
};

const severityCopy: Record<IssueSeverity, { label: string; tone: Tone }> = {
  low: { label: "Leve", tone: "neutral" },
  medium: { label: "Media", tone: "warning" },
  high: { label: "Alta", tone: "danger" },
};

const priorityCopy: Record<
  MissingDocumentPriority,
  { label: string; description: string; tone: Tone }
> = {
  required: {
    label: "Requerido",
    description: "Puede bloquear el avance si el backend lo marca como obligatorio.",
    tone: "danger",
  },
  recommended: {
    label: "Recomendado",
    description: "Ayuda a mejorar la precision del analisis.",
    tone: "warning",
  },
  optional: {
    label: "Opcional",
    description: "Puede aportar contexto adicional.",
    tone: "neutral",
  },
};

const blockedReasonCopy: Record<
  BlockedReason,
  { title: string; description: string; actionLabel: string; actionHref: (caseId: string) => string }
> = {
  missing_consent: {
    title: "Autorizaciones pendientes",
    description: "Debes aceptar las autorizaciones requeridas antes de continuar.",
    actionLabel: "Ir a consentimientos",
    actionHref: () => "/app/consentimientos",
  },
  missing_main_document: {
    title: "Documento principal pendiente",
    description: "Necesitamos tu historia laboral o documento principal.",
    actionLabel: "Subir documento",
    actionHref: (caseId) => `/app/cases/${caseId}/documents`,
  },
  document_rejected: {
    title: "Documento no apto",
    description: "El documento cargado no fue apto para analisis.",
    actionLabel: "Revisar documentos",
    actionHref: (caseId) => `/app/cases/${caseId}/documents`,
  },
  extraction_not_ready: {
    title: "Lectura documental en proceso",
    description: "Estamos terminando de leer tus documentos.",
    actionLabel: "Ver validacion documental",
    actionHref: (caseId) => `/app/cases/${caseId}/documents`,
  },
  questionnaire_required: {
    title: "Preguntas pendientes",
    description: "Falta completar algunas preguntas del caso.",
    actionLabel: "Completar preguntas",
    actionHref: (caseId) => `/app/cases/${caseId}/questionnaire`,
  },
  case_not_found: {
    title: "Expediente no encontrado",
    description: "No encontramos este expediente o ya no esta disponible.",
    actionLabel: "Volver a expedientes",
    actionHref: () => "/app/cases",
  },
  permission_denied: {
    title: "Sin permiso para continuar",
    description: "No tienes permiso para ver o modificar este expediente.",
    actionLabel: "Volver a expedientes",
    actionHref: () => "/app/cases",
  },
  unknown: {
    title: "Preanalisis bloqueado",
    description: "No podemos iniciar el preanalisis con el estado actual del expediente.",
    actionLabel: "Volver al expediente",
    actionHref: (caseId) => `/app/cases/${caseId}`,
  },
};

const reviewFallbackCopy = {
  title: "Tu preanalisis necesita una revision adicional",
  message:
    "Estamos revisando la informacion disponible. Puedes ayudar agregando documentos claros y completando los datos clave del caso.",
};

function normalizeComparableText(value?: string) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getReviewActionHref(code: string, caseId: string) {
  const normalizedCode = normalizeComparableText(code);

  if (
    normalizedCode.includes("questionnaire") ||
    normalizedCode.includes("pregunta") ||
    normalizedCode.includes("cuestionario")
  ) {
    return `/app/cases/${caseId}/questionnaire`;
  }

  if (
    normalizedCode.includes("document") ||
    normalizedCode.includes("soporte") ||
    normalizedCode.includes("upload") ||
    normalizedCode.includes("carga")
  ) {
    return `/app/cases/${caseId}/documents`;
  }

  if (
    normalizedCode.includes("case") ||
    normalizedCode.includes("expediente") ||
    normalizedCode.includes("data") ||
    normalizedCode.includes("dato")
  ) {
    return `/app/cases/${caseId}/edit`;
  }

  return undefined;
}

function getReviewPrimaryHref(
  caseId: string,
  guidance?: PreAnalysisReviewGuidanceDto,
) {
  const actionHref = guidance?.actions
    .map((action) => getReviewActionHref(action.code, caseId))
    .find(Boolean);

  return actionHref || `/app/cases/${caseId}/documents`;
}

function isDuplicateReviewWarning(
  warning: PreAnalysisWarningDto,
  guidance?: PreAnalysisReviewGuidanceDto,
) {
  if (!guidance) {
    return false;
  }

  const warningMessage = normalizeComparableText(warning.message);
  const guidanceTitle = normalizeComparableText(guidance.title);
  const guidanceMessage = normalizeComparableText(guidance.message);

  return [guidanceTitle, guidanceMessage].some(
    (text) =>
      text &&
      warningMessage &&
      (text === warningMessage ||
        text.includes(warningMessage) ||
        warningMessage.includes(text)),
  );
}

function getVisibleReviewWarnings(result: PreAnalysisResultDto) {
  return result.warnings.filter(
    (warning) => !isDuplicateReviewWarning(warning, result.reviewGuidance),
  );
}

function shouldShowLowConfidenceHint(guidance?: PreAnalysisReviewGuidanceDto) {
  if (guidance?.reasonCode !== "low_confidence") {
    return false;
  }

  const text = normalizeComparableText(`${guidance.title} ${guidance.message}`);
  const mentionsConfidence = text.includes("confianza");
  const mentionsMissingInfo =
    text.includes("informacion") ||
    text.includes("documento") ||
    text.includes("soporte") ||
    text.includes("dato");

  return !(mentionsConfidence && mentionsMissingInfo);
}

function formatPercent(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "No disponible";
  }

  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`;
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-labora-ui bg-white p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
        {label}
      </dt>
      <dd className="mt-2 break-words font-heading text-2xl font-semibold text-labora-charcoal">
        {value}
      </dd>
      {helper ? <p className="mt-1 text-xs leading-5 text-labora-gray">{helper}</p> : null}
    </div>
  );
}

function ButtonLink({
  href,
  children,
  variant = "primary",
  onClick,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
}) {
  const className = {
    primary:
      "bg-labora-green text-white hover:bg-labora-deep focus:ring-labora-green",
    secondary:
      "border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory focus:ring-labora-green",
    ghost:
      "border border-transparent bg-transparent text-labora-deep hover:bg-labora-ivory focus:ring-labora-green",
  }[variant];

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function IconBadge({
  tone,
  children,
}: {
  tone: Tone;
  children: ReactNode;
}) {
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

export function ConfidenceBadge({ confidence }: { confidence?: number | null }) {
  if (confidence === undefined || confidence === null) {
    return null;
  }

  return (
    <IconBadge tone="progress">
      <SearchCheck className="h-4 w-4" aria-hidden="true" />
      Confianza {formatPercent(confidence)}
    </IconBadge>
  );
}

export function LockedDetailBadge() {
  return (
    <IconBadge tone="neutral">
      <LockKeyhole className="h-4 w-4" aria-hidden="true" />
      Detalle disponible en analisis completo
    </IconBadge>
  );
}

export function PreAnalysisWarningBox() {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      <div className="flex gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          Este es un resultado preliminar. El analisis completo incluye calculo,
          fundamentos, validaciones y reporte tecnico despues del desbloqueo.
        </p>
      </div>
    </section>
  );
}

export function PreAnalysisProgressTracker({
  status,
  progress,
  currentStep,
}: {
  status: PreAnalysisStatus;
  progress?: number;
  currentStep?: string;
}) {
  const steps = [
    "Expediente recibido",
    "Documentos revisados",
    "Senales iniciales detectadas",
    "Resultado preliminar preparado",
  ];
  const percent =
    progress ?? (status === "completed" ? 100 : status === "in_progress" ? 62 : 28);
  const activeIndex = Math.min(steps.length - 1, Math.floor((percent / 100) * steps.length));

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Avance del preanalisis
          </h2>
          <p className="mt-1 text-sm leading-6 text-labora-gray">
            {currentStep || "Estamos revisando la informacion del expediente."}
          </p>
        </div>
        <div className="rounded-xl border border-labora-mint bg-labora-mint/20 px-4 py-3 text-labora-deep">
          <span className="text-xs font-semibold uppercase tracking-[0.12em]">
            Progreso
          </span>
          <strong className="ml-2 font-heading text-xl">{formatPercent(percent)}</strong>
        </div>
      </div>
      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-labora-ui"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label="Progreso del preanalisis"
      >
        <div
          className="h-full rounded-full bg-labora-green transition-all"
          style={{ width: `${Math.max(8, Math.min(100, percent))}%` }}
        />
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-4">
        {steps.map((step, index) => {
          const completed = index < activeIndex || status === "completed";
          const current = index === activeIndex && status !== "completed";
          return (
            <li
              key={step}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-sm",
                completed && "border-emerald-200 bg-emerald-50 text-emerald-800",
                current && "border-labora-mint bg-labora-mint/20 text-labora-deep",
                !completed && !current && "border-labora-ui bg-labora-ivory text-labora-gray",
              )}
              aria-current={current ? "step" : undefined}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white",
                  completed && "border-emerald-200 text-emerald-700",
                  current && "border-labora-green text-labora-green",
                  !completed && !current && "border-labora-ui text-labora-gray",
                )}
              >
                {completed ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                {current ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {!completed && !current ? <Circle className="h-3 w-3" aria-hidden="true" /> : null}
              </span>
              <span className="font-semibold leading-5">{step}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function PreAnalysisProcessing({
  caseId,
  result,
  onTerminalStatus,
}: {
  caseId: string;
  result: PreAnalysisResultDto;
  onTerminalStatus: () => void;
}) {
  const statusResource = usePreAnalysisStatus(caseId, true);
  const terminalRefreshRequested = useRef(false);
  const status = statusResource.data?.status || result.status;
  const progress = statusResource.data?.progress ?? result.progress;
  const currentStep = statusResource.data?.currentStep || result.currentStep;

  useEffect(() => {
    const isTerminal =
      status === "completed" ||
      status === "blocked" ||
      status === "requires_review" ||
      status === "error";

    if (!terminalRefreshRequested.current && isTerminal) {
      terminalRefreshRequested.current = true;
      onTerminalStatus();
    }
  }, [onTerminalStatus, status]);

  return (
    <section className="space-y-5" aria-live="polite">
      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-labora-mint bg-labora-mint/20 text-labora-deep">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                IA preliminar
              </p>
              <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
                Estamos preparando tu analisis preliminar
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
                Revisamos tus documentos y respuestas para detectar senales iniciales.
              </p>
            </div>
          </div>
          {statusResource.isRefreshing ? (
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-labora-ui bg-labora-ivory px-3 py-1 text-xs font-semibold text-labora-gray">
              <RefreshCcw className="h-4 w-4 animate-spin" aria-hidden="true" />
              Actualizando
            </span>
          ) : null}
        </div>
      </section>

      <PreAnalysisProgressTracker
        status={status}
        progress={progress}
        currentStep={currentStep}
      />

      {statusResource.error ? (
        <PreAnalysisWarningBox />
      ) : (
        <section className="rounded-2xl border border-labora-ui bg-labora-ivory p-5 text-sm leading-6 text-labora-gray">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
            <p>
              Este resultado sera preliminar. El analisis completo se desbloquea
              despues del pago.
            </p>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al expediente
        </ButtonLink>
      </div>
    </section>
  );
}

export function TrafficLightCard({
  trafficLight = "gray",
  confidence,
}: {
  trafficLight?: TrafficLight;
  confidence?: number | null;
}) {
  const copy = trafficLightCopy[trafficLight];

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div
          className={cn(
            "flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border",
            toneClasses[copy.tone],
          )}
          aria-label={`Semaforo preliminar: ${copy.title}`}
        >
          {(["green", "yellow", "red"] as const).map((light) => (
            <span
              key={light}
              className={cn(
                "h-4 w-4 rounded-full border border-white/70",
                light === trafficLight
                  ? toneDotClasses[copy.tone]
                  : "bg-labora-ui",
              )}
            />
          ))}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Semaforo preliminar
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">{copy.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <IconBadge tone={copy.tone}>
              <Scale className="h-4 w-4" aria-hidden="true" />
              Resultado no definitivo
            </IconBadge>
            <ConfidenceBadge confidence={confidence} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PreliminaryViabilityCard({
  viabilityLevel = "insufficient",
}: {
  viabilityLevel?: ViabilityLevel;
}) {
  const copy = viabilityCopy[viabilityLevel];

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
            toneClasses[copy.tone],
          )}
        >
          <SearchCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Viabilidad
          </p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
            {copy.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">{copy.description}</p>
        </div>
      </div>
    </section>
  );
}

export function ValueDetectedBanner({
  valueDetected,
}: {
  valueDetected?: PreAnalysisResultDto["valueDetected"];
}) {
  const value = valueDetected || {
    title: "Encontramos senales iniciales en tu expediente",
    summary:
      "El preanalisis detecto puntos que pueden revisarse con mayor profundidad al desbloquear el analisis completo.",
  };

  return (
    <section className="rounded-2xl border border-labora-mint bg-labora-deep p-5 text-white shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/12 text-labora-mint">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-mint">
              Valor detectado
            </p>
            <h2 className="mt-1 font-heading text-xl font-semibold">{value.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/78">
              {value.summary}
            </p>
          </div>
        </div>
        <LockKeyhole className="hidden h-6 w-6 text-labora-mint sm:block" aria-hidden="true" />
      </div>
    </section>
  );
}

export function PreIssueCard({ issue }: { issue: PreIssueDto }) {
  const severity = severityCopy[issue.severity];

  return (
    <article className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
              toneClasses[severity.tone],
            )}
          >
            <FileSearch className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
              {issue.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              {issue.publicSummary}
            </p>
          </div>
        </div>
        <IconBadge tone={severity.tone}>{severity.label}</IconBadge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ConfidenceBadge confidence={issue.confidence} />
        {issue.lockedDetailAvailable ? <LockedDetailBadge /> : null}
      </div>
    </article>
  );
}

export function PreIssuesList({ issues }: { issues: PreIssueDto[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <TriangleAlert className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Hallazgos parciales
        </h2>
      </div>
      {issues.length ? (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <PreIssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      ) : (
        <section className="rounded-2xl border border-labora-ui bg-white p-5 text-sm leading-6 text-labora-gray shadow-panel">
          No encontramos hallazgos parciales para mostrar con la informacion actual.
          El analisis completo puede validar mas fuentes y calculos.
        </section>
      )}
    </section>
  );
}

export function MissingDocumentItem({
  document,
  caseId,
  onMissingDocumentClick,
}: {
  document: MissingDocumentDto;
  caseId: string;
  onMissingDocumentClick?: (document: MissingDocumentDto) => void;
}) {
  const priority = priorityCopy[document.priority];
  const isResolved = document.status === "uploaded" || document.status === "not_applicable";

  return (
    <li className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
              isResolved ? toneClasses.success : toneClasses[priority.tone],
            )}
          >
            {isResolved ? (
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            ) : (
              <FileText className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
              {document.title}
            </h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
              {document.documentType}
            </p>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              {document.reason || priority.description}
            </p>
          </div>
        </div>
        <IconBadge tone={isResolved ? "success" : priority.tone}>
          {isResolved ? "Resuelto" : priority.label}
        </IconBadge>
      </div>
      {!isResolved ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <ButtonLink
            href={`/app/cases/${caseId}/documents`}
            onClick={() => onMissingDocumentClick?.(document)}
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Subir documento
          </ButtonLink>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            Lo subire despues
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            No aplica
          </button>
        </div>
      ) : null}
    </li>
  );
}

export function MissingDocumentsList({
  documents,
  caseId,
  onMissingDocumentClick,
}: {
  documents: MissingDocumentDto[];
  caseId: string;
  onMissingDocumentClick?: (document: MissingDocumentDto) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Documentos faltantes
        </h2>
      </div>
      {documents.length ? (
        <ul className="grid gap-4">
          {documents.map((document) => (
            <MissingDocumentItem
              key={document.id}
              document={document}
              caseId={caseId}
              onMissingDocumentClick={onMissingDocumentClick}
            />
          ))}
        </ul>
      ) : (
        <section className="rounded-2xl border border-labora-ui bg-white p-5 text-sm leading-6 text-labora-gray shadow-panel">
          No hay documentos faltantes reportados para este preanalisis.
        </section>
      )}
    </section>
  );
}

export function PreAnalysisCTAAside({
  caseId,
  cta,
  missingDocumentsCount,
  onUnlockClick,
  onMissingDocsClick,
}: {
  caseId: string;
  cta?: PreAnalysisCtaDto;
  missingDocumentsCount: number;
  onUnlockClick?: () => void;
  onMissingDocsClick?: () => void;
}) {
  return (
    <aside className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel xl:sticky xl:top-6">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Siguiente paso
          </p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
            {cta?.label || "Desbloquear analisis completo"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            {cta?.description ||
              "Accede al calculo, fundamentos, informe completo y siguientes pasos del expediente."}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <ButtonLink href={`/app/cases/${caseId}/paywall`} onClick={onUnlockClick}>
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          Desbloquear analisis completo
        </ButtonLink>
        <ButtonLink href={`/app/cases/${caseId}/preview`} variant="secondary">
          <FileSearch className="h-4 w-4" aria-hidden="true" />
          Ver vista previa bloqueada
        </ButtonLink>
        {missingDocumentsCount ? (
          <ButtonLink
            href={`/app/cases/${caseId}/documents`}
            variant="secondary"
            onClick={onMissingDocsClick}
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Subir documentos faltantes
          </ButtonLink>
        ) : null}
        <ButtonLink href={`/app/cases/${caseId}`} variant="ghost">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al expediente
        </ButtonLink>
      </div>
    </aside>
  );
}

function MetricsGrid({ result }: { result: PreAnalysisResultDto }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Completitud"
        value={formatPercent(result.completionScore)}
        helper="Que tan listo esta el expediente."
      />
      <MetricCard
        label="Confianza"
        value={formatPercent(result.confidence)}
        helper="Estimacion preliminar del modelo."
      />
      <MetricCard
        label="Tipo preliminar"
        value={result.preliminaryCaseType || "Por validar"}
        helper="Clasificacion inicial no definitiva."
      />
      <MetricCard
        label="Hallazgos"
        value={String(result.issues.length)}
        helper="Senales publicas, sin detalle tecnico."
      />
    </dl>
  );
}

export function PreAnalysisResult({
  result,
  caseId,
  onUnlockClick,
  onMissingDocumentClick,
}: {
  result: PreAnalysisResultDto;
  caseId: string;
  onUnlockClick?: () => void;
  onMissingDocumentClick?: (document?: MissingDocumentDto) => void;
}) {
  return (
    <section className="space-y-5">
      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
          Resultado preliminar
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
          Tu resultado preliminar esta listo
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
          Encontramos senales iniciales en tu expediente sin revelar calculos,
          fundamentos completos ni estrategia juridica definitiva.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <TrafficLightCard
            trafficLight={result.trafficLight}
            confidence={result.confidence}
          />
          <ValueDetectedBanner valueDetected={result.valueDetected} />
          <div className="xl:hidden">
            <PreAnalysisCTAAside
              caseId={caseId}
              cta={result.cta}
              missingDocumentsCount={result.missingDocuments.length}
              onUnlockClick={onUnlockClick}
              onMissingDocsClick={() => onMissingDocumentClick?.()}
            />
          </div>
          <MetricsGrid result={result} />
          <PreliminaryViabilityCard viabilityLevel={result.viabilityLevel} />
          {result.limitedSummary ? (
            <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
              <div className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
                  <FileSearch className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
                    Resumen limitado
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-labora-gray">
                    {result.limitedSummary}
                  </p>
                </div>
              </div>
            </section>
          ) : null}
          <PreIssuesList issues={result.issues} />
          <MissingDocumentsList
            documents={result.missingDocuments}
            caseId={caseId}
            onMissingDocumentClick={(document) => onMissingDocumentClick?.(document)}
          />
          {result.warnings.length ? (
            <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Advertencias del preanalisis
              </h2>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-labora-gray">
                {result.warnings.map((warning) => (
                  <li key={warning.code} className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                    {warning.message}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <PreAnalysisWarningBox />
          {result.completedAt ? (
            <p className="text-xs text-labora-gray">
              Preparado {formatDateTime(result.completedAt)}
            </p>
          ) : null}
        </div>

        <div className="hidden xl:block">
          <PreAnalysisCTAAside
            caseId={caseId}
            cta={result.cta}
            missingDocumentsCount={result.missingDocuments.length}
            onUnlockClick={onUnlockClick}
            onMissingDocsClick={() => onMissingDocumentClick?.()}
          />
        </div>
      </div>
    </section>
  );
}

export function PreAnalysisBlockedState({
  caseId,
  reason = "unknown",
}: {
  caseId: string;
  reason?: BlockedReason;
}) {
  const copy = blockedReasonCopy[reason] || blockedReasonCopy.unknown;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-panel">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-800">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
              Preanalisis bloqueado
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
              {copy.description}
            </p>
          </div>
        </div>
        <ButtonLink href={copy.actionHref(caseId)}>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          {copy.actionLabel}
        </ButtonLink>
      </div>
    </section>
  );
}

export function PreAnalysisReviewState({
  caseId,
  result,
}: {
  caseId: string;
  result: PreAnalysisResultDto;
}) {
  const guidance = result.reviewGuidance;
  const title = guidance?.title || reviewFallbackCopy.title;
  const message = guidance?.message || reviewFallbackCopy.message;
  const isLowConfidence = guidance?.reasonCode === "low_confidence";
  const primaryHref = getReviewPrimaryHref(caseId, guidance);
  const documentsHref = `/app/cases/${caseId}/documents`;
  const questionnaireHref = `/app/cases/${caseId}/questionnaire`;
  const editHref = `/app/cases/${caseId}/edit`;
  const visibleWarnings = getVisibleReviewWarnings(result);

  return (
    <section className="space-y-5">
      <section className="rounded-2xl border border-labora-mint bg-white p-6 shadow-panel">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-mint/20 text-labora-deep">
            {isLowConfidence ? (
              <SearchCheck className="h-6 w-6" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              {isLowConfidence ? "Informacion por completar" : "Revision adicional"}
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
              {message}
            </p>
            {shouldShowLowConfidenceHint(guidance) ? (
              <p className="mt-3 max-w-3xl rounded-xl border border-labora-mint bg-labora-mint/10 p-3 text-sm leading-6 text-labora-deep">
                Agregar documentos claros y completar datos clave ayuda a
                aumentar la confianza del preanalisis.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href={primaryHref}>
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            Completar informacion del caso
          </ButtonLink>
          {primaryHref !== documentsHref ? (
            <ButtonLink href={documentsHref} variant="secondary">
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Subir documentos
            </ButtonLink>
          ) : null}
          {primaryHref !== questionnaireHref ? (
            <ButtonLink href={questionnaireHref} variant="secondary">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Completar cuestionario
            </ButtonLink>
          ) : null}
          {primaryHref !== editHref ? (
            <ButtonLink href={editHref} variant="secondary">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Editar expediente
            </ButtonLink>
          ) : null}
          <ButtonLink href={`/app/cases/${caseId}`} variant="ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al expediente
          </ButtonLink>
        </div>
      </section>

      {guidance?.actions.length ? (
        <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Pasos recomendados
              </h2>
              <ol className="mt-3 grid gap-3">
                {guidance.actions.map((action, index) => (
                  <li
                    key={`${action.code}-${index}`}
                    className="flex gap-3 rounded-xl border border-labora-ui bg-labora-ivory/60 p-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
                    <div>
                      <h3 className="text-sm font-semibold text-labora-charcoal">
                        {action.label}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-labora-gray">
                        {action.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      ) : null}

      {visibleWarnings.length ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-panel">
          <h2 className="font-heading text-lg font-semibold">
            Advertencias del preanalisis
          </h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6">
            {visibleWarnings.map((warning, index) => (
              <li key={`${warning.code}-${index}`} className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {warning.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-labora-ui bg-labora-ivory p-5 text-sm leading-6 text-labora-gray">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
          <p>
            Puedes volver a intentar el preanalisis cuando agregues o actualices
            la informacion del expediente.
          </p>
        </div>
      </section>
    </section>
  );
}

export function PreAnalysisErrorState({
  caseId,
  message,
  onRetry,
  isRetrying,
}: {
  caseId: string;
  message?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-panel">
      <div className="flex gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white">
          <XCircle className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">
            Error recuperable
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold">
            No pudimos generar el preanalisis
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6">
            {message || "Intentalo nuevamente o vuelve al expediente."}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRetrying ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            )}
            Reintentar
          </button>
        ) : null}
        <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
          Volver al expediente
        </ButtonLink>
        <ButtonLink href="/contacto" variant="secondary">
          Contactar soporte
        </ButtonLink>
      </div>
    </section>
  );
}

export function PreAnalysisEmptyState({
  caseId,
  onStart,
  isStarting,
  error,
}: {
  caseId: string;
  onStart: () => void;
  isStarting?: boolean;
  error?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-labora-mint bg-white p-8 text-center shadow-panel">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-labora-ivory text-labora-green">
        <FileSearch className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mt-5 font-heading text-2xl font-semibold text-labora-charcoal">
        Aun no has generado tu analisis preliminar
      </h1>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-labora-gray">
        Podemos revisar tus documentos y respuestas para mostrar senales
        iniciales sin revelar calculos completos ni informe tecnico final.
      </p>
      {error ? (
        <p className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isStarting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          Iniciar preanalisis gratuito
        </button>
        <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
          Volver al expediente
        </ButtonLink>
      </div>
    </section>
  );
}

export function PreAnalysisStatusGuard({
  caseId,
  result,
  error,
  onStart,
  onRetry,
  onRefresh,
  onUnlockClick,
  onMissingDocumentClick,
  isStarting,
  isRetrying,
  startError,
  retryError,
}: {
  caseId: string;
  result: PreAnalysisResultDto;
  error?: string | null;
  onStart: () => void;
  onRetry: () => void;
  onRefresh: () => void;
  onUnlockClick?: () => void;
  onMissingDocumentClick?: (document?: MissingDocumentDto) => void;
  isStarting?: boolean;
  isRetrying?: boolean;
  startError?: string | null;
  retryError?: string | null;
}) {
  if (error) {
    return (
      <PreAnalysisErrorState
        caseId={caseId}
        message={error}
        onRetry={onRefresh}
      />
    );
  }

  if (result.status === "not_started") {
    return (
      <PreAnalysisEmptyState
        caseId={caseId}
        onStart={onStart}
        isStarting={isStarting}
        error={startError}
      />
    );
  }

  if (result.status === "queued" || result.status === "in_progress") {
    return (
      <PreAnalysisProcessing
        caseId={caseId}
        result={result}
        onTerminalStatus={onRefresh}
      />
    );
  }

  if (result.status === "completed") {
    return (
      <PreAnalysisResult
        result={result}
        caseId={caseId}
        onUnlockClick={onUnlockClick}
        onMissingDocumentClick={onMissingDocumentClick}
      />
    );
  }

  if (result.status === "blocked") {
    return <PreAnalysisBlockedState caseId={caseId} reason={result.blockedReason} />;
  }

  if (result.status === "requires_review") {
    return <PreAnalysisReviewState caseId={caseId} result={result} />;
  }

  return (
    <PreAnalysisErrorState
      caseId={caseId}
      message={retryError || result.warnings[0]?.message}
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  );
}

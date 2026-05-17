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
  Clock3,
  FileCheck2,
  FileSearch,
  FileText,
  HelpCircle,
  Info,
  Loader2,
  LockKeyhole,
  MessageCircle,
  RefreshCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  AlertLevel,
  LockedFeature,
  PreviewState,
  PreviewStatus,
} from "@/src/modules/paywall-preview/api/preview.types";

type Tone = "success" | "warning" | "danger" | "neutral" | "progress";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-labora-ui bg-white text-labora-gray",
  progress: "border-labora-mint bg-labora-mint/20 text-labora-deep",
};

const statusCopy: Record<PreviewStatus, { label: string; tone: Tone }> = {
  not_started: { label: "No iniciada", tone: "neutral" },
  in_progress: { label: "En preparacion", tone: "progress" },
  completed: { label: "Vista previa lista", tone: "success" },
  blocked: { label: "Bloqueada", tone: "warning" },
  requires_review: { label: "Requiere revision", tone: "warning" },
  error: { label: "Con error", tone: "danger" },
};

const alertCopy: Record<AlertLevel, { label: string; tone: Tone }> = {
  low: { label: "Alerta baja", tone: "success" },
  medium: { label: "Alerta media", tone: "warning" },
  high: { label: "Alerta alta", tone: "danger" },
  unknown: { label: "Por validar", tone: "neutral" },
};

function formatPercent(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return "No disponible";
  }

  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`;
}

function percentValue(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return 0;
  }

  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  return Math.round(Math.max(0, Math.min(100, normalized)));
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-labora-green text-white hover:bg-labora-deep",
        variant === "secondary" &&
          "border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory",
        className,
      )}
    >
      {children}
    </button>
  );
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
        variant === "primary" &&
          "bg-labora-green text-white hover:bg-labora-deep",
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

function ToneBadge({
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

function StatusBadge({ status }: { status: PreviewStatus }) {
  const copy = statusCopy[status] || statusCopy.not_started;

  return (
    <ToneBadge tone={copy.tone}>
      {copy.tone === "progress" ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      )}
      {copy.label}
    </ToneBadge>
  );
}

export function PreviewHeader({
  caseId,
  caseCode,
  title,
  status,
  isUnlocked,
}: {
  caseId: string;
  caseCode?: string;
  title: string;
  status: PreviewStatus;
  isUnlocked: boolean;
}) {
  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <nav
        aria-label="Ruta del expediente"
        className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-labora-gray"
      >
        <Link href="/app/cases" className="hover:text-labora-deep">
          Expedientes
        </Link>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/app/cases/${caseId}`} className="hover:text-labora-deep">
          {caseCode || caseId}
        </Link>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-labora-green">Vista previa</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
            {isUnlocked ? (
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            ) : (
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Resultado preliminar
            </p>
            <h1 className="mt-2 max-w-4xl font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
              Encontramos senales preliminares que pueden ayudarte a decidir si
              vale la pena desbloquear el analisis completo.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <StatusBadge status={status} />
          <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al expediente
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

export function LimitedSummaryCard({
  title,
  limitedText,
  mainFindingTeaser,
  hiddenValueHint,
  alertLevel = "unknown",
  confidenceScore,
  requiresHumanReview,
}: {
  title: string;
  limitedText: string;
  mainFindingTeaser?: string;
  hiddenValueHint?: string;
  alertLevel?: AlertLevel;
  confidenceScore?: number;
  requiresHumanReview?: boolean;
}) {
  const alert = alertCopy[alertLevel] || alertCopy.unknown;
  const lowConfidence =
    confidenceScore !== undefined && percentValue(confidenceScore) < 60;

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Resumen preliminar
            </p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              {limitedText}
            </p>
            {mainFindingTeaser ? (
              <div className="mt-4 rounded-xl border border-labora-mint bg-labora-mint/20 p-4 text-sm leading-6 text-labora-deep">
                <strong className="font-semibold">Indicio preliminar: </strong>
                {mainFindingTeaser}
              </div>
            ) : null}
            {hiddenValueHint ? (
              <div className="mt-4 rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray">
                {hiddenValueHint}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-56 lg:justify-end">
          <ToneBadge tone={alert.tone}>
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {alert.label}
          </ToneBadge>
          {confidenceScore !== undefined ? (
            <ToneBadge tone={lowConfidence ? "warning" : "progress"}>
              <FileSearch className="h-4 w-4" aria-hidden="true" />
              Confianza {formatPercent(confidenceScore)}
            </ToneBadge>
          ) : null}
          {requiresHumanReview ? (
            <ToneBadge tone="warning">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              Revision humana sugerida
            </ToneBadge>
          ) : null}
        </div>
      </div>

      {lowConfidence ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          La confianza automatica es limitada. Este resultado debe validarse con
          soporte documental antes de tomar decisiones.
        </div>
      ) : null}
    </section>
  );
}

export function CompletionScoreCard({
  completionScore,
  label = "Completitud del expediente",
  missingItems = [],
}: {
  completionScore?: number;
  label?: string;
  missingItems?: string[];
}) {
  const percent = percentValue(completionScore);

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
            <FileCheck2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Completitud
            </p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
              {label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Este indicador mide que tan listo esta el expediente para una
              revision mas profunda.
            </p>
          </div>
        </div>
        <strong className="font-heading text-3xl font-semibold text-labora-deep">
          {completionScore === undefined ? "N/D" : `${percent}%`}
        </strong>
      </div>

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-labora-ui"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completionScore === undefined ? undefined : percent}
      >
        <div
          className="h-full rounded-full bg-labora-green transition-all"
          style={{ width: `${completionScore === undefined ? 16 : Math.max(8, percent)}%` }}
        />
      </div>

      {missingItems.length ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Elementos que pueden mejorar la revision
          </p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-900">
            {missingItems.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-2">
                <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function LockedReportPreview({
  sections,
  isUnlocked,
  onSectionClick,
}: {
  sections: string[];
  isUnlocked: boolean;
  onSectionClick?: (section: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Informe completo
          </p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
            Vista bloqueada del resultado
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-labora-gray">
            Esta seccion forma parte del analisis completo. Podras verla
            despues de desbloquear el informe.
          </p>
        </div>
        <ToneBadge tone={isUnlocked ? "success" : "neutral"}>
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          {isUnlocked ? "Desbloqueado" : "Bloqueado"}
        </ToneBadge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => onSectionClick?.(section)}
            className="group min-h-36 rounded-xl border border-labora-ui bg-labora-ivory p-4 text-left transition hover:border-labora-mint hover:bg-labora-mint/10 focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-base font-semibold text-labora-charcoal">
                  {section}
                </h3>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">
                  Contenido protegido
                </p>
              </div>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-labora-green"
                aria-label="Contenido bloqueado"
              >
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-5 grid gap-2 blur-[2px]" aria-hidden="true">
              <span className="h-3 rounded bg-labora-ui" />
              <span className="h-3 w-10/12 rounded bg-labora-ui" />
              <span className="h-3 w-7/12 rounded bg-labora-ui" />
            </div>
            <p className="mt-4 text-xs font-medium text-labora-gray">
              Este bloque se desbloquea con el analisis completo.
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function LockedFeatureList({
  features,
  onFeatureClick,
}: {
  features: LockedFeature[];
  onFeatureClick?: (feature: LockedFeature) => void;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Entregables al desbloquear
        </h2>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {features.map((feature) => (
          <button
            key={feature.key}
            type="button"
            onClick={() => onFeatureClick?.(feature)}
            className={cn(
              "rounded-xl border p-4 text-left transition hover:border-labora-mint hover:bg-labora-mint/10 focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
              feature.isHighlighted
                ? "border-labora-mint bg-labora-mint/15"
                : "border-labora-ui bg-white",
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-labora-ivory text-labora-green">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-base font-semibold text-labora-charcoal">
                  {feature.title}
                </h3>
                {feature.description ? (
                  <p className="mt-1 text-sm leading-6 text-labora-gray">
                    {feature.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-labora-green">
                  Disponible con analisis completo
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function FreeVsPaidComparison({
  free,
  paid,
  onViewed,
}: {
  free: string[];
  paid: string[];
  onViewed?: () => void;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewed = useRef(false);
  const rowCount = Math.max(free.length, paid.length);

  useEffect(() => {
    if (!onViewed || viewed.current) {
      return;
    }

    const target = sectionRef.current;

    if (!target || typeof IntersectionObserver === "undefined") {
      viewed.current = true;
      onViewed();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewed.current) {
          viewed.current = true;
          onViewed();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [onViewed]);

  return (
    <section
      ref={sectionRef}
      className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel"
    >
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Gratis vs completo
        </h2>
      </div>

      <div className="mt-5 hidden overflow-hidden rounded-xl border border-labora-ui sm:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-labora-ivory text-labora-charcoal">
            <tr>
              <th className="px-4 py-3 font-heading text-base font-semibold">
                Gratis
              </th>
              <th className="border-l border-labora-ui px-4 py-3 font-heading text-base font-semibold">
                Completo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui">
            {Array.from({ length: rowCount }).map((_, index) => (
              <tr key={index}>
                <td className="px-4 py-3 align-top text-labora-gray">
                  {free[index] ? (
                    <span className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
                      {free[index]}
                    </span>
                  ) : null}
                </td>
                <td className="border-l border-labora-ui px-4 py-3 align-top text-labora-deep">
                  {paid[index] ? (
                    <span className="flex gap-2 font-medium">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
                      {paid[index]}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-3 sm:hidden">
        <div className="rounded-xl border border-labora-ui bg-labora-ivory p-4">
          <h3 className="font-heading text-base font-semibold text-labora-charcoal">
            Gratis
          </h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-labora-gray">
            {free.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-labora-mint bg-labora-mint/15 p-4">
          <h3 className="font-heading text-base font-semibold text-labora-charcoal">
            Completo
          </h3>
          <ul className="mt-3 grid gap-2 text-sm font-medium leading-6 text-labora-deep">
            {paid.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function PaywallCTA({
  label,
  priceLabel,
  disclaimer,
  isLoading,
  onClick,
}: {
  label: string;
  priceLabel?: string;
  disclaimer: string;
  isLoading?: boolean;
  onClick: () => void;
}) {
  return (
    <section className="fixed inset-x-0 bottom-0 z-40 border-t border-labora-ui bg-white/95 p-4 shadow-panel backdrop-blur md:sticky md:top-6 md:rounded-2xl md:border md:p-5">
      <div className="mx-auto max-w-6xl md:max-w-none">
        <div className="flex gap-3">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green md:flex">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Analisis completo
            </p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-labora-charcoal">
              {priceLabel ? `Desbloquea por ${priceLabel}` : "Desbloquea el informe completo"}
            </h2>
            <p className="mt-2 hidden text-sm leading-6 text-labora-gray md:block">
              {disclaimer}
            </p>
          </div>
        </div>
        <ActionButton onClick={onClick} disabled={isLoading} className="mt-4 w-full">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          )}
          {label}
        </ActionButton>
        <p className="mt-2 text-xs leading-5 text-labora-gray md:hidden">
          {disclaimer}
        </p>
      </div>
    </section>
  );
}

export function UnlockConfirmationModal({
  open,
  priceLabel,
  features,
  disclaimer,
  onCancel,
  onConfirm,
  isSubmitting,
  error,
}: {
  open: boolean;
  priceLabel?: string;
  features: LockedFeature[];
  disclaimer: string;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    focusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
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
  }, [onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-labora-charcoal/45 p-0 sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar desbloqueo"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-labora-ui bg-white p-5 shadow-panel sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Confirmacion de desbloqueo
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
              {priceLabel ? `Desbloquear por ${priceLabel}` : "Desbloquear analisis completo"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-labora-gray transition hover:bg-labora-ivory hover:text-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-labora-ui bg-labora-ivory p-4">
          <p className="text-sm font-semibold text-labora-charcoal">
            Al pagar se desbloquea:
          </p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-labora-gray">
            {features.slice(0, 5).map((feature) => (
              <li key={feature.key} className="flex gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
                {feature.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{disclaimer}</p>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <ActionButton
            onClick={onCancel}
            disabled={isSubmitting}
            variant="secondary"
          >
            Volver a la vista previa
          </ActionButton>
          <ActionButton onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            )}
            Ir a pagar
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function LoadingPreviewState({
  title,
  isRefreshing,
}: {
  title: string;
  isRefreshing?: boolean;
}) {
  const steps = [
    "Revisando datos preliminares",
    "Preparando resumen",
    "Validando informacion sensible",
  ];

  return (
    <section className="space-y-5" aria-live="polite">
      <div className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-labora-mint bg-labora-mint/20 text-labora-deep">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                Vista previa
              </p>
              <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
                Estamos organizando una muestra limitada sin exponer el informe
                completo.
              </p>
            </div>
          </div>
          {isRefreshing ? (
            <ToneBadge tone="progress">
              <RefreshCcw className="h-4 w-4 animate-spin" aria-hidden="true" />
              Actualizando
            </ToneBadge>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex gap-3 rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm font-semibold text-labora-charcoal"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-labora-mint bg-white text-labora-green">
                {index === 0 ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4" aria-hidden="true">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="h-4 w-40 animate-pulse rounded bg-labora-ui" />
            <div className="mt-4 h-5 w-64 max-w-full animate-pulse rounded bg-labora-ui" />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="h-10 animate-pulse rounded bg-labora-ui" />
              <div className="h-10 animate-pulse rounded bg-labora-ui" />
              <div className="h-10 animate-pulse rounded bg-labora-ui" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StateShell({
  tone,
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  tone: Tone;
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border p-6 shadow-panel", toneClasses[tone])}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-white/80">
            {icon}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6">{description}</p>
          </div>
        </div>
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

export function PreviewStateView({
  state,
  caseId,
  message,
  code,
  onRetry,
  isRefreshing,
}: {
  state: PreviewState;
  caseId?: string;
  message?: string | null;
  code?: string;
  onRetry?: () => void;
  isRefreshing?: boolean;
}) {
  if (state === "loading") {
    return <LoadingPreviewState title="Preparando tu vista previa" />;
  }

  if (state === "in_progress") {
    return (
      <LoadingPreviewState
        title="Estamos preparando tu vista previa"
        isRefreshing={isRefreshing}
      />
    );
  }

  if (state === "not_started") {
    return (
      <StateShell
        tone="neutral"
        eyebrow="Vista previa"
        title="Aun no hay una vista previa disponible"
        description={message || "El expediente necesita completar pasos previos antes de mostrar una muestra confiable."}
        icon={<FileSearch className="h-6 w-6" aria-hidden="true" />}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          {caseId ? (
            <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver al expediente
            </ButtonLink>
          ) : null}
          {onRetry ? (
            <ActionButton onClick={onRetry} variant="secondary">
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </ActionButton>
          ) : null}
        </div>
      </StateShell>
    );
  }

  if (state === "requires_review") {
    return (
      <StateShell
        tone="warning"
        eyebrow="Revision adicional"
        title="Tu caso requiere una validacion adicional"
        description="Tu caso requiere una validacion adicional antes de mostrar una vista previa confiable."
        icon={<ShieldAlert className="h-6 w-6" aria-hidden="true" />}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          {caseId ? (
            <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Ver estado del expediente
            </ButtonLink>
          ) : null}
          <ButtonLink href="/contacto" variant="secondary">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Contactar soporte
          </ButtonLink>
        </div>
      </StateShell>
    );
  }

  if (state === "blocked") {
    return (
      <StateShell
        tone="warning"
        eyebrow="Vista previa bloqueada"
        title="No podemos mostrar la vista previa todavia"
        description={message || "El expediente tiene una condicion pendiente antes de continuar."}
        icon={<LockKeyhole className="h-6 w-6" aria-hidden="true" />}
      >
        {code ? (
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em]">
            Codigo: {code}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          {caseId ? (
            <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
              Volver al expediente
            </ButtonLink>
          ) : null}
          {code === "CONSENT_REQUIRED" ? (
            <ButtonLink href="/app/consentimientos">
              Ir a consentimientos
            </ButtonLink>
          ) : null}
        </div>
      </StateShell>
    );
  }

  if (state === "unlocked") {
    return (
      <StateShell
        tone="success"
        eyebrow="Analisis desbloqueado"
        title="Tu analisis completo ya esta desbloqueado"
        description="Puedes entrar a los entregables disponibles para este expediente."
        icon={<ShieldCheck className="h-6 w-6" aria-hidden="true" />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {caseId ? (
            <>
              <ButtonLink href={`/app/cases/${caseId}/full-analysis`}>
                <FileSearch className="h-4 w-4" aria-hidden="true" />
                Ver analisis completo
              </ButtonLink>
              <ButtonLink href={`/app/cases/${caseId}/report`} variant="secondary">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Informe completo
              </ButtonLink>
              <ButtonLink href={`/app/cases/${caseId}/documents`} variant="secondary">
                <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                Matriz y soportes
              </ButtonLink>
            </>
          ) : null}
        </div>
      </StateShell>
    );
  }

  return (
    <StateShell
      tone="danger"
      eyebrow="Error"
      title="No pudimos cargar la vista previa"
      description={message || "Intentalo nuevamente o vuelve al expediente."}
      icon={<XCircle className="h-6 w-6" aria-hidden="true" />}
    >
      {code ? (
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em]">
          Codigo: {code}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        {onRetry ? (
          <ActionButton onClick={onRetry}>
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </ActionButton>
        ) : null}
        {caseId ? (
          <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
            Volver al expediente
          </ButtonLink>
        ) : null}
        <ButtonLink href="/contacto" variant="secondary">
          Contactar soporte
        </ButtonLink>
      </div>
    </StateShell>
  );
}

export function PreviewEthicalDisclaimer() {
  return (
    <section className="rounded-2xl border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray">
      <div className="flex gap-3">
        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
        <p>
          El resultado es una ayuda de analisis y puede requerir revision
          profesional. Labora no promete exito judicial, reconocimiento
          administrativo ni montos garantizados.
        </p>
      </div>
    </section>
  );
}

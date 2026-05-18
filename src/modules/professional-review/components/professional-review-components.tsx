"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileCheck2,
  FileText,
  History,
  Info,
  Loader2,
  LockKeyhole,
  MessageCircle,
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRoundCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { FieldError, InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import type {
  ApproveReviewBody,
  CreateReviewCommentBody,
  ProfessionalReviewDetail,
  ProfessionalReviewListItem,
  RequestClientActionBody,
  RequestProfessionalReviewForm,
  RequestedDocument,
  ReviewAuditEvent,
  ReviewComment,
  ReviewCommentType,
  ReviewCommentVisibility,
  ReviewPriority,
  ReviewTargetType,
  ReviewType,
  ReviewedFile,
  UploadRequestedDocumentBody,
  UploadReviewedFileBody,
} from "@/src/modules/professional-review/api/professional-review.types";

export const reviewStatusCopy: Record<
  ProfessionalReviewDetail["status"],
  { label: string; message: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }
> = {
  not_started: {
    label: "No iniciada",
    message: "Aun no hay una solicitud de revision profesional para este expediente.",
    tone: "neutral",
  },
  payment_pending: {
    label: "Pago pendiente",
    message: "Tu revision esta pendiente de pago.",
    tone: "warning",
  },
  requested: {
    label: "Solicitada",
    message: "Recibimos tu solicitud de revision.",
    tone: "info",
  },
  queued: {
    label: "En cola",
    message: "Estamos asignando un abogado revisor.",
    tone: "info",
  },
  assigned: {
    label: "Asignada",
    message: "Tu revision ya fue asignada.",
    tone: "info",
  },
  in_review: {
    label: "En revision",
    message: "El abogado esta revisando tu documento.",
    tone: "info",
  },
  changes_requested: {
    label: "Correcciones",
    message: "Hay observaciones o ajustes en curso.",
    tone: "warning",
  },
  client_action_required: {
    label: "Accion requerida",
    message: "Necesitamos que subas informacion adicional.",
    tone: "warning",
  },
  ready_for_approval: {
    label: "Lista para aprobar",
    message: "La revision esta en aprobacion final.",
    tone: "info",
  },
  approved: {
    label: "Aprobada",
    message: "La version revisada fue aprobada.",
    tone: "success",
  },
  completed: {
    label: "Finalizada",
    message: "Tu version final revisada esta disponible.",
    tone: "success",
  },
  rejected: {
    label: "Rechazada",
    message: "No fue posible emitir una revision final con la informacion actual.",
    tone: "danger",
  },
  cancelled: {
    label: "Cancelada",
    message: "La revision fue cancelada.",
    tone: "neutral",
  },
  blocked: {
    label: "Bloqueada",
    message: "Hay una situacion que requiere atencion del equipo.",
    tone: "danger",
  },
  error: {
    label: "Error",
    message: "Ocurrio un problema temporal.",
    tone: "danger",
  },
};

export const reviewPriorityCopy: Record<ReviewPriority, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const reviewTypeCopy: Record<ReviewType, string> = {
  report_review: "Revision de informe",
  legal_draft_review: "Revision de escrito",
  lawsuit_draft_review: "Revision de demanda",
  claim_review: "Revision de reclamacion",
  petition_review: "Revision de peticion",
  calculation_review: "Revision de calculo",
  full_case_review: "Revision integral",
};

export const targetTypeCopy: Record<ReviewTargetType, string> = {
  report: "Informe",
  legal_draft: "Escrito juridico",
  generated_file: "Archivo generado",
  case_result: "Resultado del expediente",
  calculation: "Calculo",
};

const commentTypeCopy: Record<ReviewCommentType, string> = {
  general: "General",
  legal_observation: "Observacion juridica",
  correction_request: "Solicitud de correccion",
  missing_document: "Documento faltante",
  risk_alert: "Alerta de riesgo",
  approval_note: "Nota de aprobacion",
};

const visibilityCopy: Record<ReviewCommentVisibility, string> = {
  internal: "Interno",
  client_visible: "Visible para cliente",
  lawyer_only: "Solo abogado",
  admin_only: "Solo admin",
};

const timelineStatuses: ProfessionalReviewDetail["status"][] = [
  "requested",
  "payment_pending",
  "queued",
  "assigned",
  "in_review",
  "client_action_required",
  "ready_for_approval",
  "completed",
];

function toneClasses(tone: "neutral" | "info" | "success" | "warning" | "danger") {
  return {
    neutral: "border-labora-ui bg-labora-ivory text-labora-gray",
    info: "border-sky-200 bg-sky-50 text-sky-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-700",
  }[tone];
}

function statusIcon(status: ProfessionalReviewDetail["status"]) {
  if (status === "completed" || status === "approved") {
    return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  }

  if (status === "rejected" || status === "blocked" || status === "error") {
    return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
  }

  if (status === "payment_pending") {
    return <WalletCards className="h-4 w-4" aria-hidden="true" />;
  }

  if (status === "client_action_required") {
    return <UploadCloud className="h-4 w-4" aria-hidden="true" />;
  }

  return <CalendarClock className="h-4 w-4" aria-hidden="true" />;
}

export function formatReviewDate(value?: string) {
  if (!value) {
    return "Sin fecha";
  }

  try {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatReviewBytes(value?: number) {
  if (!value) {
    return "Sin tamano";
  }

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function trackProfessionalReviewEvent(
  event: string,
  payload: Record<string, unknown>,
) {
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

export function reviewHasAction(
  review: Pick<ProfessionalReviewDetail, "availableActions">,
  action: string,
) {
  return review.availableActions.includes(action);
}

export function ReviewStatusBadge({
  status,
}: {
  status: ProfessionalReviewDetail["status"];
}) {
  const meta = reviewStatusCopy[status];

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses(meta.tone),
      )}
    >
      {statusIcon(status)}
      {meta.label}
    </span>
  );
}

export function ReviewPriorityBadge({ priority }: { priority: ReviewPriority }) {
  const className =
    priority === "urgent" || priority === "high"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : priority === "low"
        ? "border-labora-ui bg-labora-ivory text-labora-gray"
        : "border-labora-green/20 bg-labora-mint/30 text-labora-deep";

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-semibold",
        className,
      )}
    >
      Prioridad {reviewPriorityCopy[priority]}
    </span>
  );
}

export function ReviewSkeleton() {
  return (
    <section className="grid gap-5">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </section>
  );
}

export function ReviewEmptyState({
  title = "No tienes revisiones por ahora.",
  message = "Cuando exista una revision profesional, aparecera aqui.",
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
      <div className="flex gap-3">
        <Search className="mt-1 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">{message}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function ReviewErrorState({
  message = "No pudimos cargar la revision profesional.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertCircle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-lg font-semibold">Revision no disponible</h2>
            <p className="mt-1 text-sm leading-6">{message}</p>
          </div>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function ProfessionalReviewCTA({
  caseId,
  targetType,
  targetId,
  recommended = false,
  requiresReview = false,
  riskLevel,
  available = true,
}: {
  caseId: string;
  targetType: ReviewTargetType;
  targetId: string;
  recommended?: boolean;
  requiresReview?: boolean;
  riskLevel?: string;
  available?: boolean;
}) {
  useEffect(() => {
    trackProfessionalReviewEvent("professional_review_cta_viewed", {
      caseId,
      targetType,
      targetId,
      recommended,
      requiresReview,
      riskLevel,
      actorRole: "client",
    });
  }, [caseId, recommended, requiresReview, riskLevel, targetId, targetType]);

  const href = `/app/cases/${caseId}/professional-review/request?targetType=${targetType}&targetId=${targetId}`;

  return (
    <section className="rounded-2xl border border-labora-green/25 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <UserRoundCheck className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap gap-2">
              {requiresReview ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  Obligatoria
                </span>
              ) : recommended ? (
                <span className="rounded-full border border-labora-green/20 bg-labora-mint/30 px-3 py-1 text-xs font-semibold text-labora-deep">
                  Recomendada
                </span>
              ) : (
                <span className="rounded-full border border-labora-ui bg-labora-ivory px-3 py-1 text-xs font-semibold text-labora-gray">
                  Opcional
                </span>
              )}
              {riskLevel ? (
                <span className="rounded-full border border-labora-ui bg-white px-3 py-1 text-xs font-semibold text-labora-gray">
                  Riesgo {riskLevel}
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 font-heading text-xl font-semibold text-labora-charcoal">
              Quieres que un abogado revise este documento?
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
              Un profesional puede revisar el informe o escrito antes de que descargues la version final. La IA apoya el analisis, pero la revision humana agrega una capa adicional de validacion juridica.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {available ? (
            <Link
              href={href}
              onClick={() =>
                trackProfessionalReviewEvent("professional_review_cta_clicked", {
                  caseId,
                  targetType,
                  targetId,
                  actorRole: "client",
                })
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Solicitar revision
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-ui px-4 py-2 text-sm font-semibold text-labora-gray"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              No disponible
            </button>
          )}
          <Link
            href={`/app/cases/${caseId}/professional-review#scope`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Ver que incluye
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ReviewStatusTimeline({
  status,
}: {
  status: ProfessionalReviewDetail["status"];
}) {
  const activeIndex = Math.max(
    0,
    timelineStatuses.findIndex((item) => item === status),
  );

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Avance de la revision
        </h2>
      </div>
      <ol className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        {timelineStatuses.map((item, index) => {
          const done = index < activeIndex || status === "completed";
          const current = item === status;
          const meta = reviewStatusCopy[item];

          return (
            <li
              key={item}
              className={cn(
                "rounded-lg border p-3 text-sm",
                done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : current
                    ? "border-labora-green bg-labora-mint/30 text-labora-deep"
                    : "border-labora-ui bg-labora-ivory text-labora-gray",
              )}
            >
              <span className="flex items-center gap-2 font-semibold">
                {done ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : current ? (
                  <Loader2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                )}
                {meta.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function ReviewPaymentCard({
  review,
}: {
  review: Pick<
    ProfessionalReviewDetail,
    "caseId" | "status" | "requiresPayment" | "paymentOrderId"
  >;
}) {
  if (!review.requiresPayment) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 shadow-panel">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-lg font-semibold">No requiere pago adicional</h2>
            <p className="mt-1 text-sm leading-6">
              La revision puede continuar sin checkout adicional.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const paid = review.status !== "payment_pending";

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <WalletCards className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Pago de revision profesional
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              La revision iniciara cuando el pago sea confirmado por el flujo de pagos existente.
            </p>
            <dl className="mt-4 grid gap-2 text-sm">
              <div>
                <dt className="font-semibold text-labora-charcoal">Estado</dt>
                <dd className="mt-1 text-labora-gray">
                  {paid ? "Pago confirmado o en validacion" : "Pendiente de pago"}
                </dd>
              </div>
              {review.paymentOrderId ? (
                <div>
                  <dt className="font-semibold text-labora-charcoal">Orden</dt>
                  <dd className="mt-1 text-labora-gray">{review.paymentOrderId}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
        <Link
          href={`/app/cases/${review.caseId}/checkout?source=professional-review`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep"
        >
          <WalletCards className="h-4 w-4" aria-hidden="true" />
          {paid ? "Ver pago" : "Pagar revision"}
        </Link>
      </div>
    </section>
  );
}

export type ReviewRequestErrors = Partial<
  Record<keyof RequestProfessionalReviewForm, string>
>;

export function ReviewRequestModal({
  values,
  errors,
  isSubmitting,
  submitError,
  onChange,
  onSubmit,
}: {
  values: RequestProfessionalReviewForm;
  errors: ReviewRequestErrors;
  isSubmitting: boolean;
  submitError?: string | null;
  onChange: <TField extends keyof RequestProfessionalReviewForm>(
    field: TField,
    value: RequestProfessionalReviewForm[TField],
  ) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Solicitud de revision
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
            Revision profesional opcional
          </h1>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            Cuentanos que documento quieres revisar y que nivel de prioridad necesitas. El equipo juridico validara el alcance desde backend.
          </p>
        </div>
      </div>

      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-labora-charcoal">
              Documento a revisar
            </span>
            <select
              value={values.targetType}
              onChange={(event) =>
                onChange("targetType", event.target.value as ReviewTargetType)
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
              aria-invalid={Boolean(errors.targetType)}
            >
              {Object.entries(targetTypeCopy).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError message={errors.targetType} />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-labora-charcoal">
              Tipo de revision
            </span>
            <select
              value={values.reviewType}
              onChange={(event) =>
                onChange("reviewType", event.target.value as ReviewType)
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
            >
              {Object.entries(reviewTypeCopy).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block">
            <span className="text-sm font-semibold text-labora-charcoal">
              ID del documento objetivo
            </span>
            <input
              value={values.targetId}
              onChange={(event) => onChange("targetId", event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
              placeholder="UUID o identificador del backend"
              aria-invalid={Boolean(errors.targetId)}
            />
            <FieldError message={errors.targetId} />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-labora-charcoal">Prioridad</span>
            <select
              value={values.priority}
              onChange={(event) =>
                onChange(
                  "priority",
                  event.target.value as RequestProfessionalReviewForm["priority"],
                )
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
            >
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
            </select>
            <FieldError message={errors.priority} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-labora-charcoal">
            Comentario para el abogado
          </span>
          <textarea
            value={values.clientNotes || ""}
            onChange={(event) => onChange("clientNotes", event.target.value)}
            rows={5}
            maxLength={1000}
            className="mt-2 w-full rounded-lg border border-labora-ui px-3 py-2 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
            placeholder="Describe que quieres que revise el profesional."
            aria-invalid={Boolean(errors.clientNotes)}
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            <FieldError message={errors.clientNotes} />
            <span className="text-xs text-labora-gray">
              {(values.clientNotes || "").length}/1000
            </span>
          </div>
        </label>

        <label className="flex gap-3 rounded-lg border border-labora-ui bg-labora-ivory p-4">
          <input
            type="checkbox"
            checked={values.acceptedScope}
            onChange={(event) => onChange("acceptedScope", event.target.checked)}
            className="mt-1 h-4 w-4 accent-labora-green"
            aria-invalid={Boolean(errors.acceptedScope)}
          />
          <span className="text-sm leading-6 text-labora-gray">
            Entiendo que la revision profesional complementa el analisis de Labora y que el abogado podra dejar observaciones, solicitar soportes o emitir una version revisada.
            <FieldError message={errors.acceptedScope} />
          </span>
        </label>

        {submitError ? <InlineAlert tone="error">{submitError}</InlineAlert> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Enviar solicitud
          </button>
        </div>
      </form>
    </section>
  );
}

export function ReviewCommentItem({
  comment,
  mode,
  onResolve,
}: {
  comment: ReviewComment;
  mode: "client" | "lawyer";
  onResolve?: (commentId: string) => void;
}) {
  const internal = comment.visibility !== "client_visible";

  return (
    <article className="rounded-lg border border-labora-ui bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-labora-charcoal">
              {comment.authorName}
            </p>
            <span className="rounded-full border border-labora-ui bg-labora-ivory px-2 py-1 text-xs font-semibold text-labora-gray">
              {commentTypeCopy[comment.commentType]}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-1 text-xs font-semibold",
                internal
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800",
              )}
            >
              {visibilityCopy[comment.visibility]}
            </span>
            {comment.resolved ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                Resuelto
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-labora-gray">
            {formatReviewDate(comment.createdAt)}
            {comment.targetSection ? ` - ${comment.targetSection}` : ""}
          </p>
        </div>
        {mode === "lawyer" && !comment.resolved && onResolve ? (
          <button
            type="button"
            onClick={() => onResolve(comment.id)}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-labora-ui px-3 py-1 text-xs font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Resolver
          </button>
        ) : null}
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-labora-gray">
        {comment.body}
      </p>
    </article>
  );
}

export function ReviewCommentsPanel({
  reviewId,
  comments,
  mode,
  canComment,
  isSubmitting,
  error,
  onCreate,
  onResolve,
}: {
  reviewId: string;
  comments: ReviewComment[];
  mode: "client" | "lawyer";
  canComment: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onCreate?: (payload: CreateReviewCommentBody) => Promise<void>;
  onResolve?: (commentId: string) => Promise<void>;
}) {
  const [visibility, setVisibility] =
    useState<ReviewCommentVisibility>("client_visible");
  const [commentType, setCommentType] = useState<ReviewCommentType>("general");
  const [body, setBody] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const visibleComments = useMemo(() => {
    if (mode === "client") {
      return comments.filter((comment) => comment.visibility === "client_visible");
    }

    return comments;
  }, [comments, mode]);

  async function submitComment() {
    const trimmed = body.trim();
    setLocalError(null);

    if (!trimmed) {
      setLocalError("Escribe un comentario.");
      return;
    }

    if (trimmed.length > 3000) {
      setLocalError("El comentario no puede superar 3.000 caracteres.");
      return;
    }

    if (!onCreate) {
      return;
    }

    await onCreate({
      visibility: mode === "client" ? "client_visible" : visibility,
      commentType: mode === "client" ? "general" : commentType,
      body: trimmed,
      targetSection: targetSection.trim() || undefined,
    });

    setBody("");
    setTargetSection("");
    setCommentType("general");
    setVisibility("client_visible");

    trackProfessionalReviewEvent("professional_review_comment_created", {
      reviewId,
      actorRole: mode === "client" ? "client" : "lawyer",
      visibility: mode === "client" ? "client_visible" : visibility,
      commentType,
    });
  }

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Comentarios
        </h2>
      </div>

      <div className="mt-4 grid gap-3">
        {visibleComments.map((comment) => (
          <ReviewCommentItem
            key={comment.id}
            comment={comment}
            mode={mode}
            onResolve={onResolve}
          />
        ))}
        {!visibleComments.length ? (
          <div className="rounded-lg border border-labora-ui bg-labora-ivory p-4 text-sm text-labora-gray">
            {mode === "client"
              ? "Aun no hay comentarios visibles para ti."
              : "Aun no hay comentarios en esta revision."}
          </div>
        ) : null}
      </div>

      {canComment ? (
        <div className="mt-5 rounded-lg border border-labora-ui bg-labora-ivory p-4">
          <div className="grid gap-3">
            {mode === "lawyer" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-labora-gray">
                    Visibilidad
                  </span>
                  <select
                    value={visibility}
                    onChange={(event) =>
                      setVisibility(event.target.value as ReviewCommentVisibility)
                    }
                    className="mt-2 min-h-10 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm"
                  >
                    {Object.entries(visibilityCopy).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-labora-gray">
                    Tipo
                  </span>
                  <select
                    value={commentType}
                    onChange={(event) =>
                      setCommentType(event.target.value as ReviewCommentType)
                    }
                    className="mt-2 min-h-10 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm"
                  >
                    {Object.entries(commentTypeCopy).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {mode === "lawyer" ? (
              <label className="block">
                <span className="text-xs font-semibold text-labora-gray">
                  Seccion relacionada
                </span>
                <input
                  value={targetSection}
                  onChange={(event) => setTargetSection(event.target.value)}
                  className="mt-2 min-h-10 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm"
                  placeholder="Opcional"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="text-xs font-semibold text-labora-gray">
                Comentario
              </span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={4}
                maxLength={3000}
                className="mt-2 w-full rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
                placeholder="Escribe un mensaje claro y accionable."
              />
              <div className="mt-1 flex items-center justify-between gap-3">
                <FieldError message={localError || error || undefined} />
                <span className="text-xs text-labora-gray">{body.length}/3000</span>
              </div>
            </label>
          </div>
          <button
            type="button"
            onClick={submitComment}
            disabled={isSubmitting}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:bg-labora-ui disabled:text-labora-gray"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Comentar
          </button>
        </div>
      ) : null}
    </section>
  );
}

function fileAllowed(file: File, allowedMimeTypes: string[]) {
  if (!allowedMimeTypes.length) {
    return true;
  }

  return allowedMimeTypes.includes(file.type);
}

function defaultAllowedTypes() {
  return [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];
}

export function RequestedDocumentsUpload({
  reviewId,
  requestedDocuments,
  onUpload,
  isUploading,
  error,
}: {
  reviewId: string;
  requestedDocuments: RequestedDocument[];
  onUpload: (payload: UploadRequestedDocumentBody) => Promise<void>;
  isUploading?: boolean;
  error?: string | null;
}) {
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [message, setMessage] = useState<string | null>(null);

  if (!requestedDocuments.length) {
    return null;
  }

  async function submit(document: RequestedDocument) {
    const file = files[document.id];
    setMessage(null);

    if (!file) {
      setMessage("Selecciona un archivo para cargar.");
      return;
    }

    const allowedTypes = document.allowedMimeTypes?.length
      ? document.allowedMimeTypes
      : defaultAllowedTypes();
    const maxSizeMb = document.maxSizeMb ?? 20;

    if (!fileAllowed(file, allowedTypes)) {
      setMessage("El tipo de archivo no esta permitido.");
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setMessage(`El archivo supera ${maxSizeMb} MB.`);
      return;
    }

    await onUpload({
      requestedDocumentId: document.id,
      documentType: document.documentType,
      file,
    });

    setMessage("Documento cargado correctamente.");
    trackProfessionalReviewEvent("professional_review_file_uploaded", {
      reviewId,
      documentType: document.documentType,
      actorRole: "client",
    });
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-panel">
      <div className="flex gap-3">
        <UploadCloud className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Documentos solicitados
          </h2>
          <p className="mt-1 text-sm leading-6">
            Sube los soportes solicitados para que el abogado pueda continuar.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {requestedDocuments.map((document) => (
          <article key={document.id} className="rounded-lg border border-amber-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="font-semibold text-labora-charcoal">
                  {document.description}
                </h3>
                <p className="mt-1 text-sm text-labora-gray">
                  {document.required ? "Obligatorio" : "Opcional"} - Estado: {document.status}
                </p>
                {document.uploadedFileName ? (
                  <p className="mt-1 text-sm text-labora-gray">
                    Archivo actual: {document.uploadedFileName}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2 sm:min-w-80">
                <input
                  type="file"
                  accept={(document.allowedMimeTypes?.length
                    ? document.allowedMimeTypes
                    : defaultAllowedTypes()
                  ).join(",")}
                  onChange={(event) =>
                    setFiles((current) => ({
                      ...current,
                      [document.id]: event.target.files?.[0],
                    }))
                  }
                  className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal"
                />
                <button
                  type="button"
                  onClick={() => submit(document)}
                  disabled={isUploading}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white disabled:bg-labora-ui disabled:text-labora-gray"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <UploadCloud className="h-4 w-4" aria-hidden="true" />
                  )}
                  Cargar soporte
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {message ? <p className="mt-3 text-sm font-semibold">{message}</p> : null}
      {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
    </section>
  );
}

export function ReviewCaseSummary({ review }: { review: ProfessionalReviewDetail }) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Resumen del caso
        </h2>
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="font-semibold text-labora-charcoal">Caso</dt>
          <dd className="mt-1 text-labora-gray">{review.caseNumber}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Cliente</dt>
          <dd className="mt-1 text-labora-gray">{review.clientName || "No disponible"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Tipo de revision</dt>
          <dd className="mt-1 text-labora-gray">{reviewTypeCopy[review.reviewType]}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Documento objetivo</dt>
          <dd className="mt-1 text-labora-gray">
            {targetTypeCopy[review.targetType]} {review.targetLabel ? `- ${review.targetLabel}` : ""}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Solicitud</dt>
          <dd className="mt-1 text-labora-gray">{formatReviewDate(review.requestedAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Vencimiento</dt>
          <dd className="mt-1 text-labora-gray">{formatReviewDate(review.dueAt)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function AIReviewerSummary({
  review,
  canGenerate,
  isLoading,
  error,
  onGenerate,
}: {
  review: ProfessionalReviewDetail;
  canGenerate: boolean;
  isLoading?: boolean;
  error?: string | null;
  onGenerate: () => Promise<void>;
}) {
  const summary = review.aiSummary;

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <Sparkles className="mt-1 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Alertas IA
            </h2>
            <p className="mt-1 text-sm leading-6 text-labora-gray">
              Resumen generado por IA para apoyo del abogado. No sustituye la revision profesional.
            </p>
          </div>
        </div>
        {canGenerate ? (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory disabled:text-labora-gray"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            )}
            {summary?.status === "generated" ? "Regenerar" : "Generar"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 rounded-lg border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray">
        {summary?.body ? summary.body : "Aun no hay resumen IA para esta revision."}
        {typeof summary?.confidence === "number" ? (
          <p className="mt-2 font-semibold text-labora-charcoal">
            Confianza: {Math.round(summary.confidence * 100)}%
          </p>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
    </section>
  );
}

export function ReviewDocumentViewer({ review }: { review: ProfessionalReviewDetail }) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <FileText className="mt-1 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
              Documento objetivo
            </h2>
            <p className="mt-1 text-sm leading-6 text-labora-gray">
              {targetTypeCopy[review.targetType]} - {review.targetLabel || review.targetId}
            </p>
          </div>
        </div>
        {review.originalFile?.downloadUrl && reviewHasAction(review, "download_original") ? (
          <Link
            href={review.originalFile.downloadUrl}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Descargar original
          </Link>
        ) : null}
      </div>

      <div className="mt-4 min-h-72 rounded-lg border border-dashed border-labora-ui bg-labora-ivory p-5">
        <div className="flex h-full min-h-60 items-center justify-center text-center">
          <div>
            <Eye className="mx-auto h-8 w-8 text-labora-green" aria-hidden="true" />
            <h3 className="mt-3 font-heading text-lg font-semibold text-labora-charcoal">
              Visor preparado
            </h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-labora-gray">
              Cuando el backend entregue preview o URL segura, aqui se mostrara el PDF o documento objetivo con metadatos y versiones.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function VersionComparison({
  originalFile,
  reviewedFiles,
}: {
  originalFile: ProfessionalReviewDetail["originalFile"];
  reviewedFiles: ReviewedFile[];
}) {
  const latestReviewed = reviewedFiles[0];

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <FileCheck2 className="h-4 w-4 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Comparador de versiones
        </h2>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-labora-ui bg-labora-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-labora-gray">
            Original
          </p>
          <h3 className="mt-2 font-semibold text-labora-charcoal">
            {originalFile?.fileName || "Documento original"}
          </h3>
          <p className="mt-1 text-sm text-labora-gray">
            {formatReviewBytes(originalFile?.fileSize)}
          </p>
          {originalFile?.downloadUrl ? (
            <Link
              href={originalFile.downloadUrl}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-semibold text-labora-deep"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Descargar
            </Link>
          ) : null}
        </article>

        <article className="rounded-lg border border-labora-ui bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-labora-gray">
            Revisada
          </p>
          <h3 className="mt-2 font-semibold text-labora-charcoal">
            {latestReviewed?.fileName || "Sin version revisada"}
          </h3>
          <p className="mt-1 text-sm text-labora-gray">
            {latestReviewed
              ? `v${latestReviewed.versionNumber} - ${formatReviewBytes(latestReviewed.fileSize)}`
              : "Carga una version revisada para comparar."}
          </p>
          {latestReviewed?.downloadUrl ? (
            <Link
              href={latestReviewed.downloadUrl}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Descargar
            </Link>
          ) : null}
        </article>
      </div>
    </section>
  );
}

export function ReviewedFileUploader({
  reviewId,
  canUpload,
  isUploading,
  error,
  onUpload,
}: {
  reviewId: string;
  canUpload: boolean;
  isUploading?: boolean;
  error?: string | null;
  onUpload: (payload: UploadReviewedFileBody) => Promise<void>;
}) {
  const [fileType, setFileType] = useState("reviewed_document");
  const [file, setFile] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState("");
  const [readyForApproval, setReadyForApproval] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setLocalError(null);
    setSuccess(false);

    if (!file) {
      setLocalError("Selecciona el archivo revisado.");
      return;
    }

    if (!fileAllowed(file, defaultAllowedTypes())) {
      setLocalError("El tipo de archivo no esta permitido.");
      return;
    }

    await onUpload({
      fileType,
      file,
      versionNote: versionNote.trim() || undefined,
      readyForApproval,
    });

    setSuccess(true);
    setFile(null);
    setVersionNote("");
    trackProfessionalReviewEvent("professional_review_file_uploaded", {
      reviewId,
      fileType,
      actorRole: "lawyer",
    });
  }

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <UploadCloud className="h-4 w-4 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Cargar version revisada
        </h2>
      </div>
      {!canUpload ? (
        <InlineAlert tone="warning">
          Tu usuario no tiene disponible la accion de cargar archivo revisado.
        </InlineAlert>
      ) : (
        <div className="mt-4 grid gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-labora-gray">Tipo de archivo</span>
            <select
              value={fileType}
              onChange={(event) => setFileType(event.target.value)}
              className="mt-2 min-h-10 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm"
            >
              <option value="reviewed_document">Documento revisado</option>
              <option value="reviewed_pdf">PDF revisado</option>
              <option value="reviewed_docx">Word revisado</option>
            </select>
          </label>
          <input
            type="file"
            accept={defaultAllowedTypes().join(",")}
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="min-h-11 rounded-lg border border-labora-ui px-3 py-2 text-sm"
          />
          <label className="block">
            <span className="text-xs font-semibold text-labora-gray">Nota de version</span>
            <textarea
              value={versionNote}
              onChange={(event) => setVersionNote(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-labora-ui px-3 py-2 text-sm"
              placeholder="Resume cambios relevantes."
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-labora-gray">
            <input
              type="checkbox"
              checked={readyForApproval}
              onChange={(event) => setReadyForApproval(event.target.checked)}
              className="h-4 w-4 accent-labora-green"
            />
            Marcar como listo para aprobacion
          </label>
          <FieldError message={localError || error || undefined} />
          {success ? <InlineAlert tone="success">Archivo cargado correctamente.</InlineAlert> : null}
          <button
            type="button"
            onClick={submit}
            disabled={isUploading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white disabled:bg-labora-ui disabled:text-labora-gray"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
            )}
            Cargar archivo
          </button>
        </div>
      )}
    </section>
  );
}

export function ProfessionalApprovalPanel({
  review,
  canApprove,
  canReject,
  isSubmitting,
  error,
  onApprove,
  onReject,
}: {
  review: ProfessionalReviewDetail;
  canApprove: boolean;
  canReject: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onApprove: (payload: ApproveReviewBody) => Promise<void>;
  onReject: (payload: { reason: string; note?: string }) => Promise<void>;
}) {
  const readyFiles = review.reviewedFiles.filter(
    (file) => file.status === "ready_for_approval" || file.status === "approved",
  );
  const [reviewedFileId, setReviewedFileId] = useState(readyFiles[0]?.id || "");
  const [approvalNote, setApprovalNote] = useState("");
  const [publishToClient, setPublishToClient] = useState(true);
  const [confirmationAccepted, setConfirmationAccepted] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function approve() {
    setLocalError(null);
    setSuccess(null);

    if (!reviewedFileId) {
      setLocalError("Selecciona un archivo revisado.");
      return;
    }

    if (approvalNote.length > 2000) {
      setLocalError("La nota de aprobacion no puede superar 2.000 caracteres.");
      return;
    }

    if (!confirmationAccepted) {
      setLocalError("Debes confirmar la revision profesional.");
      return;
    }

    const confirmed = window.confirm(
      "La version revisada quedara disponible para el cliente. Deseas continuar?",
    );

    if (!confirmed) {
      return;
    }

    await onApprove({
      reviewedFileId,
      approvalNote: approvalNote.trim() || undefined,
      publishToClient,
      confirmationAccepted,
    });

    setSuccess("Revision aprobada correctamente.");
    trackProfessionalReviewEvent("professional_review_approved_clicked", {
      reviewId: review.id,
      status: review.status,
      actorRole: "lawyer",
    });
  }

  async function reject() {
    setLocalError(null);
    setSuccess(null);

    if (!rejectReason.trim()) {
      setLocalError("Escribe el motivo del rechazo.");
      return;
    }

    await onReject({
      reason: "professional_rejection",
      note: rejectReason.trim(),
    });

    setSuccess("Revision rechazada.");
  }

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Aprobacion profesional
        </h2>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-labora-gray">
            Archivo revisado
          </span>
          <select
            value={reviewedFileId}
            onChange={(event) => setReviewedFileId(event.target.value)}
            className="mt-2 min-h-10 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm"
            disabled={!canApprove}
          >
            <option value="">Selecciona una version</option>
            {readyFiles.map((file) => (
              <option key={file.id} value={file.id}>
                v{file.versionNumber} - {file.fileName || file.fileType}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-labora-gray">Nota de aprobacion</span>
          <textarea
            value={approvalNote}
            onChange={(event) => setApprovalNote(event.target.value)}
            rows={4}
            maxLength={2000}
            disabled={!canApprove}
            className="mt-2 w-full rounded-lg border border-labora-ui px-3 py-2 text-sm"
            placeholder="Opcional. Resume el alcance de la aprobacion."
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-labora-gray">
          <input
            type="checkbox"
            checked={publishToClient}
            onChange={(event) => setPublishToClient(event.target.checked)}
            disabled={!canApprove}
            className="h-4 w-4 accent-labora-green"
          />
          Publicar al cliente
        </label>

        <label className="flex gap-3 rounded-lg border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray">
          <input
            type="checkbox"
            checked={confirmationAccepted}
            onChange={(event) => setConfirmationAccepted(event.target.checked)}
            disabled={!canApprove}
            className="mt-1 h-4 w-4 accent-labora-green"
          />
          Confirmo que revise profesionalmente el documento seleccionado y autorizo su publicacion como version final revisada.
        </label>

        <button
          type="button"
          onClick={approve}
          disabled={!canApprove || isSubmitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white disabled:bg-labora-ui disabled:text-labora-gray"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Aprobar version
        </button>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <label className="block">
            <span className="text-xs font-semibold text-red-700">Motivo de rechazo</span>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={3}
              disabled={!canReject}
              className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-labora-charcoal"
              placeholder="Explica por que no se puede aprobar."
            />
          </label>
          <button
            type="button"
            onClick={reject}
            disabled={!canReject || isSubmitting}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:bg-labora-ui disabled:text-labora-gray"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Rechazar
          </button>
        </div>

        <FieldError message={localError || error || undefined} />
        {success ? <InlineAlert tone="success">{success}</InlineAlert> : null}
      </div>
    </section>
  );
}

export function ReviewAuditTimeline({ events }: { events: ReviewAuditEvent[] }) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Auditoria
        </h2>
      </div>
      <ol className="mt-4 grid gap-3">
        {events.map((event) => (
          <li key={event.id} className="rounded-lg border border-labora-ui bg-labora-ivory p-4">
            <p className="text-sm font-semibold text-labora-charcoal">{event.title}</p>
            {event.description ? (
              <p className="mt-1 text-sm leading-6 text-labora-gray">{event.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-labora-gray">
              {formatReviewDate(event.occurredAt)}
              {event.actorName ? ` - ${event.actorName}` : ""}
            </p>
          </li>
        ))}
        {!events.length ? (
          <li className="rounded-lg border border-labora-ui bg-labora-ivory p-4 text-sm text-labora-gray">
            Aun no hay eventos de auditoria.
          </li>
        ) : null}
      </ol>
    </section>
  );
}

export function RequestClientActionModal({
  canRequest,
  isSubmitting,
  error,
  onSubmit,
}: {
  canRequest: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (payload: RequestClientActionBody) => Promise<void>;
}) {
  const [reason, setReason] = useState("missing_document");
  const [message, setMessage] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [required, setRequired] = useState(true);
  const [dueAt, setDueAt] = useState("");
  const [severity, setSeverity] = useState<RequestClientActionBody["severity"]>("normal");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setLocalError(null);
    setSuccess(false);

    if (!message.trim()) {
      setLocalError("Escribe un mensaje para el cliente.");
      return;
    }

    if (!documentType.trim() || !description.trim()) {
      setLocalError("Agrega al menos un documento solicitado.");
      return;
    }

    await onSubmit({
      reason,
      message: message.trim(),
      requestedDocuments: [
        {
          documentType: documentType.trim(),
          description: description.trim(),
          required,
        },
      ],
      dueAt: dueAt || undefined,
      severity,
    });

    setSuccess(true);
    setMessage("");
    setDocumentType("");
    setDescription("");
  }

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <UploadCloud className="h-4 w-4 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Solicitar documentos
        </h2>
      </div>
      {!canRequest ? (
        <InlineAlert tone="warning">
          Esta revision no tiene habilitada la accion de solicitar documentos al cliente.
        </InlineAlert>
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-labora-gray">Motivo</span>
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-2 min-h-10 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm"
              >
                <option value="missing_document">Documento faltante</option>
                <option value="inconsistent_information">Informacion inconsistente</option>
                <option value="unreadable_support">Soporte ilegible</option>
                <option value="clarification_required">Aclaracion requerida</option>
                <option value="other">Otro</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-labora-gray">Severidad</span>
              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value as RequestClientActionBody["severity"])
                }
                className="mt-2 min-h-10 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm"
              >
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-labora-gray">Mensaje al cliente</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg border border-labora-ui px-3 py-2 text-sm"
              placeholder="Explica que debe subir y por que."
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-labora-gray">Tipo de documento</span>
              <input
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                className="mt-2 min-h-10 w-full rounded-lg border border-labora-ui px-3 text-sm"
                placeholder="pension_resolution"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-labora-gray">Descripcion</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 min-h-10 w-full rounded-lg border border-labora-ui px-3 text-sm"
                placeholder="Resolucion pensional"
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-labora-gray">Fecha sugerida</span>
              <input
                type="date"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                className="mt-2 min-h-10 w-full rounded-lg border border-labora-ui px-3 text-sm"
              />
            </label>
            <label className="mt-6 flex items-center gap-2 text-sm text-labora-gray">
              <input
                type="checkbox"
                checked={required}
                onChange={(event) => setRequired(event.target.checked)}
                className="h-4 w-4 accent-labora-green"
              />
              Documento obligatorio
            </label>
          </div>
          <FieldError message={localError || error || undefined} />
          {success ? <InlineAlert tone="success">Solicitud enviada al cliente.</InlineAlert> : null}
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white disabled:bg-labora-ui disabled:text-labora-gray"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Solicitar al cliente
          </button>
        </div>
      )}
    </section>
  );
}

export function FinalDownloadCenter({ review }: { review: ProfessionalReviewDetail }) {
  const finalFiles = review.reviewedFiles.filter(
    (file) => file.status === "approved" || file.status === "published",
  );

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-panel">
      <div className="flex gap-3">
        <FileCheck2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Version final revisada
          </h2>
          <p className="mt-1 text-sm leading-6">
            Esta version fue revisada y aprobada profesionalmente. Conservamos la version original y la version revisada para trazabilidad del expediente.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {finalFiles.map((file) => (
          <article key={file.id} className="rounded-lg border border-emerald-200 bg-white p-4">
            <h3 className="font-semibold text-labora-charcoal">
              {file.fileName || `Version v${file.versionNumber}`}
            </h3>
            <p className="mt-1 text-sm text-labora-gray">
              {formatReviewBytes(file.fileSize)} - {formatReviewDate(file.approvedAt || file.createdAt)}
            </p>
            {file.downloadUrl ? (
              <Link
                href={file.downloadUrl}
                onClick={() =>
                  trackProfessionalReviewEvent("professional_review_final_downloaded", {
                    reviewId: review.id,
                    caseId: review.caseId,
                    fileId: file.id,
                    actorRole: "client",
                  })
                }
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-labora-green px-3 py-2 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Descargar
              </Link>
            ) : null}
          </article>
        ))}
        {!finalFiles.length ? (
          <div className="rounded-lg border border-emerald-200 bg-white p-4 text-sm text-labora-gray">
            La revision esta finalizada, pero el backend aun no envio archivos descargables.
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ReviewInboxTable({
  items,
}: {
  items: ProfessionalReviewListItem[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-labora-ui bg-white shadow-panel">
      <table className="hidden w-full text-left text-sm lg:table">
        <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
          <tr>
            <th className="px-4 py-3">Caso</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Documento</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Prioridad</th>
            <th className="px-4 py-3">Responsable</th>
            <th className="px-4 py-3">Vencimiento</th>
            <th className="px-4 py-3">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-labora-ui">
          {items.map((review) => (
            <tr key={review.id}>
              <td className="px-4 py-3 font-semibold text-labora-charcoal">
                {review.caseNumber}
              </td>
              <td className="px-4 py-3 text-labora-gray">
                {review.clientName || "Sin cliente"}
              </td>
              <td className="px-4 py-3 text-labora-gray">
                {reviewTypeCopy[review.reviewType]}
              </td>
              <td className="px-4 py-3 text-labora-gray">
                {review.targetLabel || targetTypeCopy[review.targetType]}
              </td>
              <td className="px-4 py-3">
                <ReviewStatusBadge status={review.status} />
              </td>
              <td className="px-4 py-3">
                <ReviewPriorityBadge priority={review.priority} />
              </td>
              <td className="px-4 py-3 text-labora-gray">
                {review.assignedLawyer?.name || "Sin asignar"}
              </td>
              <td className="px-4 py-3 text-labora-gray">
                {formatReviewDate(review.dueAt)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/backoffice/professional-reviews/${review.id}`}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-labora-ui px-3 py-1 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                >
                  Ver
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid gap-3 p-4 lg:hidden">
        {items.map((review) => (
          <article key={review.id} className="rounded-lg border border-labora-ui p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-labora-charcoal">
                  {review.caseNumber}
                </h2>
                <p className="mt-1 text-sm text-labora-gray">
                  {review.clientName || "Sin cliente"} - {reviewTypeCopy[review.reviewType]}
                </p>
              </div>
              <ReviewStatusBadge status={review.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ReviewPriorityBadge priority={review.priority} />
              <span className="rounded-full border border-labora-ui bg-labora-ivory px-3 py-1 text-xs font-semibold text-labora-gray">
                {formatReviewDate(review.dueAt)}
              </span>
            </div>
            <Link
              href={`/backoffice/professional-reviews/${review.id}`}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-labora-green px-3 py-2 text-sm font-semibold text-white"
            >
              Abrir detalle
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ReviewScopeNotice() {
  return (
    <section id="scope" className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex gap-3">
        <Info className="mt-1 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
            Que incluye la revision
          </h2>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-labora-gray md:grid-cols-3">
            <p className="rounded-lg bg-labora-ivory p-3">
              Un abogado revisa el documento objetivo y puede dejar observaciones visibles.
            </p>
            <p className="rounded-lg bg-labora-ivory p-3">
              El equipo puede pedir soportes si falta informacion para decidir.
            </p>
            <p className="rounded-lg bg-labora-ivory p-3">
              Si aplica, se publica una version final revisada y descargable.
            </p>
          </div>
          <InlineAlert tone="warning">
            Este resumen fue generado para apoyar la revision. El abogado debe verificarlo antes de tomar una decision.
          </InlineAlert>
        </div>
      </div>
    </section>
  );
}

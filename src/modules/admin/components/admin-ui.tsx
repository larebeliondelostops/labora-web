"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Database,
  Eye,
  FileText,
  Lock,
  NotebookPen,
  RefreshCcw,
  ShieldAlert,
  UserPlus,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  AdminDocument,
  AdminMutationResult,
  AdminStatus,
  AdminUserOption,
  AiAlert,
  AuditEvent,
  CasePriority,
  ExtractionItem,
} from "@/src/modules/admin/api/admin.types";

type Tone = "green" | "amber" | "red" | "blue" | "gray";

const toneClasses: Record<Tone, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  red: "border-red-200 bg-red-50 text-red-800",
  blue: "border-sky-200 bg-sky-50 text-sky-800",
  gray: "border-labora-ui bg-labora-ivory text-labora-gray",
};

const statusMeta: Record<AdminStatus, { label: string; tone: Tone; icon: ReactNode }> = {
  not_started: { label: "No iniciado", tone: "gray", icon: <Clock className="h-3.5 w-3.5" /> },
  in_progress: { label: "En proceso", tone: "blue", icon: <Clock className="h-3.5 w-3.5" /> },
  completed: { label: "Completado", tone: "green", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  blocked: { label: "Bloqueado", tone: "red", icon: <Lock className="h-3.5 w-3.5" /> },
  requires_review: { label: "Requiere revision", tone: "amber", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  error: { label: "Error", tone: "red", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
};

const priorityMeta: Record<CasePriority, { label: string; tone: Tone }> = {
  low: { label: "Baja", tone: "gray" },
  normal: { label: "Normal", tone: "green" },
  high: { label: "Alta", tone: "amber" },
  urgent: { label: "Urgente", tone: "red" },
};

const documentStatusLabels: Record<AdminDocument["status"], string> = {
  missing: "No cargado",
  ocr_pending: "OCR pendiente",
  ocr_failed: "OCR fallido",
  illegible: "PDF ilegible",
  valid: "Valido",
  requires_reload: "Requiere recarga",
  valid_with_observations: "Valido con observaciones",
};

function getSeverityTone(severity: AiAlert["severity"]): Tone {
  if (severity === "critical" || severity === "high") {
    return "red";
  }

  if (severity === "medium") {
    return "amber";
  }

  return "green";
}

export function formatDateTime(value?: string | null) {
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

export function formatPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Sin score";
  }

  return `${Math.round(value * 100)}%`;
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-labora-ui bg-white p-5 shadow-panel", className)}>
      {children}
    </section>
  );
}

export function Pill({
  children,
  tone = "gray",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusChip({ status }: { status: AdminStatus }) {
  const meta = statusMeta[status] || statusMeta.not_started;

  return (
    <Pill tone={meta.tone}>
      {meta.icon}
      {meta.label}
    </Pill>
  );
}

export function PriorityBadge({ priority }: { priority: CasePriority }) {
  const meta = priorityMeta[priority] || priorityMeta.normal;

  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function PaymentStatusChip({
  status,
  unlocked,
}: {
  status?: string | null;
  unlocked?: boolean;
}) {
  const normalized = status?.toLowerCase() || "pendiente";
  const tone: Tone =
    normalized.includes("confirmado") || unlocked
      ? "green"
      : normalized.includes("pendiente")
        ? "amber"
        : normalized.includes("rechazado")
          ? "red"
          : "blue";

  return (
    <Pill tone={tone}>
      {unlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
      {status || "Pendiente"}
    </Pill>
  );
}

export function AiConfidenceBadge({
  score,
  critical,
}: {
  score?: number | null;
  critical?: boolean;
}) {
  const tone: Tone =
    critical || (typeof score === "number" && score < 0.55)
      ? "red"
      : typeof score === "number" && score < 0.75
        ? "amber"
        : "green";
  const label =
    critical || (typeof score === "number" && score < 0.55)
      ? "IA critica"
      : typeof score === "number" && score < 0.75
        ? "IA media"
        : "IA alta";

  return (
    <Pill tone={tone}>
      {critical ? <Lock className="h-3.5 w-3.5" /> : <Database className="h-3.5 w-3.5" />}
      {label} {typeof score === "number" ? formatPercent(score) : ""}
    </Pill>
  );
}

export function ReviewDecisionBadge({ decision }: { decision: string }) {
  const tone: Tone =
    decision.includes("apro") || decision.includes("valid")
      ? "green"
      : decision.includes("bloq") || decision.includes("rech")
        ? "red"
        : "amber";

  return <Pill tone={tone}>{decision}</Pill>;
}

export function DataSourceBadge({ source }: { source: string }) {
  const label = {
    document: "Documento",
    page: "Pagina",
    ocr: "OCR",
    user: "Usuario",
    admin: "Admin",
  }[source] || source;

  return <Pill tone={source === "ocr" ? "amber" : "blue"}>{label}</Pill>;
}

export function VersionBadge({ version }: { version: number }) {
  return <Pill tone="blue">v{version}</Pill>;
}

export function SensitiveDataMask({ value }: { value?: string | null }) {
  return <span className="font-mono text-xs text-labora-gray">{value || "***"}</span>;
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-lg border border-labora-ui bg-white p-5 shadow-panel">
          <div className="h-4 w-36 animate-pulse rounded bg-labora-ui" />
          <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-labora-ui" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="h-10 animate-pulse rounded bg-labora-ui" />
            <div className="h-10 animate-pulse rounded bg-labora-ui" />
            <div className="h-10 animate-pulse rounded bg-labora-ui" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-labora-ui bg-white p-8 text-center shadow-panel">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-labora-ivory text-labora-green">
        <ClipboardCheck className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-heading text-xl font-semibold text-labora-charcoal">{title}</h2>
      {body ? <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-labora-gray">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  body,
  actions,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">{title}</h1>
        {body ? <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">{body}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function CaseTimeline({ currentStage }: { currentStage: string }) {
  const stages = [
    "Registro",
    "Documentos",
    "IA preliminar",
    "Validacion",
    "Pago",
    "Analisis completo",
    "Informe",
    "Escritos",
    "Entrega",
  ];
  const currentIndex = Math.max(
    stages.findIndex((stage) => currentStage.toLowerCase().includes(stage.toLowerCase().split(" ")[0])),
    1,
  );

  return (
    <div className="grid gap-2 md:grid-cols-9">
      {stages.map((stage, index) => {
        const completed = index < currentIndex;
        const active = index === currentIndex;

        return (
          <div key={stage} className="flex items-center gap-2 md:block">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold",
                completed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : active
                    ? "border-labora-green bg-labora-green text-white"
                    : "border-labora-ui bg-white text-labora-gray",
              )}
            >
              {completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <p className="mt-0 text-xs font-semibold text-labora-charcoal md:mt-2">{stage}</p>
          </div>
        );
      })}
    </div>
  );
}

export function AuditEventItem({ event }: { event: AuditEvent }) {
  return (
    <article className="rounded-lg border border-labora-ui bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-labora-charcoal">{event.action}</p>
          <p className="mt-1 text-xs text-labora-gray">
            {event.actor} - {event.actorRole} - {event.entity}
          </p>
        </div>
        <time className="text-xs font-semibold text-labora-gray">{formatDateTime(event.occurredAt)}</time>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-labora-gray sm:grid-cols-3">
        <span>Antes: {event.previousState || "Sin estado"}</span>
        <span>Nuevo: {event.newState || "Sin estado"}</span>
        <span>IP: {event.ip || "No visible"}</span>
      </div>
      {event.metadataSummary ? (
        <p className="mt-3 rounded-lg bg-labora-ivory p-3 text-xs leading-5 text-labora-gray">
          {event.metadataSummary}
        </p>
      ) : null}
    </article>
  );
}

export function PdfViewer({ title, sourceUrl }: { title: string; sourceUrl?: string | null }) {
  return (
    <div className="flex min-h-[420px] flex-col rounded-lg border border-labora-ui bg-labora-ivory">
      <div className="flex items-center justify-between border-b border-labora-ui bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-labora-charcoal">
          <FileText className="h-4 w-4 text-labora-green" aria-hidden="true" />
          {title}
        </div>
        <Pill tone={sourceUrl ? "green" : "gray"}>{sourceUrl ? "Fuente segura" : "Vista preparada"}</Pill>
      </div>
      {sourceUrl ? (
        <iframe title={title} src={sourceUrl} className="min-h-[520px] flex-1 rounded-b-lg" />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-white text-labora-green">
              <Eye className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm font-semibold text-labora-charcoal">Visor PDF/documento</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-labora-gray">
              Cuando el backend entregue una URL segura, el documento se renderiza aqui.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function SplitPane({
  left,
  right,
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]", className)}>
      <div className="min-w-0">{left}</div>
      <aside className="min-w-0">{right}</aside>
    </div>
  );
}

export function ResponsiveDrawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-labora-charcoal/35"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-panel">
        <header className="flex items-center justify-between border-b border-labora-ui px-5 py-4">
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui text-labora-gray hover:bg-labora-ivory"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}

export function ConfirmActionModal({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-labora-charcoal/35" />
      <div className="relative w-full max-w-md rounded-lg border border-labora-ui bg-white p-5 shadow-panel">
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-labora-gray">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-lg border border-labora-ui px-4 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-10 rounded-lg bg-labora-green px-4 text-sm font-semibold text-white hover:bg-labora-deep"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormMessage({ error, result }: { error?: string | null; result?: AdminMutationResult | null }) {
  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>;
  }

  if (result) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        {result.message}
      </div>
    );
  }

  return null;
}

export function AssignCaseModal({
  open,
  users,
  isLoading,
  error,
  result,
  onClose,
  onSubmit,
}: {
  open: boolean;
  users: AdminUserOption[];
  isLoading: boolean;
  error?: string | null;
  result?: AdminMutationResult | null;
  onClose: () => void;
  onSubmit: (payload: {
    assigneeId: string;
    assignmentType: string;
    reason: string;
    priority?: string;
  }) => Promise<AdminMutationResult>;
}) {
  const [assigneeId, setAssigneeId] = useState("");
  const [assignmentType, setAssignmentType] = useState("owner");
  const [priority, setPriority] = useState("");
  const [reason, setReason] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const selectedAssignee = useMemo(
    () => users.find((user) => user.id === assigneeId) || users[0],
    [assigneeId, users],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidation(null);

    const targetAssignee = assigneeId || selectedAssignee?.id;

    if (!targetAssignee || !reason.trim()) {
      setValidation("Selecciona responsable e indica el motivo.");
      return;
    }

    await onSubmit({
      assigneeId: targetAssignee,
      assignmentType,
      reason: reason.trim(),
      priority: priority || undefined,
    });
  }

  return (
    <ResponsiveDrawer open={open} title="Asignar expediente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Asignar a
          <select
            value={assigneeId || selectedAssignee?.id || ""}
            onChange={(event) => setAssigneeId(event.target.value)}
            className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.role}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Tipo de asignacion
          <select
            value={assignmentType}
            onChange={(event) => setAssignmentType(event.target.value)}
            className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm"
          >
            <option value="owner">Responsable principal</option>
            <option value="documental">Revision documental</option>
            <option value="legal">Revision juridica</option>
            <option value="calculation">Revision de calculo</option>
            <option value="support">Soporte</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Prioridad opcional
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm"
          >
            <option value="">Mantener prioridad</option>
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Motivo
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            className="rounded-lg border border-labora-ui px-3 py-2 text-sm"
            placeholder="Motivo operativo de la asignacion"
          />
        </label>
        {validation ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{validation}</div> : null}
        <FormMessage error={error} result={result} />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "Asignando..." : "Asignar"}
        </button>
      </form>
    </ResponsiveDrawer>
  );
}

export function ChangeCaseStatusModal({
  open,
  isLoading,
  error,
  result,
  onClose,
  onSubmit,
}: {
  open: boolean;
  isLoading: boolean;
  error?: string | null;
  result?: AdminMutationResult | null;
  onClose: () => void;
  onSubmit: (payload: { status: string; reason: string; blocksCase: boolean }) => Promise<AdminMutationResult>;
}) {
  const [status, setStatus] = useState("in_progress");
  const [reason, setReason] = useState("");
  const [blocksCase, setBlocksCase] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidation(null);

    if ((status === "blocked" || blocksCase) && !reason.trim()) {
      setValidation("Debes indicar motivo para bloquear o marcar bloqueo.");
      return;
    }

    if (!reason.trim()) {
      setValidation("Indica el motivo del cambio.");
      return;
    }

    await onSubmit({ status, reason: reason.trim(), blocksCase });
  }

  return (
    <ResponsiveDrawer open={open} title="Cambiar estado" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Nuevo estado
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm"
          >
            <option value="not_started">No iniciado</option>
            <option value="in_progress">En proceso</option>
            <option value="requires_review">Requiere revision</option>
            <option value="completed">Completado</option>
            <option value="blocked">Bloqueado</option>
            <option value="error">Error</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-labora-ui p-3 text-sm font-semibold text-labora-charcoal">
          <input
            type="checkbox"
            checked={blocksCase}
            onChange={(event) => setBlocksCase(event.target.checked)}
            className="h-4 w-4 accent-labora-green"
          />
          Bloquea el caso
        </label>
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Motivo
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            className="rounded-lg border border-labora-ui px-3 py-2 text-sm"
            placeholder="Motivo interno obligatorio"
          />
        </label>
        {validation ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{validation}</div> : null}
        <FormMessage error={error} result={result} />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
        >
          <Ban className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "Guardando..." : "Guardar estado"}
        </button>
      </form>
    </ResponsiveDrawer>
  );
}

export function InternalNoteDrawer({
  open,
  isLoading,
  error,
  result,
  onClose,
  onSubmit,
}: {
  open: boolean;
  isLoading: boolean;
  error?: string | null;
  result?: AdminMutationResult | null;
  onClose: () => void;
  onSubmit: (payload: {
    noteType: string;
    body: string;
    relatedEntity?: string;
    visibility: string;
  }) => Promise<AdminMutationResult>;
}) {
  const [noteType, setNoteType] = useState("Nota operativa");
  const [relatedEntity, setRelatedEntity] = useState("case");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("internal");
  const [validation, setValidation] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidation(null);

    if (!body.trim()) {
      setValidation("La nota interna no puede estar vacia.");
      return;
    }

    await onSubmit({
      noteType,
      body: body.trim(),
      relatedEntity,
      visibility,
    });
  }

  return (
    <ResponsiveDrawer open={open} title="Nota interna" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Tipo de nota
          <select
            value={noteType}
            onChange={(event) => setNoteType(event.target.value)}
            className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm"
          >
            <option>Nota operativa</option>
            <option>Riesgo documental</option>
            <option>Observacion juridica</option>
            <option>Nota de calculo</option>
            <option>Soporte</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Entidad relacionada
          <select
            value={relatedEntity}
            onChange={(event) => setRelatedEntity(event.target.value)}
            className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm"
          >
            <option value="case">Expediente</option>
            <option value="documents">Documentos</option>
            <option value="extraction">Extraccion</option>
            <option value="legal-analysis">Analisis juridico</option>
            <option value="calculations">Calculo</option>
            <option value="reports">Informes</option>
            <option value="legal-drafts">Escritos</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Visibilidad
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
            className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm"
          >
            <option value="internal">Interna - no visible para el usuario</option>
            <option value="publishable">Publicable tras revision</option>
            <option value="published_to_user">Publicada al usuario</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Contenido
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            className="rounded-lg border border-labora-ui px-3 py-2 text-sm"
            placeholder="Escribe la nota interna"
          />
        </label>
        {validation ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{validation}</div> : null}
        <FormMessage error={error} result={result} />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
        >
          <NotebookPen className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "Guardando..." : "Crear nota"}
        </button>
      </form>
    </ResponsiveDrawer>
  );
}

export function AiAlertDrawer({
  alert,
  onClose,
}: {
  alert: AiAlert | null;
  onClose: () => void;
}) {
  return (
    <ResponsiveDrawer open={Boolean(alert)} title="Alerta IA" onClose={onClose}>
      {alert ? (
        <div className="grid gap-4">
          <Pill tone={getSeverityTone(alert.severity)}>
            {alert.severity === "critical" ? <Lock className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {alert.severity}
          </Pill>
          <div>
            <p className="text-sm font-semibold text-labora-gray">Fuente</p>
            <p className="mt-1 text-labora-charcoal">{alert.source}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-labora-gray">Score de confianza</p>
            <p className="mt-1 text-labora-charcoal">{formatPercent(alert.confidenceScore)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-labora-gray">Descripcion</p>
            <p className="mt-1 text-sm leading-6 text-labora-charcoal">{alert.description}</p>
          </div>
          {alert.recommendation ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {alert.recommendation}
            </div>
          ) : null}
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-4 text-sm font-semibold text-white hover:bg-labora-deep"
          >
            Resolver alerta
          </button>
        </div>
      ) : null}
    </ResponsiveDrawer>
  );
}

export function ExtractionCorrectionDrawer({
  item,
  isLoading,
  error,
  result,
  onClose,
  onSubmit,
}: {
  item: ExtractionItem | null;
  isLoading: boolean;
  error?: string | null;
  result?: AdminMutationResult | null;
  onClose: () => void;
  onSubmit: (payload: {
    itemId: string;
    newValue: string;
    source: string;
    reason: string;
  }) => Promise<AdminMutationResult>;
}) {
  const [newValue, setNewValue] = useState("");
  const [source, setSource] = useState("admin");
  const [reason, setReason] = useState("");
  const [validation, setValidation] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidation(null);

    if (!item) {
      return;
    }

    if (!newValue.trim() || !reason.trim()) {
      setValidation("Nuevo valor y motivo son obligatorios.");
      return;
    }

    await onSubmit({
      itemId: item.id,
      newValue: newValue.trim(),
      source,
      reason: reason.trim(),
    });
  }

  return (
    <ResponsiveDrawer open={Boolean(item)} title="Corregir dato extraido" onClose={onClose}>
      {item ? (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="rounded-lg border border-labora-ui bg-labora-ivory p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-labora-gray">Campo</p>
            <p className="mt-1 font-semibold text-labora-charcoal">{item.field}</p>
            <p className="mt-2 text-sm text-labora-gray">Valor actual: {item.value}</p>
            <p className="mt-1 text-sm text-labora-gray">
              Fuente: {item.documentName}{item.page ? `, pagina ${item.page}` : ""}
            </p>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Nuevo valor
            <input
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Fuente de correccion
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="document">Documento</option>
              <option value="user">Usuario</option>
              <option value="ocr">OCR corregido</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Motivo obligatorio
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              className="rounded-lg border border-labora-ui px-3 py-2 text-sm"
            />
          </label>
          <Pill tone={item.affectsCalculation ? "amber" : "gray"}>
            {item.affectsCalculation ? "Afecta analisis/calculo" : "No afecta calculo"}
          </Pill>
          {validation ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{validation}</div> : null}
          <FormMessage error={error} result={result} />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-4 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
          >
            {isLoading ? "Guardando..." : "Guardar correccion"}
          </button>
        </form>
      ) : null}
    </ResponsiveDrawer>
  );
}

export function DocumentStatusBadge({ status }: { status: AdminDocument["status"] }) {
  const tone: Tone =
    status === "valid" || status === "valid_with_observations"
      ? "green"
      : status === "requires_reload" || status === "illegible" || status === "ocr_failed"
        ? "red"
        : "amber";

  return <Pill tone={tone}>{documentStatusLabels[status]}</Pill>;
}

export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-labora-ui bg-white/95 p-3 shadow-panel backdrop-blur md:hidden">
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

export function LinkButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
    >
      {children}
    </Link>
  );
}

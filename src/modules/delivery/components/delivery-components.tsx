"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Eye,
  FileArchive,
  FileCheck2,
  FileClock,
  FileSpreadsheet,
  FileText,
  History,
  LockKeyhole,
  Mail,
  MessageSquarePlus,
  RefreshCcw,
  Scale,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  DeliveryPackage,
  DeliveryPackageStatus,
  DeliveryTimelineEvent,
  DownloadFile,
  DownloadFileCategory,
  DownloadFileStatus,
  ShareLink,
  SharePermission,
} from "@/src/modules/delivery/api/delivery.types";
import {
  actorRoleLabels,
  canDownloadFile,
  fileCategoryLabels,
  formatBytes,
  formatDeliveryDate,
  formatShortDate,
  getDeliveryPackageStatusMeta,
  getDownloadFileStatusMeta,
  getShareLinkStatusMeta,
  sharePermissionLabels,
  type DeliveryTone,
} from "@/src/modules/delivery/utils/delivery-formatters";

const toneClasses: Record<DeliveryTone, string> = {
  neutral: "border-labora-ui bg-labora-ivory text-labora-gray",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  deep: "border-labora-deep/20 bg-labora-deep text-white",
};

const fileCategoryIcons: Record<DownloadFileCategory, typeof FileText> = {
  executive_report: FileCheck2,
  technical_report: FileText,
  inconsistency_matrix: FileSpreadsheet,
  calculation_sheet: FileSpreadsheet,
  legal_claim: Scale,
  petition: Mail,
  lawsuit_draft: Scale,
  attachments_index: Archive,
  traceability_log: History,
  supporting_document: FileArchive,
  other: FileText,
};

function getEventLabel(event: DeliveryTimelineEvent) {
  if (event.label) {
    return event.label;
  }

  const labels: Record<string, string> = {
    package_created: "Paquete creado",
    document_generated: "Documento generado",
    document_available: "Documento disponible",
    file_downloaded: "Archivo descargado",
    share_link_created: "Link compartido creado",
    share_link_opened: "Link compartido abierto",
    share_link_revoked: "Link revocado",
    complement_requested: "Solicitud de complemento",
    case_closed: "Caso cerrado",
  };

  return labels[event.eventType] || "Movimiento de entrega";
}

export function DeliveryStatusBadge({
  status,
  kind = "package",
  label,
}: {
  status: DeliveryPackageStatus | DownloadFileStatus;
  kind?: "package" | "file";
  label?: string;
}) {
  const meta =
    kind === "file"
      ? getDownloadFileStatusMeta(status as DownloadFileStatus)
      : getDeliveryPackageStatusMeta(status as DeliveryPackageStatus);

  return (
    <span
      className={cn(
        "inline-flex min-h-7 w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[meta.tone],
      )}
    >
      {label || meta.label}
    </span>
  );
}

export function ShareLinkStatusBadge({ link }: { link: ShareLink }) {
  const meta = getShareLinkStatusMeta(link.status);

  return (
    <span
      className={cn(
        "inline-flex min-h-7 w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[meta.tone],
      )}
    >
      {meta.label}
    </span>
  );
}

export function FileCategoryIcon({
  category,
  className,
}: {
  category: DownloadFileCategory;
  className?: string;
}) {
  const Icon = fileCategoryIcons[category] || FileText;

  return <Icon className={cn("h-5 w-5", className)} aria-hidden="true" />;
}

export function DeliveryLoadingSkeleton() {
  return (
    <section className="grid gap-5">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
          <div className="h-5 w-36 animate-pulse rounded bg-labora-ui" />
          <div className="mt-5 h-4 w-full animate-pulse rounded bg-labora-ui" />
          <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-labora-ui" />
          <div className="mt-6 h-11 w-full animate-pulse rounded bg-labora-ui" />
        </div>
      ))}
    </section>
  );
}

export function DeliveryErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-lg font-semibold">No pudimos cargar la entrega final</h2>
            <p className="mt-1 text-sm leading-6">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
      </div>
    </section>
  );
}

export function DeliveryEmptyState({ caseId }: { caseId: string }) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <FileClock className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Aun no hay una entrega final disponible.
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Te avisaremos cuando tus documentos esten listos.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/app/cases/${caseId}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Volver al resumen
          </Link>
          <Link
            href={`/app/cases/${caseId}/progress`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep"
          >
            Ver progreso
          </Link>
        </div>
      </div>
    </section>
  );
}

export function DeliverySummaryCard({
  deliveryPackage,
  availableFiles,
  canDownload,
  canShare,
  shareHref,
  onDownloadAll,
  isDownloading,
}: {
  deliveryPackage: DeliveryPackage;
  availableFiles: number;
  canDownload: boolean;
  canShare: boolean;
  shareHref: string;
  onDownloadAll: () => void;
  isDownloading?: boolean;
}) {
  const meta = getDeliveryPackageStatusMeta(deliveryPackage.status);

  return (
    <section className="rounded-2xl border border-labora-green/25 bg-white p-6 shadow-panel">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <DeliveryStatusBadge status={deliveryPackage.status} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Version {deliveryPackage.version}
            </span>
          </div>
          <h1 className="mt-4 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
            {deliveryPackage.title || "Tu expediente final esta listo"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-labora-gray">
            {deliveryPackage.description || meta.message}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-labora-gray">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Fecha de entrega {formatDeliveryDate(deliveryPackage.completedAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-labora-ui bg-labora-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-gray">
            Paquete final
          </p>
          <p className="mt-3 font-heading text-3xl font-semibold text-labora-deep">
            {availableFiles}
          </p>
          <p className="mt-1 text-sm text-labora-gray">documentos disponibles</p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={onDownloadAll}
              disabled={!canDownload || isDownloading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isDownloading ? "Preparando..." : "Descargar todo"}
            </button>
            <Link
              href={shareHref}
              aria-disabled={!canShare}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold",
                canShare
                  ? "text-labora-deep hover:bg-labora-ivory"
                  : "pointer-events-none text-labora-gray",
              )}
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Compartir con abogado
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DeliveryAiSummaryCard({
  summary,
  confidence,
}: {
  summary?: string | null;
  confidence?: number | null;
}) {
  if (!summary) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-900 shadow-panel">
      <div className="flex gap-3">
        <Sparkles className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">
            Resumen generado automaticamente
          </p>
          <p className="mt-2 text-sm leading-7">{summary}</p>
          <p className="mt-3 text-xs leading-5 text-sky-800">
            Este resumen es informativo y no reemplaza la revision profesional del documento.
            {typeof confidence === "number" ? ` Confianza estimada: ${Math.round(confidence * 100)}%.` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

export function DeliveryNextStepsPanel({
  caseId,
  canShare,
  canComplement,
  canClose,
}: {
  caseId: string;
  canShare: boolean;
  canComplement: boolean;
  canClose: boolean;
}) {
  const steps = [
    {
      label: "Compartir con abogado",
      description: "Crea un enlace temporal con permisos limitados.",
      href: `/app/cases/${caseId}/delivery/share`,
      icon: Share2,
      enabled: canShare,
    },
    {
      label: "Solicitar revision profesional",
      description: "Pide apoyo de un profesional si necesitas criterio adicional.",
      href: `/app/cases/${caseId}/professional-review/request`,
      icon: ShieldCheck,
      enabled: true,
    },
    {
      label: "Complementar expediente",
      description: "Reporta nuevos soportes o informacion posterior.",
      href: `/app/cases/${caseId}/delivery/complement`,
      icon: MessageSquarePlus,
      enabled: canComplement,
    },
    {
      label: "Cerrar caso",
      description: "Conserva documentos e historial y bloquea acciones sensibles.",
      href: `/app/cases/${caseId}/delivery/close`,
      icon: CheckCircle2,
      enabled: canClose,
    },
  ];

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Proximos pasos
        </h2>
        <p className="mt-1 text-sm text-labora-gray">
          Acciones sugeridas despues de recibir la entrega final.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            aria-disabled={!step.enabled}
            className={cn(
              "flex min-h-24 items-start gap-3 rounded-lg border border-labora-ui p-4 transition",
              step.enabled
                ? "bg-white text-labora-charcoal hover:bg-labora-ivory"
                : "pointer-events-none bg-labora-ivory text-labora-gray",
            )}
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-labora-mint/35 text-labora-deep">
              <step.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{step.label}</span>
              <span className="mt-1 block text-xs leading-5 text-labora-gray">
                {step.description}
              </span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-labora-gray" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function DownloadButton({
  file,
  onDownload,
  isDownloading,
  fullWidth = false,
}: {
  file: DownloadFile;
  onDownload: (file: DownloadFile) => void;
  isDownloading?: boolean;
  fullWidth?: boolean;
}) {
  const enabled = canDownloadFile(file.status, file.isUnlocked);
  const meta = getDownloadFileStatusMeta(file.status);

  return (
    <button
      type="button"
      onClick={() => onDownload(file)}
      disabled={!enabled || isDownloading}
      title={!enabled ? meta.message : undefined}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed",
        fullWidth && "w-full",
        enabled
          ? "bg-labora-green text-white hover:bg-labora-deep"
          : "border border-labora-ui bg-labora-ivory text-labora-gray",
      )}
    >
      {enabled ? (
        <Download className="h-4 w-4" aria-hidden="true" />
      ) : (
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
      )}
      {isDownloading ? "Descargando..." : enabled ? "Descargar" : meta.label}
    </button>
  );
}

export function DownloadFilesTable({
  files,
  onDownload,
  onViewDetail,
  downloadingFileId,
}: {
  files: DownloadFile[];
  onDownload: (file: DownloadFile) => void;
  onViewDetail?: (file: DownloadFile) => void;
  downloadingFileId?: string | null;
}) {
  if (!files.length) {
    return (
      <section className="rounded-2xl border border-labora-ui bg-white p-5 text-sm text-labora-gray shadow-panel">
        Aun no hay documentos finales disponibles.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-labora-ui bg-white shadow-panel">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="border-b border-labora-ui bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3 font-semibold">Documento</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Tamano</th>
              <th className="px-4 py-3 font-semibold">Ultima descarga</th>
              <th className="px-4 py-3 font-semibold">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui">
            {files.map((file) => (
              <tr key={file.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-labora-ivory text-labora-deep">
                      <FileCategoryIcon category={file.category} />
                    </span>
                    <div>
                      <p className="font-semibold text-labora-charcoal">{file.fileName}</p>
                      <p className="mt-1 text-xs text-labora-gray">
                        Generado {formatDeliveryDate(file.generatedAt)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-labora-gray">{fileCategoryLabels[file.category]}</td>
                <td className="px-4 py-4">
                  <DeliveryStatusBadge status={file.status} kind="file" />
                </td>
                <td className="px-4 py-4 text-labora-gray">{formatBytes(file.sizeBytes)}</td>
                <td className="px-4 py-4 text-labora-gray">
                  {file.lastDownloadedAt ? formatDeliveryDate(file.lastDownloadedAt) : "Sin descargas"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <DownloadButton
                      file={file}
                      onDownload={onDownload}
                      isDownloading={downloadingFileId === file.id}
                    />
                    {onViewDetail ? (
                      <button
                        type="button"
                        onClick={() => onViewDetail(file)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Ver detalle
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {files.map((file) => (
          <article key={file.id} className="rounded-lg border border-labora-ui p-4">
            <div className="flex gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-labora-ivory text-labora-deep">
                <FileCategoryIcon category={file.category} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-semibold text-labora-charcoal">
                  {file.fileName}
                </h3>
                <p className="mt-1 text-xs text-labora-gray">{fileCategoryLabels[file.category]}</p>
              </div>
              <DeliveryStatusBadge status={file.status} kind="file" />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-labora-gray">
              <div>
                <dt className="font-semibold text-labora-charcoal">Tamano</dt>
                <dd className="mt-1">{formatBytes(file.sizeBytes)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-labora-charcoal">Descargas</dt>
                <dd className="mt-1">{file.downloadCount}</dd>
              </div>
            </dl>
            <div className="mt-4 grid gap-2">
              <DownloadButton
                file={file}
                onDownload={onDownload}
                isDownloading={downloadingFileId === file.id}
                fullWidth
              />
              {onViewDetail ? (
                <button
                  type="button"
                  onClick={() => onViewDetail(file)}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Ver detalle
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DeliveryTimeline({
  events,
  compact = false,
}: {
  events: DeliveryTimelineEvent[];
  compact?: boolean;
}) {
  if (!events.length) {
    return (
      <section className="rounded-2xl border border-labora-ui bg-white p-5 text-sm text-labora-gray shadow-panel">
        Aun no hay eventos de trazabilidad para esta entrega.
      </section>
    );
  }

  const visibleEvents = compact ? events.slice(0, 4) : events;

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Timeline de entrega
        </h2>
      </div>
      <ol className="relative grid gap-4 border-l border-labora-ui pl-5">
        {visibleEvents.map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-labora-green bg-white">
              <span className="h-2 w-2 rounded-full bg-labora-green" />
            </span>
            <div className="flex flex-col gap-2 rounded-lg border border-labora-ui bg-labora-ivory p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-labora-charcoal">
                  {getEventLabel(event)}
                </p>
                {event.description ? (
                  <p className="mt-1 text-sm leading-6 text-labora-gray">
                    {event.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs font-medium text-labora-gray">
                  Actor: {actorRoleLabels[event.actorRole]}
                </p>
              </div>
              <time className="shrink-0 text-xs font-medium text-labora-gray">
                {formatDeliveryDate(event.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ShareLinksTable({
  links,
  onCopy,
  onRevoke,
  busyLinkId,
}: {
  links: ShareLink[];
  onCopy?: (link: ShareLink) => void;
  onRevoke: (link: ShareLink) => void;
  busyLinkId?: string | null;
}) {
  if (!links.length) {
    return (
      <section className="rounded-2xl border border-labora-ui bg-white p-5 text-sm text-labora-gray shadow-panel">
        Aun no hay enlaces compartidos activos para esta entrega.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-labora-ui bg-white shadow-panel">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-labora-ui bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3 font-semibold">Destinatario</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Permisos</th>
              <th className="px-4 py-3 font-semibold">Vistas</th>
              <th className="px-4 py-3 font-semibold">Expira</th>
              <th className="px-4 py-3 font-semibold">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui">
            {links.map((link) => (
              <tr key={link.id}>
                <td className="px-4 py-4">
                  <p className="font-semibold text-labora-charcoal">
                    {link.recipientName || "Destinatario"}
                  </p>
                  <p className="mt-1 text-xs text-labora-gray">
                    {link.recipientEmail || "Sin correo"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <ShareLinkStatusBadge link={link} />
                </td>
                <td className="px-4 py-4 text-labora-gray">
                  {link.permissions.map((item) => sharePermissionLabels[item]).join(", ")}
                </td>
                <td className="px-4 py-4 text-labora-gray">
                  {link.viewCount}{link.maxViews ? ` / ${link.maxViews}` : ""}
                </td>
                <td className="px-4 py-4 text-labora-gray">{formatShortDate(link.expiresAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {onCopy ? (
                      <button
                        type="button"
                        onClick={() => onCopy(link)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        Copiar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onRevoke(link)}
                      disabled={link.status !== "active" || busyLinkId === link.id}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-labora-ui disabled:text-labora-gray"
                    >
                      <Ban className="h-4 w-4" aria-hidden="true" />
                      {busyLinkId === link.id ? "Revocando..." : "Revocar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {links.map((link) => (
          <article key={link.id} className="rounded-lg border border-labora-ui p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-labora-charcoal">
                  {link.recipientName || "Destinatario"}
                </h3>
                <p className="mt-1 break-words text-xs text-labora-gray">
                  {link.recipientEmail || "Sin correo"}
                </p>
              </div>
              <ShareLinkStatusBadge link={link} />
            </div>
            <dl className="mt-4 grid gap-2 text-xs text-labora-gray">
              <div>
                <dt className="font-semibold text-labora-charcoal">Permisos</dt>
                <dd className="mt-1">{link.permissions.map((item) => sharePermissionLabels[item]).join(", ")}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="font-semibold text-labora-charcoal">Vistas</dt>
                  <dd className="mt-1">{link.viewCount}{link.maxViews ? ` / ${link.maxViews}` : ""}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-labora-charcoal">Expira</dt>
                  <dd className="mt-1">{formatShortDate(link.expiresAt)}</dd>
                </div>
              </div>
            </dl>
            <div className="mt-4 grid gap-2">
              {onCopy ? (
                <button
                  type="button"
                  onClick={() => onCopy(link)}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copiar
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onRevoke(link)}
                disabled={link.status !== "active" || busyLinkId === link.id}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-labora-ui disabled:text-labora-gray"
              >
                <Ban className="h-4 w-4" aria-hidden="true" />
                {busyLinkId === link.id ? "Revocando..." : "Revocar"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ShareLinkResultCard({
  url,
  expiresAt,
  permissions,
  onCopy,
}: {
  url: string;
  expiresAt: string;
  permissions: SharePermission[];
  onCopy: () => void;
}) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-panel">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold">Link generado</h2>
          <p className="mt-2 text-sm leading-6">
            Comparte este enlace solo con personas de confianza. El acceso es temporal y puede ser revocado en cualquier momento.
          </p>
          <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-3">
            <p className="break-all text-sm font-semibold text-labora-deep">{url}</p>
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Vence</dt>
              <dd className="mt-1">{formatDeliveryDate(expiresAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Permisos</dt>
              <dd className="mt-1">{permissions.map((item) => sharePermissionLabels[item]).join(", ")}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onCopy}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copiar enlace
          </button>
        </div>
      </div>
    </section>
  );
}

export function DeliveryMobileActions({
  canDownload,
  canShare,
  onDownloadAll,
  shareHref,
}: {
  canDownload: boolean;
  canShare: boolean;
  onDownloadAll: () => void;
  shareHref: string;
}) {
  return (
    <div className="fixed inset-x-4 bottom-4 z-20 grid grid-cols-2 gap-2 md:hidden">
      <button
        type="button"
        onClick={onDownloadAll}
        disabled={!canDownload}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-3 text-sm font-semibold text-white shadow-panel disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Descargar
      </button>
      <Link
        href={shareHref}
        aria-disabled={!canShare}
        className={cn(
          "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold shadow-panel",
          canShare
            ? "text-labora-deep"
            : "pointer-events-none text-labora-gray",
        )}
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        Compartir
      </Link>
    </div>
  );
}

export function SharedDeliveryAccessState({
  status,
  message,
}: {
  status: "expired" | "revoked" | "max_views_reached" | "disabled" | "error";
  message?: string | null;
}) {
  const copy = {
    expired: "Este enlace ya expiro.",
    revoked: "Este enlace fue revocado.",
    max_views_reached: "Este enlace alcanzo el limite de vistas.",
    disabled: "Este enlace no esta disponible.",
    error: "No pudimos cargar el expediente compartido.",
  }[status];

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-panel">
      <div className="flex gap-3">
        {status === "expired" ? (
          <Clock3 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        ) : status === "revoked" ? (
          <XCircle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        ) : (
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        )}
        <div>
          <h1 className="font-heading text-xl font-semibold">{copy}</h1>
          <p className="mt-2 text-sm leading-6">
            {message || "Solicita a quien compartio el expediente que genere un nuevo enlace si necesitas acceder."}
          </p>
        </div>
      </div>
    </section>
  );
}

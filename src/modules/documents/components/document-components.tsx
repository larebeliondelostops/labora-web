"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FileUp,
  Info,
  ListChecks,
  Loader2,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  DocumentDetail,
  DocumentItem,
  DocumentReadiness,
  DocumentTypeDefinition,
  DocumentValidation,
  UpdateDocumentRequest,
} from "@/src/modules/documents/api/documents.types";
import type { UploadQueueItem } from "@/src/modules/documents/hooks/useDocuments";
import {
  documentStatusLabel,
  formatBytes,
  formatConfidence,
  getDocumentDisplayName,
  getPrimaryDocumentType,
  getStatusTone,
  getValidationTone,
  isLowConfidence,
  readinessCopy,
  validationResultLabel,
  validationStatusLabel,
  validateDocumentFile,
} from "@/src/modules/documents/utils/document-ui";
import { formatDateTime } from "@/src/modules/cases/utils/caseFormatters";

type Tone = "success" | "warning" | "danger" | "neutral" | "progress";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-labora-ui bg-white text-labora-gray",
  progress: "border-labora-mint bg-labora-mint/20 text-labora-deep",
};

const toneIcon: Record<Tone, typeof Circle> = {
  success: CheckCircle2,
  warning: AlertCircle,
  danger: XCircle,
  neutral: Circle,
  progress: Loader2,
};

function IconForTone({ tone }: { tone: Tone }) {
  const Icon = toneIcon[tone];

  return (
    <Icon
      className={cn("h-4 w-4", tone === "progress" && "animate-spin")}
      aria-hidden="true"
    />
  );
}

export function RetryButton({
  onClick,
  children = "Reintentar",
  className,
}: {
  onClick: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
        className,
      )}
    >
      <RotateCcw className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}

export function InlineError({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="font-medium leading-6">{message}</p>
      </div>
      {onRetry ? <RetryButton onClick={onRetry} className="mt-4" /> : null}
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <div className="h-4 w-40 animate-pulse rounded bg-labora-ui" />
          <div className="mt-4 h-5 w-64 max-w-full animate-pulse rounded bg-labora-ui" />
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="h-10 animate-pulse rounded bg-labora-ui" />
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
  description,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-labora-mint bg-white p-8 text-center shadow-panel">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-labora-ivory text-labora-green">
        <FileUp className="h-7 w-7" aria-hidden="true" />
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
      <SensitiveDataNotice className="mx-auto mt-6 max-w-2xl text-left" />
    </section>
  );
}

export function SensitiveDataNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
      <p>
        Tus documentos pueden contener datos personales, laborales, salariales o
        pensionales. Labora los usara unicamente para validar y preparar tu
        expediente.
      </p>
    </div>
  );
}

export function CaseFlowStepper() {
  const steps = [
    "Registro",
    "Consentimiento",
    "Expediente",
    "Documentos",
    "IA preliminar",
  ];

  return (
    <nav
      aria-label="Progreso del expediente"
      className="overflow-x-auto rounded-2xl border border-labora-ui bg-white p-3 shadow-panel"
    >
      <ol className="flex min-w-max items-center gap-2">
        {steps.map((step, index) => {
          const completed = index < 3;
          const current = step === "Documentos";

          return (
            <li key={step} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold",
                  completed && "border-emerald-200 bg-emerald-50 text-emerald-800",
                  current && "border-labora-green bg-labora-green text-white",
                  !completed && !current && "border-labora-ui bg-white text-labora-gray",
                )}
                aria-current={current ? "step" : undefined}
              >
                {completed ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                {current ? <FileText className="h-4 w-4" aria-hidden="true" /> : null}
                {!completed && !current ? <Circle className="h-4 w-4" aria-hidden="true" /> : null}
                {step}
              </span>
              {index < steps.length - 1 ? (
                <ChevronRight className="h-4 w-4 text-labora-gray" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function DocumentStatusChip({
  status,
  validationResult,
}: Pick<DocumentItem, "status" | "validationResult">) {
  const tone = getStatusTone(status, validationResult);

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
      )}
    >
      <IconForTone tone={tone} />
      {documentStatusLabel[status]}
    </span>
  );
}

export function DocumentValidationBadge({
  validationStatus,
  validationResult,
}: Pick<DocumentItem, "validationStatus" | "validationResult">) {
  const tone = getValidationTone(validationStatus, validationResult);
  const label = validationResult
    ? validationResultLabel[validationResult]
    : validationStatusLabel[validationStatus];

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
      )}
    >
      <IconForTone tone={tone} />
      {label}
    </span>
  );
}

export function DocumentTypeSelect({
  id,
  documentTypes,
  value,
  onChange,
  disabled,
  label = "Tipo documental",
}: {
  id?: string;
  documentTypes: DocumentTypeDefinition[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
      {label}
      <select
        id={id}
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-medium text-labora-charcoal outline-none transition focus:border-labora-green focus:ring-2 focus:ring-labora-green/15 disabled:cursor-not-allowed disabled:bg-labora-ivory disabled:text-labora-gray"
      >
        <option value="">Selecciona un tipo</option>
        {documentTypes.map((type) => (
          <option key={type.code} value={type.code}>
            {type.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RequiredDocumentChecklist({
  documentTypes,
  documents,
}: {
  documentTypes: DocumentTypeDefinition[];
  documents: DocumentItem[];
}) {
  const requiredTypes = documentTypes.filter((type) => type.isRequiredForBasicFlow);
  const items = requiredTypes.length ? requiredTypes : [getPrimaryDocumentType(documentTypes)];

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Checklist documental
        </h2>
      </div>
      <ul className="mt-4 grid gap-3">
        {items.map((type) => {
          const completed = documents.some(
            (document) =>
              document.status !== "deleted" &&
              document.status !== "replaced" &&
              (document.documentType?.code === type.code ||
                (type.isPrimaryCandidate && document.isPrimary)),
          );

          return (
            <li
              key={type.code}
              className="flex items-start gap-3 rounded-xl border border-labora-ui bg-labora-ivory/60 p-3"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  completed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {completed ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-labora-charcoal">{type.name}</p>
                <p className="mt-1 text-xs leading-5 text-labora-gray">
                  {completed ? "Cargado en el expediente." : "Pendiente para continuar."}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DocumentReadinessCard({
  readiness,
  ctaHref,
}: {
  readiness: DocumentReadiness;
  ctaHref: string;
}) {
  const copy = readinessCopy[readiness.readinessStatus];
  const canContinue =
    readiness.readinessStatus === "ready_for_preanalysis" &&
    readiness.nextAction === "continue_to_preanalysis";

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
              toneClasses[copy.tone],
            )}
          >
            <IconForTone tone={copy.tone} />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-labora-gray">{copy.description}</p>
          </div>
        </div>
        <Link
          href={ctaHref}
          aria-disabled={!canContinue}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition",
            canContinue
              ? "bg-labora-green text-white hover:bg-labora-deep"
              : "pointer-events-none border border-labora-ui bg-labora-ivory text-labora-gray",
          )}
        >
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          Continuar a validacion preliminar
        </Link>
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-xl bg-labora-ivory p-3">
          <dt className="text-labora-gray">Documentos</dt>
          <dd className="mt-1 font-semibold text-labora-charcoal">{readiness.documentsTotal}</dd>
        </div>
        <div className="rounded-xl bg-labora-ivory p-3">
          <dt className="text-labora-gray">Validados</dt>
          <dd className="mt-1 font-semibold text-labora-charcoal">{readiness.documentsValidated}</dd>
        </div>
        <div className="rounded-xl bg-labora-ivory p-3">
          <dt className="text-labora-gray">Observaciones</dt>
          <dd className="mt-1 font-semibold text-labora-charcoal">
            {readiness.documentsWithWarnings}
          </dd>
        </div>
        <div className="rounded-xl bg-labora-ivory p-3">
          <dt className="text-labora-gray">Rechazados</dt>
          <dd className="mt-1 font-semibold text-labora-charcoal">{readiness.documentsRejected}</dd>
        </div>
      </dl>
      {readiness.blockingIssues.length || readiness.warnings.length ? (
        <DocumentWarningsList
          className="mt-4"
          warnings={[...readiness.blockingIssues, ...readiness.warnings]}
        />
      ) : null}
    </section>
  );
}

export function DocumentUploadProgressItem({
  item,
  onCancel,
}: {
  item: UploadQueueItem;
  onCancel?: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-labora-ui bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-labora-charcoal">{item.fileName}</p>
          <p className="mt-1 text-xs text-labora-gray">{formatBytes(item.sizeBytes)}</p>
        </div>
        {item.status === "uploading" || item.status === "queued" ? (
          <button
            type="button"
            onClick={() => onCancel?.(item.id)}
            className="rounded-lg p-2 text-labora-gray transition hover:bg-labora-ivory hover:text-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
            title="Cancelar carga"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Cancelar carga</span>
          </button>
        ) : null}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-labora-ui">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            item.status === "error" && "bg-red-500",
            item.status === "canceled" && "bg-labora-gray",
            item.status === "success" && "bg-labora-green",
            (item.status === "queued" || item.status === "uploading") && "bg-labora-mint",
          )}
          style={{ width: `${item.progress}%` }}
        />
      </div>
      {item.error ? <p className="mt-2 text-xs font-medium text-red-700">{item.error}</p> : null}
    </div>
  );
}

export function DocumentUploadDropzone({
  caseId,
  documentTypes,
  uploadItems = [],
  maxFiles = 5,
  disabled,
  onUpload,
  onCancelUpload,
  onUploadStarted,
  onUploadCompleted,
  onUploadFailed,
}: {
  caseId: string;
  documentTypes: DocumentTypeDefinition[];
  uploadItems?: UploadQueueItem[];
  maxFiles?: number;
  disabled?: boolean;
  onUpload: (
    files: File[],
    options: { documentTypeCode?: string; isPrimary?: boolean },
  ) => Promise<DocumentItem[] | void>;
  onCancelUpload?: (id: string) => void;
  onUploadStarted?: (file: File) => void;
  onUploadCompleted?: (document: DocumentItem) => void;
  onUploadFailed?: (file: File, error: Error) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documentTypeCode, setDocumentTypeCode] = useState(getPrimaryDocumentType(documentTypes).code);
  const [isPrimary, setIsPrimary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDocumentTypeCode((current) => current || getPrimaryDocumentType(documentTypes).code);
  }, [documentTypes]);

  const selectedType = documentTypes.find((type) => type.code === documentTypeCode);
  const maxSize = selectedType?.maxSizeMb || 50;

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    setError(null);

    if (!files.length) {
      return;
    }

    if (files.length > maxFiles) {
      setError("Superaste la cantidad maxima de archivos permitida.");
      return;
    }

    const validationError = files
      .map((file) => validateDocumentFile({ file, documentTypes, documentTypeCode }))
      .find(Boolean);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      files.forEach((file) => onUploadStarted?.(file));
      const documents = await onUpload(files, { documentTypeCode, isPrimary });
      documents?.forEach((document) => onUploadCompleted?.(document));
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (requestError) {
      const firstFile = files[0];
      const errorObject =
        requestError instanceof Error
          ? requestError
          : new Error("No pudimos cargar el documento.");
      setError(errorObject.message);
      onUploadFailed?.(firstFile, errorObject);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) {
      return;
    }
    handleFiles(event.dataTransfer.files);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) {
      return;
    }
    handleFiles(event.target.files);
  }

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div
          role="button"
          tabIndex={0}
          aria-label="Seleccionar documentos del expediente"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
            isDragging
              ? "border-labora-green bg-labora-mint/20"
              : "border-labora-mint bg-labora-ivory/60 hover:bg-labora-ivory",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple={maxFiles > 1}
            className="sr-only"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            disabled={disabled}
            data-case-id={caseId}
            onChange={handleInputChange}
          />
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-labora-green shadow-sm">
            <UploadCloud className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-heading text-xl font-semibold text-labora-charcoal">
            Arrastra aqui tus documentos o haz clic para seleccionarlos
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-labora-gray">
            PDF, JPG o PNG. Maximo {maxSize} MB para el tipo seleccionado.
          </p>
          <button
            type="button"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
            onClick={(event) => {
              event.stopPropagation();
              inputRef.current?.click();
            }}
            disabled={disabled}
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Seleccionar archivo
          </button>
        </div>

        <div className="grid content-start gap-4">
          <DocumentTypeSelect
            documentTypes={documentTypes}
            value={documentTypeCode}
            onChange={(value) => {
              setDocumentTypeCode(value);
              const type = documentTypes.find((item) => item.code === value);
              setIsPrimary(Boolean(type?.isPrimaryCandidate));
            }}
          />
          <label className="flex items-start gap-3 rounded-xl border border-labora-ui bg-labora-ivory p-3 text-sm text-labora-charcoal">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(event) => setIsPrimary(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green focus:ring-labora-green"
            />
            <span>
              <span className="block font-semibold">Marcar como documento principal</span>
              <span className="mt-1 block text-xs leading-5 text-labora-gray">
                Si aun no hay historia laboral, conviene marcar el PDF principal.
              </span>
            </span>
          </label>
          <SensitiveDataNotice />
        </div>
      </div>

      {error ? <InlineError message={error} /> : null}

      {uploadItems.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {uploadItems.map((item) => (
            <DocumentUploadProgressItem
              key={item.id}
              item={item}
              onCancel={onCancelUpload}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function DocumentsTable({
  documents,
  loading,
  onView,
  onChangeType,
  onReplace,
  onDelete,
}: {
  documents: DocumentItem[];
  loading?: boolean;
  onView: (documentId: string) => void;
  onChangeType: (document: DocumentItem) => void;
  onReplace: (document: DocumentItem) => void;
  onDelete: (document: DocumentItem) => void;
}) {
  if (loading) {
    return <LoadingSkeleton rows={2} />;
  }

  return (
    <section className="rounded-2xl border border-labora-ui bg-white shadow-panel">
      <div className="border-b border-labora-ui p-5">
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Documentos cargados
        </h2>
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-5 py-3 font-semibold">Documento</th>
              <th className="px-5 py-3 font-semibold">Tipo</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold">Validacion</th>
              <th className="px-5 py-3 font-semibold">Paginas</th>
              <th className="px-5 py-3 font-semibold">Tamano</th>
              <th className="px-5 py-3 font-semibold">Fecha</th>
              <th className="px-5 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui">
            {documents.map((document) => (
              <tr key={document.id} className="align-top">
                <td className="max-w-[260px] px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onView(document.id)}
                    className="text-left font-semibold text-labora-charcoal hover:text-labora-green"
                  >
                    {getDocumentDisplayName(document)}
                  </button>
                  {document.isDuplicate ? (
                    <p className="mt-1 text-xs text-amber-700">
                      Este archivo parece estar repetido en este expediente.
                    </p>
                  ) : null}
                </td>
                <td className="px-5 py-4 text-labora-gray">
                  {document.documentType?.name || "Sin clasificar"}
                </td>
                <td className="px-5 py-4">
                  <DocumentStatusChip
                    status={document.status}
                    validationResult={document.validationResult}
                  />
                </td>
                <td className="px-5 py-4">
                  <DocumentValidationBadge
                    validationStatus={document.validationStatus}
                    validationResult={document.validationResult}
                  />
                </td>
                <td className="px-5 py-4 text-labora-gray">{document.pageCount || "-"}</td>
                <td className="px-5 py-4 text-labora-gray">{formatBytes(document.sizeBytes)}</td>
                <td className="px-5 py-4 text-labora-gray">{formatDateTime(document.createdAt)}</td>
                <td className="px-5 py-4">
                  <DocumentActions
                    document={document}
                    onView={onView}
                    onChangeType={onChangeType}
                    onReplace={onReplace}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-4 lg:hidden">
        {documents.map((document) => (
          <DocumentCardMobile
            key={document.id}
            document={document}
            onView={onView}
            onChangeType={onChangeType}
            onReplace={onReplace}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

function DocumentActions({
  document,
  onView,
  onChangeType,
  onReplace,
  onDelete,
}: {
  document: DocumentItem;
  onView: (documentId: string) => void;
  onChangeType: (document: DocumentItem) => void;
  onReplace: (document: DocumentItem) => void;
  onDelete: (document: DocumentItem) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onView(document.id)}
        className="rounded-lg p-2 text-labora-gray transition hover:bg-labora-ivory hover:text-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
        title="Ver documento"
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Ver documento</span>
      </button>
      <button
        type="button"
        onClick={() => onChangeType(document)}
        className="rounded-lg p-2 text-labora-gray transition hover:bg-labora-ivory hover:text-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
        title="Cambiar tipo"
      >
        <Edit3 className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Cambiar tipo</span>
      </button>
      <button
        type="button"
        onClick={() => onReplace(document)}
        className="rounded-lg p-2 text-labora-gray transition hover:bg-labora-ivory hover:text-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
        title="Reemplazar"
      >
        <FileUp className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Reemplazar</span>
      </button>
      <button
        type="button"
        onClick={() => onDelete(document)}
        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        title="Eliminar"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Eliminar</span>
      </button>
    </div>
  );
}

export function DocumentCardMobile({
  document,
  onView,
  onChangeType,
  onReplace,
  onDelete,
}: {
  document: DocumentItem;
  onView: (documentId: string) => void;
  onChangeType: (document: DocumentItem) => void;
  onReplace: (document: DocumentItem) => void;
  onDelete: (document: DocumentItem) => void;
}) {
  return (
    <article className="rounded-2xl border border-labora-ui bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onView(document.id)}
            className="text-left font-semibold text-labora-charcoal"
          >
            {getDocumentDisplayName(document)}
          </button>
          <p className="mt-1 text-sm text-labora-gray">
            {document.documentType?.name || "Sin clasificar"} · {formatBytes(document.sizeBytes)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <DocumentStatusChip status={document.status} validationResult={document.validationResult} />
        <DocumentValidationBadge
          validationStatus={document.validationStatus}
          validationResult={document.validationResult}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <DocumentActions
          document={document}
          onView={onView}
          onChangeType={onChangeType}
          onReplace={onReplace}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}

export function DocumentWarningsList({
  warnings,
  className,
}: {
  warnings: Array<{ code: string; message: string; page?: number }>;
  className?: string;
}) {
  if (!warnings.length) {
    return null;
  }

  return (
    <ul className={cn("grid gap-2", className)}>
      {warnings.map((warning, index) => (
        <li
          key={`${warning.code}-${index}`}
          className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800"
        >
          <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {warning.message}
            {warning.page ? ` Pagina ${warning.page}.` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DocumentValidationPanel({
  validation,
  status,
  onReplace,
  onConfirmReview,
}: {
  validation?: DocumentValidation;
  status: DocumentItem["status"];
  onReplace?: () => void;
  onConfirmReview?: () => void;
}) {
  const result = validation?.result;
  const state = result || (status === "failed" ? "rejected" : undefined);
  const copy = {
    accepted: {
      title: "Documento apto para continuar",
      description: "El archivo se pudo leer correctamente.",
      tone: "success" as Tone,
    },
    accepted_with_warnings: {
      title: "Documento apto con observaciones",
      description: "Puedes continuar, pero revisa estas advertencias.",
      tone: "warning" as Tone,
    },
    requires_review: {
      title: "Documento pendiente de revision",
      description: "Necesitamos que confirmes algunos datos o reemplaces el archivo.",
      tone: "warning" as Tone,
    },
    rejected: {
      title: "El documento no se puede usar",
      description: "Sube una nueva version para continuar.",
      tone: "danger" as Tone,
    },
    pending: {
      title: "No pudimos validar el documento en este momento",
      description: "Intenta nuevamente o vuelve mas tarde.",
      tone: "progress" as Tone,
    },
  }[state || "pending"];

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
            toneClasses[copy.tone],
          )}
        >
          <IconForTone tone={copy.tone} />
        </span>
        <div>
          <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
            {copy.title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-labora-gray">{copy.description}</p>
        </div>
      </div>
      {validation ? (
        <div className="mt-5 grid gap-3 text-sm">
          <div className="rounded-xl bg-labora-ivory p-3">
            <span className="text-labora-gray">Puntaje de lectura</span>
            <strong className="ml-2 text-labora-charcoal">{Math.round(validation.score * 100)}%</strong>
          </div>
          {Object.keys(validation.checks).length ? (
            <ul className="grid gap-2">
              {Object.entries(validation.checks).map(([key, passed]) => (
                <li key={key} className="flex items-center gap-2 text-labora-gray">
                  {passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                  )}
                  {key.replace(/_/g, " ")}
                </li>
              ))}
            </ul>
          ) : null}
          <DocumentWarningsList warnings={[...validation.warnings, ...validation.errors]} />
        </div>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {state === "rejected" || state === "requires_review" ? (
          <button
            type="button"
            onClick={onReplace}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Reemplazar documento
          </button>
        ) : null}
        {state === "requires_review" ? (
          <button
            type="button"
            onClick={onConfirmReview}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Confirmar revision
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function DocumentMetadataPanel({
  document,
}: {
  document: DocumentDetail;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
        Datos del documento
      </h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="font-semibold text-labora-charcoal">Archivo</dt>
          <dd className="mt-1 break-words text-labora-gray">{document.originalFilename}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Tipo documental</dt>
          <dd className="mt-1 text-labora-gray">{document.documentType?.name || "Sin clasificar"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Clasificacion</dt>
          <dd className="mt-1 text-labora-gray">{document.classificationSource}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Confianza IA</dt>
          <dd className="mt-1 text-labora-gray">{formatConfidence(document.aiConfidence)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Tamano</dt>
          <dd className="mt-1 text-labora-gray">{formatBytes(document.sizeBytes)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-labora-charcoal">Fecha</dt>
          <dd className="mt-1 text-labora-gray">{formatDateTime(document.createdAt)}</dd>
        </div>
      </dl>
      {document.isDuplicate ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Este archivo parece estar repetido en este expediente. Puedes conservarlo
          como soporte o eliminarlo para evitar duplicados.
        </div>
      ) : null}
    </section>
  );
}

export function DocumentClassificationPanel({
  document,
  documentTypes,
  onSave,
  isSaving,
  error,
}: {
  document: DocumentDetail | DocumentItem;
  documentTypes: DocumentTypeDefinition[];
  onSave: (payload: UpdateDocumentRequest) => Promise<void> | void;
  isSaving?: boolean;
  error?: string | null;
}) {
  const [documentTypeCode, setDocumentTypeCode] = useState(document.documentType?.code || "");
  const [isPrimary, setIsPrimary] = useState(document.isPrimary);
  const lowConfidence = isLowConfidence(document.aiConfidence);

  useEffect(() => {
    setDocumentTypeCode(document.documentType?.code || "");
    setIsPrimary(document.isPrimary);
  }, [document.documentType?.code, document.isPrimary]);

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <Edit3 className="h-5 w-5 text-labora-green" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
          Clasificacion documental
        </h2>
      </div>
      {lowConfidence ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          La clasificacion automatica no fue concluyente. Revisa el tipo de
          documento antes de continuar.
        </div>
      ) : null}
      <div className="mt-4 grid gap-4">
        <DocumentTypeSelect
          documentTypes={documentTypes}
          value={documentTypeCode}
          onChange={setDocumentTypeCode}
        />
        <label className="flex items-start gap-3 rounded-xl border border-labora-ui bg-labora-ivory p-3 text-sm text-labora-charcoal">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(event) => setIsPrimary(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green focus:ring-labora-green"
          />
          <span>
            <span className="block font-semibold">Usar como documento principal</span>
            <span className="mt-1 block text-xs leading-5 text-labora-gray">
              El documento principal activa la validacion preliminar del expediente.
            </span>
          </span>
        </label>
      </div>
      <InlineError message={error} />
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={isSaving || !documentTypeCode}
          onClick={() => onSave({ documentTypeCode, isPrimary })}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          Guardar clasificacion
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            setDocumentTypeCode(document.documentType?.code || "");
            setIsPrimary(document.isPrimary);
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}

export function DocumentViewer({
  url,
  mimeType,
  filename,
}: {
  url?: string;
  mimeType?: string;
  filename: string;
}) {
  if (!url) {
    return (
      <section className="flex min-h-[520px] items-center justify-center rounded-2xl border border-labora-ui bg-white p-8 text-center shadow-panel">
        <div>
          <FileText className="mx-auto h-12 w-12 text-labora-green" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-xl font-semibold text-labora-charcoal">
            Visor no disponible
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            No pudimos obtener una URL segura para este documento.
          </p>
        </div>
      </section>
    );
  }

  const isImage = mimeType?.startsWith("image/");

  return (
    <section className="overflow-hidden rounded-2xl border border-labora-ui bg-white shadow-panel">
      <div className="flex items-center justify-between gap-3 border-b border-labora-ui p-4">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-lg font-semibold text-labora-charcoal">
            {filename}
          </h2>
          <p className="mt-1 text-xs text-labora-gray">Vista segura temporal</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Abrir
        </a>
      </div>
      <div className="h-[68vh] min-h-[520px] bg-labora-ivory">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={filename}
            className="h-full w-full object-contain"
          />
        ) : (
          <iframe
            src={url}
            title={`Vista previa de ${filename}`}
            className="h-full w-full"
          />
        )}
      </div>
      <div className="border-t border-labora-ui p-4">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-labora-deep"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Ver o descargar en nueva pestana
        </a>
      </div>
    </section>
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-labora-ui bg-white p-5 shadow-panel"
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

export function ReplaceDocumentModal({
  document,
  documentTypes,
  open,
  isLoading,
  error,
  onClose,
  onConfirm,
}: {
  document: DocumentItem | null;
  documentTypes: DocumentTypeDefinition[];
  open: boolean;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (
    file: File,
    payload: { reason?: string; documentTypeCode?: string; isPrimary?: boolean },
  ) => Promise<void> | void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [documentTypeCode, setDocumentTypeCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setDocumentTypeCode(document.documentType?.code || "");
      setReason("");
      setFile(null);
      setLocalError(null);
    }
  }, [document]);

  if (!open || !document) {
    return null;
  }

  return (
    <ModalShell title="Vas a reemplazar este documento" onClose={onClose}>
      <p className="mt-3 text-sm leading-6 text-labora-gray">
        Conservaremos el historial del archivo anterior, pero el nuevo documento
        sera usado para continuar el expediente.
      </p>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Nuevo archivo
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-medium text-labora-charcoal"
          />
        </label>
        <DocumentTypeSelect
          documentTypes={documentTypes}
          value={documentTypeCode}
          onChange={setDocumentTypeCode}
        />
        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Motivo opcional
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-medium text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
            placeholder="Archivo borroso, incompleto o incorrecto"
          />
        </label>
      </div>
      <InlineError message={localError || error} />
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
          disabled={isLoading}
          onClick={async () => {
            if (!file) {
              setLocalError("Selecciona el nuevo archivo.");
              return;
            }
            const validation = validateDocumentFile({
              file,
              documentTypes,
              documentTypeCode,
            });
            if (validation) {
              setLocalError(validation);
              return;
            }
            await onConfirm(file, {
              reason: reason.trim() || undefined,
              documentTypeCode,
              isPrimary: document.isPrimary,
            });
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileUp className="h-4 w-4" aria-hidden="true" />}
          Reemplazar documento
        </button>
      </div>
    </ModalShell>
  );
}

export function DeleteDocumentModal({
  document,
  open,
  isOnlyPrimary,
  isLoading,
  error,
  onClose,
  onConfirm,
}: {
  document: DocumentItem | null;
  open: boolean;
  isOnlyPrimary?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  if (!open || !document) {
    return null;
  }

  return (
    <ModalShell title="Eliminar este documento" onClose={onClose}>
      <p className="mt-3 text-sm leading-6 text-labora-gray">
        El documento dejara de usarse en el expediente. Esta accion quedara
        registrada.
      </p>
      {isOnlyPrimary ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Este es el documento principal del expediente. Si lo eliminas, deberas
          subir una nueva historia laboral para continuar.
        </div>
      ) : null}
      <InlineError message={error} />
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
          disabled={isLoading}
          onClick={onConfirm}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
          Eliminar documento
        </button>
      </div>
    </ModalShell>
  );
}

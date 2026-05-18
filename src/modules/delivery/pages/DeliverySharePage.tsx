"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, Files, Mail, ShieldCheck } from "lucide-react";

import { FieldError, InlineAlert } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { CaseReportsNavigation } from "@/src/modules/reports/components/CaseReportsNavigation";
import {
  DeliveryEmptyState,
  DeliveryErrorState,
  DeliveryLoadingSkeleton,
  FileCategoryIcon,
  ShareLinkResultCard,
  ShareLinksTable,
} from "@/src/modules/delivery/components/delivery-components";
import type {
  CreateShareLinkResponse,
  DownloadFile,
  ShareLink,
  SharePermission,
} from "@/src/modules/delivery/api/delivery.types";
import {
  useCreateShareLink,
  useDelivery,
  useRevokeShareLink,
} from "@/src/modules/delivery/hooks/useDelivery";
import {
  copyToClipboard,
  getDateInputValue,
  isFutureDateInput,
  toEndOfDayIso,
} from "@/src/modules/delivery/utils/delivery-actions";
import {
  canDownloadFile,
  fileCategoryLabels,
  formatBytes,
  sharePermissionLabels,
} from "@/src/modules/delivery/utils/delivery-formatters";
import { trackDeliveryEvent } from "@/src/modules/delivery/utils/delivery-analytics";

type ShareFormErrors = Partial<Record<"email" | "expiresAt" | "permissions" | "files", string>>;

const permissionOptions: SharePermission[] = [
  "view",
  "download",
  "upload_supporting_files",
];

function toggleValue<T extends string>(items: T[], value: T) {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function DeliverySharePage({ caseId }: { caseId: string }) {
  const caseDetail = useCaseDetail(caseId);
  const delivery = useDelivery(caseId);
  const createShare = useCreateShareLink(caseId);
  const revokeShare = useRevokeShareLink(caseId);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [permissions, setPermissions] = useState<SharePermission[]>(["view", "download"]);
  const [fileIds, setFileIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState(getDateInputValue(7));
  const [maxViews, setMaxViews] = useState("");
  const [errors, setErrors] = useState<ShareFormErrors>({});
  const [result, setResult] = useState<CreateShareLinkResponse | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyLinkId, setBusyLinkId] = useState<string | null>(null);
  const seededFiles = useRef(false);

  const availableFiles = useMemo(
    () => delivery.data.files.filter((file) => canDownloadFile(file.status, file.isUnlocked)),
    [delivery.data.files],
  );

  useEffect(() => {
    trackDeliveryEvent("delivery_share_started", { caseId });
  }, [caseId]);

  useEffect(() => {
    if (!seededFiles.current && availableFiles.length) {
      setFileIds(availableFiles.map((file) => file.id));
      seededFiles.current = true;
    }
  }, [availableFiles]);

  function validateForm() {
    const nextErrors: ShareFormErrors = {};

    if (!isValidEmail(recipientEmail)) {
      nextErrors.email = "Ingresa un correo valido.";
    }

    if (!isFutureDateInput(expiresAt)) {
      nextErrors.expiresAt = "La fecha de expiracion debe ser futura.";
    }

    if (!permissions.length) {
      nextErrors.permissions = "Selecciona al menos un permiso.";
    }

    if (!fileIds.length) {
      nextErrors.files = "Selecciona al menos un documento disponible.";
    }

    const selectedUnavailable = fileIds.some(
      (fileId) => !availableFiles.some((file) => file.id === fileId),
    );

    if (selectedUnavailable) {
      nextErrors.files = "No puedes compartir documentos bloqueados o en revision.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setResult(null);

    if (!validateForm()) {
      return;
    }

    try {
      const response = await createShare.create({
        recipientName: recipientName.trim() || undefined,
        recipientEmail: recipientEmail.trim(),
        permissions,
        fileIds,
        expiresAt: toEndOfDayIso(expiresAt),
        maxViews: maxViews ? Number(maxViews) : null,
      });
      setResult(response);
      setFeedback("El enlace fue generado. Por seguridad, se muestra completo solo en este momento.");
      trackDeliveryEvent("delivery_share_link_created", {
        caseId,
        files: fileIds.length,
        hasDownloadPermission: permissions.includes("download"),
      });
      await delivery.refresh();
    } catch {
      setFeedback(null);
    }
  }

  async function handleCopyResult() {
    if (!result?.url) {
      return;
    }

    const copied = await copyToClipboard(result.url);
    setFeedback(copied ? "Enlace copiado al portapapeles." : "No pudimos copiar el enlace automaticamente.");
    trackDeliveryEvent("delivery_share_link_copied", { caseId });
  }

  async function handleRevoke(link: ShareLink) {
    if (!window.confirm("Quieres revocar este enlace compartido?")) {
      return;
    }

    setBusyLinkId(link.id);
    setFeedback(null);

    try {
      await revokeShare.revoke(link.id);
      trackDeliveryEvent("delivery_share_link_revoked", { caseId });
      setFeedback("Enlace revocado correctamente.");
      await delivery.refresh();
    } catch {
      setFeedback(null);
    } finally {
      setBusyLinkId(null);
    }
  }

  function selectAllFiles() {
    setFileIds(availableFiles.map((file) => file.id));
  }

  function clearFiles() {
    setFileIds([]);
  }

  if (caseDetail.isLoading || delivery.isLoading) {
    return <DeliveryLoadingSkeleton />;
  }

  if (delivery.error && !delivery.data.package) {
    return <DeliveryErrorState message={delivery.error} onRetry={delivery.refetch} />;
  }

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      {caseDetail.data ? (
        <CaseHeader
          caseNumber={caseDetail.data.caseNumber}
          status={caseDetail.data.status}
          holderFullName={getHolderFullName(caseDetail.data.holder)}
          updatedAt={caseDetail.data.updatedAt}
        />
      ) : null}

      <CaseReportsNavigation caseId={caseId} active="Entrega final" />

      <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <Link
          href={`/app/cases/${caseId}/delivery`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a entrega final
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
          Compartir con abogado
        </h1>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          Crea enlaces temporales con permisos limitados y documentos especificos.
        </p>
      </header>

      {!delivery.data.package ? (
        <DeliveryEmptyState caseId={caseId} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            {delivery.error ? <InlineAlert tone="warning">{delivery.error}</InlineAlert> : null}
            {createShare.error ? <InlineAlert tone="error">{createShare.error}</InlineAlert> : null}
            {revokeShare.error ? <InlineAlert tone="error">{revokeShare.error}</InlineAlert> : null}
            {feedback ? (
              <div aria-live="polite">
                <InlineAlert tone="success">{feedback}</InlineAlert>
              </div>
            ) : null}
            {result ? (
              <ShareLinkResultCard
                url={result.url}
                expiresAt={result.shareLink.expiresAt}
                permissions={result.shareLink.permissions}
                onCopy={handleCopyResult}
              />
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel"
              noValidate
            >
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
                <div>
                  <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                    Nuevo enlace temporal
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-labora-gray">
                    El enlace tendra expiracion y solo mostrara los documentos seleccionados.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-labora-charcoal">
                    Nombre del destinatario
                  </span>
                  <input
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
                    placeholder="Nombre del abogado"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-labora-charcoal">
                    Correo del abogado
                  </span>
                  <input
                    value={recipientEmail}
                    onChange={(event) => setRecipientEmail(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
                    placeholder="correo@ejemplo.com"
                    aria-describedby={errors.email ? "share-email-error" : undefined}
                  />
                  <FieldError id="share-email-error" message={errors.email} />
                </label>
                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-semibold text-labora-charcoal">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Fecha de expiracion
                  </span>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
                    aria-describedby={errors.expiresAt ? "share-expires-error" : undefined}
                  />
                  <FieldError id="share-expires-error" message={errors.expiresAt} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-labora-charcoal">
                    Limite de vistas
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={maxViews}
                    onChange={(event) => setMaxViews(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <fieldset className="mt-5">
                <legend className="text-sm font-semibold text-labora-charcoal">
                  Permisos
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {permissionOptions.map((permission) => (
                    <label
                      key={permission}
                      className="flex min-h-11 items-center gap-3 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-charcoal"
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(permission)}
                        onChange={() => setPermissions((current) => toggleValue(current, permission))}
                        className="h-4 w-4 accent-labora-green"
                      />
                      {sharePermissionLabels[permission]}
                    </label>
                  ))}
                </div>
                <FieldError message={errors.permissions} />
              </fieldset>

              <fieldset className="mt-5">
                <legend className="sr-only">Documentos disponibles</legend>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-sm font-semibold text-labora-charcoal">
                    <Files className="h-4 w-4" aria-hidden="true" />
                    Documentos disponibles
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllFiles}
                      className="text-sm font-semibold text-labora-deep hover:text-labora-green"
                    >
                      Seleccionar todos
                    </button>
                    <button
                      type="button"
                      onClick={clearFiles}
                      className="text-sm font-semibold text-labora-gray hover:text-labora-deep"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {availableFiles.map((file: DownloadFile) => (
                    <label
                      key={file.id}
                      className="flex items-start gap-3 rounded-lg border border-labora-ui p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={fileIds.includes(file.id)}
                        onChange={() => setFileIds((current) => toggleValue(current, file.id))}
                        className="mt-1 h-4 w-4 accent-labora-green"
                      />
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-labora-ivory text-labora-deep">
                        <FileCategoryIcon category={file.category} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words font-semibold text-labora-charcoal">
                          {file.fileName}
                        </span>
                        <span className="mt-1 block text-xs text-labora-gray">
                          {fileCategoryLabels[file.category]} - {formatBytes(file.sizeBytes)}
                        </span>
                      </span>
                    </label>
                  ))}
                  {!availableFiles.length ? (
                    <p className="rounded-lg border border-labora-ui bg-labora-ivory p-3 text-sm text-labora-gray">
                      No hay documentos disponibles para compartir.
                    </p>
                  ) : null}
                </div>
                <FieldError message={errors.files} />
              </fieldset>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link
                  href={`/app/cases/${caseId}/delivery`}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={createShare.isLoading || !delivery.data.availableActions.canCreateShareLink}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {createShare.isLoading ? "Generando..." : "Crear enlace"}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-panel">
              <h2 className="font-heading text-lg font-semibold">Advertencia de seguridad</h2>
              <p className="mt-2 text-sm leading-6">
                Comparte este enlace solo con personas de confianza. El acceso es temporal y puede ser revocado en cualquier momento.
              </p>
            </section>

            <div>
              <h2 className="mb-3 font-heading text-lg font-semibold text-labora-charcoal">
                Links activos
              </h2>
              <ShareLinksTable
                links={delivery.data.shareLinks}
                onRevoke={handleRevoke}
                busyLinkId={busyLinkId}
              />
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

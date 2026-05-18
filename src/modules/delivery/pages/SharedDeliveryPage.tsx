"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { InlineAlert } from "@/components/auth/FormFeedback";
import {
  DeliveryLoadingSkeleton,
  DownloadFilesTable,
  SharedDeliveryAccessState,
} from "@/src/modules/delivery/components/delivery-components";
import type { DownloadFile } from "@/src/modules/delivery/api/delivery.types";
import {
  useDownloadSharedDeliveryFile,
  useSharedDelivery,
} from "@/src/modules/delivery/hooks/useDelivery";
import { openTemporaryDownload } from "@/src/modules/delivery/utils/delivery-actions";
import {
  formatDeliveryDate,
  sharePermissionLabels,
} from "@/src/modules/delivery/utils/delivery-formatters";
import { trackDeliveryEvent } from "@/src/modules/delivery/utils/delivery-analytics";

export function SharedDeliveryPage({ token }: { token: string }) {
  const sharedDelivery = useSharedDelivery(token);
  const downloadFile = useDownloadSharedDeliveryFile(token);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const data = sharedDelivery.data;

  useEffect(() => {
    trackDeliveryEvent("shared_delivery_viewed", {
      status: data?.status,
    });
  }, [data?.status]);

  const canDownload = Boolean(data?.permissions.includes("download"));
  const visibleFiles = useMemo(
    () =>
      (data?.files || []).map((file) => ({
        ...file,
        isUnlocked: canDownload && file.isUnlocked,
        status: canDownload ? file.status : "locked",
      })) satisfies DownloadFile[],
    [canDownload, data?.files],
  );

  async function handleDownload(file: DownloadFile) {
    setFeedback(null);
    setDownloadingFileId(file.id);
    trackDeliveryEvent("shared_delivery_download_clicked", {
      category: file.category,
    });

    try {
      const response = await downloadFile.download(file.id);
      openTemporaryDownload(response.downloadUrl);
      setFeedback("Descarga solicitada correctamente.");
      await sharedDelivery.refresh();
    } catch {
      setFeedback(null);
    } finally {
      setDownloadingFileId(null);
    }
  }

  if (sharedDelivery.isLoading) {
    return (
      <main className="min-h-screen bg-labora-ivory px-5 py-8">
        <div className="mx-auto max-w-5xl">
          <Logo />
          <div className="mt-8">
            <DeliveryLoadingSkeleton />
          </div>
        </div>
      </main>
    );
  }

  if (sharedDelivery.error || !data) {
    return (
      <main className="min-h-screen bg-labora-ivory px-5 py-8">
        <div className="mx-auto max-w-5xl">
          <Logo />
          <div className="mt-8">
            <SharedDeliveryAccessState
              status="error"
              message={sharedDelivery.error}
            />
          </div>
        </div>
      </main>
    );
  }

  if (data.status !== "valid" && data.status !== "active") {
    const accessStatus =
      data.status === "expired" ||
      data.status === "revoked" ||
      data.status === "max_views_reached" ||
      data.status === "disabled" ||
      data.status === "error"
        ? data.status
        : "disabled";

    return (
      <main className="min-h-screen bg-labora-ivory px-5 py-8">
        <div className="mx-auto max-w-5xl">
          <Logo />
          <div className="mt-8">
            <SharedDeliveryAccessState
              status={accessStatus}
              message={data.message}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-labora-ivory px-5 py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <Logo />

        <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                Expediente compartido
              </p>
              <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
                {data.publicCaseNumber}
              </h1>
              <p className="mt-2 text-sm leading-6 text-labora-gray">
                Este enlace tiene permisos limitados y fecha de expiracion.
              </p>
            </div>
            <div className="rounded-2xl border border-labora-ui bg-labora-ivory p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-labora-charcoal">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Expira
              </p>
              <p className="mt-1 text-labora-gray">{formatDeliveryDate(data.expiresAt)}</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Permisos del enlace
              </h2>
              <p className="mt-2 text-sm leading-6 text-labora-gray">
                {data.permissions.map((permission) => sharePermissionLabels[permission]).join(", ")}
              </p>
              {!canDownload ? (
                <p className="mt-2 text-sm leading-6 text-labora-gray">
                  Este enlace permite ver la lista de documentos, pero no descargar archivos.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {downloadFile.error ? <InlineAlert tone="error">{downloadFile.error}</InlineAlert> : null}
        {feedback ? (
          <div aria-live="polite">
            <InlineAlert tone="success">{feedback}</InlineAlert>
          </div>
        ) : null}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Download className="h-4 w-4 text-labora-green" aria-hidden="true" />
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Documentos permitidos
            </h2>
          </div>
          <DownloadFilesTable
            files={visibleFiles}
            onDownload={handleDownload}
            downloadingFileId={downloadingFileId}
          />
        </section>
      </div>
    </main>
  );
}

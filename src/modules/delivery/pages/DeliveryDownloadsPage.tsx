"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, X } from "lucide-react";

import { InlineAlert } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { CaseReportsNavigation } from "@/src/modules/reports/components/CaseReportsNavigation";
import {
  DeliveryEmptyState,
  DeliveryErrorState,
  DeliveryLoadingSkeleton,
  DeliveryStatusBadge,
  DownloadFilesTable,
  FileCategoryIcon,
} from "@/src/modules/delivery/components/delivery-components";
import type {
  DownloadFile,
  DownloadFileCategory,
} from "@/src/modules/delivery/api/delivery.types";
import {
  useDelivery,
  useDownloadDeliveryFile,
} from "@/src/modules/delivery/hooks/useDelivery";
import { openTemporaryDownload } from "@/src/modules/delivery/utils/delivery-actions";
import {
  canDownloadFile,
  fileCategoryLabels,
  formatBytes,
  formatDeliveryDate,
} from "@/src/modules/delivery/utils/delivery-formatters";
import { trackDeliveryEvent } from "@/src/modules/delivery/utils/delivery-analytics";

type CategoryFilter = DownloadFileCategory | "all";

function FileDetailDialog({
  file,
  onClose,
  onDownload,
  isDownloading,
}: {
  file: DownloadFile;
  onClose: () => void;
  onDownload: (file: DownloadFile) => void;
  isDownloading: boolean;
}) {
  const downloadable = canDownloadFile(file.status, file.isUnlocked);

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-labora-charcoal/40 p-0 sm:items-center sm:justify-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-file-detail-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-labora-ui bg-white p-5 shadow-panel sm:max-w-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-labora-ivory text-labora-deep">
              <FileCategoryIcon category={file.category} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                Detalle del documento
              </p>
              <h2 id="delivery-file-detail-title" className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
                {file.fileName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui text-labora-gray hover:bg-labora-ivory"
            aria-label="Cerrar detalle"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-labora-charcoal">Tipo</dt>
            <dd className="mt-1 text-labora-gray">{fileCategoryLabels[file.category]}</dd>
          </div>
          <div>
            <dt className="font-semibold text-labora-charcoal">Estado</dt>
            <dd className="mt-1">
              <DeliveryStatusBadge status={file.status} kind="file" />
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-labora-charcoal">Tamano</dt>
            <dd className="mt-1 text-labora-gray">{formatBytes(file.sizeBytes)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-labora-charcoal">Descargas</dt>
            <dd className="mt-1 text-labora-gray">{file.downloadCount}</dd>
          </div>
          <div>
            <dt className="font-semibold text-labora-charcoal">Generado</dt>
            <dd className="mt-1 text-labora-gray">{formatDeliveryDate(file.generatedAt)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-labora-charcoal">Ultima descarga</dt>
            <dd className="mt-1 text-labora-gray">
              {file.lastDownloadedAt ? formatDeliveryDate(file.lastDownloadedAt) : "Sin descargas"}
            </dd>
          </div>
        </dl>

        {!downloadable ? (
          <InlineAlert tone="warning">
            Este documento aun no esta disponible porque requiere revision o desbloqueo.
          </InlineAlert>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => onDownload(file)}
            disabled={!downloadable || isDownloading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:bg-labora-ui disabled:text-labora-gray"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {isDownloading ? "Descargando..." : "Descargar"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function DeliveryDownloadsPage({ caseId }: { caseId: string }) {
  const caseDetail = useCaseDetail(caseId);
  const delivery = useDelivery(caseId);
  const downloadFile = useDownloadDeliveryFile();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedFile, setSelectedFile] = useState<DownloadFile | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const data = delivery.data;

  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(data.files.map((file) => file.category)));
    return unique.map((item) => ({
      value: item,
      label: fileCategoryLabels[item],
    }));
  }, [data.files]);

  const visibleFiles = useMemo(
    () =>
      category === "all"
        ? data.files
        : data.files.filter((file) => file.category === category),
    [category, data.files],
  );

  async function handleDownloadFile(file: DownloadFile) {
    setFeedback(null);
    setDownloadingFileId(file.id);
    trackDeliveryEvent("delivery_download_clicked", {
      caseId,
      category: file.category,
    });

    try {
      const response = await downloadFile.download(file.id);
      openTemporaryDownload(response.downloadUrl);
      trackDeliveryEvent("delivery_file_downloaded", {
        caseId,
        category: file.category,
      });
      setFeedback("Descarga solicitada correctamente.");
      await delivery.refresh();
    } catch {
      setFeedback(null);
    } finally {
      setDownloadingFileId(null);
    }
  }

  if (caseDetail.isLoading || delivery.isLoading) {
    return <DeliveryLoadingSkeleton />;
  }

  if (delivery.error && !data.package) {
    return <DeliveryErrorState message={delivery.error} onRetry={delivery.refetch} />;
  }

  return (
    <section className="space-y-5 pb-24 md:pb-0">
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
          Centro de descargas
        </h1>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          Descarga archivos finales individualmente o filtra por tipo de documento.
        </p>
      </header>

      {!data.package ? (
        <DeliveryEmptyState caseId={caseId} />
      ) : (
        <>
          {delivery.error ? <InlineAlert tone="warning">{delivery.error}</InlineAlert> : null}
          {downloadFile.error ? <InlineAlert tone="error">{downloadFile.error}</InlineAlert> : null}
          {feedback ? (
            <div aria-live="polite">
              <InlineAlert tone="success">{feedback}</InlineAlert>
            </div>
          ) : null}

          <section className="rounded-2xl border border-labora-ui bg-white p-3 shadow-panel">
            <div className="flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={
                  category === "all"
                    ? "inline-flex min-h-10 shrink-0 items-center rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white"
                    : "inline-flex min-h-10 shrink-0 items-center rounded-lg px-4 py-2 text-sm font-semibold text-labora-gray hover:bg-labora-ivory hover:text-labora-deep"
                }
              >
                Todos
              </button>
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={
                    category === option.value
                      ? "inline-flex min-h-10 shrink-0 items-center rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white"
                      : "inline-flex min-h-10 shrink-0 items-center rounded-lg px-4 py-2 text-sm font-semibold text-labora-gray hover:bg-labora-ivory hover:text-labora-deep"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <DownloadFilesTable
            files={visibleFiles}
            onDownload={handleDownloadFile}
            onViewDetail={setSelectedFile}
            downloadingFileId={downloadingFileId}
          />
        </>
      )}

      {selectedFile ? (
        <FileDetailDialog
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDownload={handleDownloadFile}
          isDownloading={downloadingFileId === selectedFile.id}
        />
      ) : null}
    </section>
  );
}

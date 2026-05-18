"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import { InlineAlert } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { CaseReportsNavigation } from "@/src/modules/reports/components/CaseReportsNavigation";
import {
  DeliveryAiSummaryCard,
  DeliveryEmptyState,
  DeliveryErrorState,
  DeliveryLoadingSkeleton,
  DeliveryMobileActions,
  DeliveryNextStepsPanel,
  DeliverySummaryCard,
  DeliveryTimeline,
  DownloadFilesTable,
} from "@/src/modules/delivery/components/delivery-components";
import type { DownloadFile } from "@/src/modules/delivery/api/delivery.types";
import {
  useDelivery,
  useDownloadDeliveryFile,
  useDownloadDeliveryPackage,
} from "@/src/modules/delivery/hooks/useDelivery";
import { openTemporaryDownload } from "@/src/modules/delivery/utils/delivery-actions";
import { canDownloadFile } from "@/src/modules/delivery/utils/delivery-formatters";
import { trackDeliveryEvent } from "@/src/modules/delivery/utils/delivery-analytics";

export function DeliveryHomePage({ caseId }: { caseId: string }) {
  const caseDetail = useCaseDetail(caseId);
  const delivery = useDelivery(caseId);
  const downloadFile = useDownloadDeliveryFile();
  const downloadPackage = useDownloadDeliveryPackage(caseId);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const data = delivery.data;
  const deliveryPackage = data.package;

  useEffect(() => {
    trackDeliveryEvent("delivery_viewed", {
      caseId,
      status: deliveryPackage?.status,
    });
  }, [caseId, deliveryPackage?.status]);

  const availableFiles = useMemo(
    () => data.files.filter((file) => canDownloadFile(file.status, file.isUnlocked)),
    [data.files],
  );

  async function handleDownloadAll() {
    setFeedback(null);
    trackDeliveryEvent("delivery_download_clicked", {
      caseId,
      target: "package",
    });

    try {
      const response = await downloadPackage.downloadAll();
      openTemporaryDownload(response.downloadUrl);
      setFeedback("Estamos preparando la descarga del paquete final.");
      await delivery.refresh();
    } catch {
      setFeedback(null);
    }
  }

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
      setFeedback("Descarga solicitada. Actualizamos el historial del documento.");
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

  if (delivery.error && !deliveryPackage) {
    return (
      <DeliveryErrorState
        message={delivery.error}
        onRetry={delivery.refetch}
      />
    );
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
          Entrega final del expediente
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
          Consulta, descarga y comparte los documentos generados para tu caso.
        </h1>
      </header>

      {delivery.error ? <InlineAlert tone="warning">{delivery.error}</InlineAlert> : null}
      {downloadPackage.error ? <InlineAlert tone="error">{downloadPackage.error}</InlineAlert> : null}
      {downloadFile.error ? <InlineAlert tone="error">{downloadFile.error}</InlineAlert> : null}
      {feedback ? (
        <div aria-live="polite">
          <InlineAlert tone="success">{feedback}</InlineAlert>
        </div>
      ) : null}

      {!deliveryPackage ? (
        <DeliveryEmptyState caseId={caseId} />
      ) : (
        <>
          <DeliverySummaryCard
            deliveryPackage={deliveryPackage}
            availableFiles={availableFiles.length}
            canDownload={data.availableActions.canDownload}
            canShare={data.availableActions.canCreateShareLink}
            shareHref={`/app/cases/${caseId}/delivery/share`}
            onDownloadAll={handleDownloadAll}
            isDownloading={downloadPackage.isLoading}
          />

          <DeliveryAiSummaryCard
            summary={deliveryPackage.aiSummary}
            confidence={deliveryPackage.aiConfidence}
          />

          <section>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
                  Documentos finales
                </h2>
                <p className="mt-1 text-sm text-labora-gray">
                  Los documentos bloqueados o en revision no permiten descarga.
                </p>
              </div>
              <Link
                href={`/app/cases/${caseId}/delivery/downloads`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
              >
                Ver centro de descargas
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <DownloadFilesTable
              files={data.files}
              onDownload={handleDownloadFile}
              downloadingFileId={downloadingFileId}
            />
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <DeliveryNextStepsPanel
              caseId={caseId}
              canShare={data.availableActions.canCreateShareLink}
              canComplement={data.availableActions.canComplementCase}
              canClose={data.availableActions.canCloseCase}
            />

            <aside>
              <DeliveryTimeline events={data.timeline} compact />
              <Link
                href={`/app/cases/${caseId}/delivery/timeline`}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
              >
                Ver trazabilidad completa
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </aside>
          </div>

          <DeliveryMobileActions
            canDownload={data.availableActions.canDownload}
            canShare={data.availableActions.canCreateShareLink}
            onDownloadAll={handleDownloadAll}
            shareHref={`/app/cases/${caseId}/delivery/share`}
          />
        </>
      )}

    </section>
  );
}

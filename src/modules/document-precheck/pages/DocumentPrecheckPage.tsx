"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import {
  DocumentIssueList,
  DocumentPageViewer,
  DocumentPrecheckHeader,
  DocumentStatusStepper,
  OcrPreviewPanel,
  PrecheckActions,
  PrecheckErrorState,
  PrecheckSkeleton,
  PrivacyNoticeCard,
  ReuploadDocumentCard,
  TrafficLightCard,
} from "@/src/modules/document-precheck/components/document-precheck-components";
import {
  useDocumentPrecheck,
  useOcrPreview,
} from "@/src/modules/document-precheck/hooks/useDocumentPrecheck";
import { useDocumentDetail } from "@/src/modules/documents/hooks/useDocuments";

const usableDocumentStatuses = new Set([
  "uploaded",
  "processing",
  "validated",
  "requires_review",
  "rejected",
  "failed",
]);

export function DocumentPrecheckPage({
  caseId,
  documentId,
}: {
  caseId: string;
  documentId: string;
}) {
  const router = useRouter();
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const caseDetail = useCaseDetail(caseId);
  const documentDetail = useDocumentDetail(documentId);
  const precheck = useDocumentPrecheck(caseId, documentId);
  const ocrPreview = useOcrPreview(documentId, false);

  const ocr = ocrPreview.data || precheck.data?.ocr;
  const documentName =
    precheck.data?.documentName ||
    documentDetail.data?.displayName ||
    documentDetail.data?.originalFilename;
  const canStart = useMemo(() => {
    if (!documentDetail.data) {
      return false;
    }

    return usableDocumentStatuses.has(documentDetail.data.status);
  }, [documentDetail.data]);

  function backToDocuments() {
    router.push(`/app/cases/${caseId}/documents`);
  }

  function reuploadDocument() {
    router.push(`/app/cases/${caseId}/documents/${documentId}`);
  }

  function continueToPreanalysis() {
    router.push(`/app/cases/${caseId}/results`);
  }

  async function requestReview() {
    await precheck.start(true);
  }

  if (caseDetail.isLoading || documentDetail.isLoading || precheck.isLoading) {
    return <PrecheckSkeleton />;
  }

  if (documentDetail.error || !documentDetail.data) {
    return (
      <PrecheckErrorState
        message={documentDetail.error || "No encontramos este documento."}
        onRetry={documentDetail.refetch}
      />
    );
  }

  const showConsentCta = precheck.error?.toLowerCase().includes("autorizacion");

  if (precheck.error && !precheck.data) {
    return (
      <PrecheckErrorState
        message={precheck.error}
        onRetry={precheck.refetch}
        href={showConsentCta ? "/app/onboarding/consentimientos" : undefined}
      />
    );
  }

  const currentStatus = precheck.data?.status || "not_started";
  const pages = ocr?.pages || [];
  const requiresReupload =
    precheck.data?.decision === "requires_reupload" ||
    precheck.data?.decision === "unsupported" ||
    precheck.data?.decision === "failed" ||
    currentStatus === "blocked";

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

      <DocumentPrecheckHeader
        precheck={precheck.data}
        documentName={documentName}
        isRefreshing={precheck.isRefreshing}
        onRefresh={precheck.refresh}
      />

      {!canStart ? (
        <PrecheckErrorState
          message="Este documento aun no esta cargado o no puede revisarse automaticamente."
          onRetry={documentDetail.refetch}
        />
      ) : null}

      {!precheck.data ? (
        <>
          <PrivacyNoticeCard />
          <PrecheckActions
            status="not_started"
            decision={null}
            onContinue={continueToPreanalysis}
            onReupload={reuploadDocument}
            onRequestReview={requestReview}
            onBack={backToDocuments}
            onStart={() => precheck.start(false)}
            isStarting={precheck.isStarting}
          />
          {precheck.startError ? (
            <PrecheckErrorState message={precheck.startError} onRetry={() => precheck.start(false)} />
          ) : null}
        </>
      ) : null}

      {precheck.data && ["not_started", "queued", "in_progress"].includes(precheck.data.status) ? (
        <>
          <DocumentStatusStepper status={precheck.data.status} />
          <PrivacyNoticeCard />
          <PrecheckActions
            status={precheck.data.status}
            decision={precheck.data.decision}
            onContinue={continueToPreanalysis}
            onReupload={reuploadDocument}
            onRequestReview={requestReview}
            onBack={backToDocuments}
          />
        </>
      ) : null}

      {precheck.data && !["not_started", "queued", "in_progress"].includes(precheck.data.status) ? (
        <>
          <TrafficLightCard
            trafficLight={precheck.data.trafficLight}
            decision={precheck.data.decision}
            confidenceScore={precheck.data.confidenceScore}
            summary={precheck.data.summary}
          />
          {requiresReupload ? (
            <ReuploadDocumentCard
              onReupload={reuploadDocument}
              isPrimary={documentDetail.data.isPrimary}
            />
          ) : null}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <DocumentIssueList
                issues={precheck.data.issues}
                onViewPage={(page) => setSelectedPage(page)}
                onAction={(issue) => {
                  if (issue.suggestedAction?.includes("upload")) {
                    reuploadDocument();
                  }
                }}
              />
              <OcrPreviewPanel
                ocr={ocr}
                isLoading={ocrPreview.isRefreshing}
                onRefresh={() => ocrPreview.start({ force: true })}
              />
            </div>
            <aside className="space-y-5">
              <DocumentPageViewer
                selectedPage={selectedPage}
                pages={pages}
                onSelectPage={setSelectedPage}
              />
              <PrivacyNoticeCard />
              <PrecheckActions
                status={precheck.data.status}
                decision={precheck.data.decision}
                onContinue={continueToPreanalysis}
                onReupload={reuploadDocument}
                onRequestReview={requestReview}
                onBack={backToDocuments}
              />
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}

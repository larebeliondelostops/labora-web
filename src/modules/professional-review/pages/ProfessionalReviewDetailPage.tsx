"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, RefreshCcw, ShieldAlert } from "lucide-react";

import { InlineAlert } from "@/components/auth/FormFeedback";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import {
  AIReviewerSummary,
  ProfessionalApprovalPanel,
  RequestClientActionModal,
  ReviewAuditTimeline,
  ReviewCaseSummary,
  ReviewCommentsPanel,
  ReviewDocumentViewer,
  ReviewErrorState,
  ReviewPriorityBadge,
  ReviewSkeleton,
  ReviewStatusBadge,
  ReviewStatusTimeline,
  ReviewedFileUploader,
  VersionComparison,
  formatReviewDate,
  reviewHasAction,
  reviewStatusCopy,
  reviewTypeCopy,
  trackProfessionalReviewEvent,
} from "@/src/modules/professional-review/components/professional-review-components";
import {
  useProfessionalReview,
  useProfessionalReviewActions,
} from "@/src/modules/professional-review/hooks/useProfessionalReviews";
import type {
  ApproveReviewBody,
  CreateReviewCommentBody,
  RequestClientActionBody,
  UploadReviewedFileBody,
} from "@/src/modules/professional-review/api/professional-review.types";

export type ProfessionalReviewDetailTab =
  | "summary"
  | "document"
  | "comments"
  | "files"
  | "approval"
  | "audit";

const tabs: Array<{ id: ProfessionalReviewDetailTab; label: string }> = [
  { id: "summary", label: "Resumen" },
  { id: "document", label: "Documento" },
  { id: "comments", label: "Comentarios" },
  { id: "files", label: "Archivos" },
  { id: "approval", label: "Aprobacion" },
  { id: "audit", label: "Auditoria" },
];

function DetailTabs({
  active,
  onChange,
}: {
  active: ProfessionalReviewDetailTab;
  onChange: (tab: ProfessionalReviewDetailTab) => void;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-labora-ui bg-white p-2 shadow-panel xl:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={
            active === tab.id
              ? "inline-flex min-h-10 shrink-0 items-center rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white"
              : "inline-flex min-h-10 shrink-0 items-center rounded-lg px-4 py-2 text-sm font-semibold text-labora-gray hover:bg-labora-ivory hover:text-labora-deep"
          }
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export function ProfessionalReviewDetailPage({
  reviewId,
  initialTab = "summary",
}: {
  reviewId: string;
  initialTab?: ProfessionalReviewDetailTab;
}) {
  const reviewResource = useProfessionalReview(reviewId, { poll: true });
  const actions = useProfessionalReviewActions(reviewId);
  const [activeTab, setActiveTab] =
    useState<ProfessionalReviewDetailTab>(initialTab);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const review = reviewResource.data;

  useEffect(() => {
    if (!review) {
      return;
    }

    trackProfessionalReviewEvent("professional_review_status_viewed", {
      reviewId: review.id,
      caseId: review.caseId,
      status: review.status,
      actorRole: "lawyer",
    });
  }, [review]);

  async function afterMutation(message: string) {
    setSuccessMessage(message);
    await reviewResource.refresh();
  }

  async function createComment(payload: CreateReviewCommentBody) {
    await actions.createComment(payload);
    await afterMutation("Comentario guardado.");
  }

  async function resolveComment(commentId: string) {
    await actions.resolveComment(commentId);
    await afterMutation("Comentario resuelto.");
  }

  async function requestDocuments(payload: RequestClientActionBody) {
    await actions.requestClientAction(payload);
    await afterMutation("Solicitud enviada al cliente.");
  }

  async function uploadFile(payload: UploadReviewedFileBody) {
    await actions.uploadReviewedFile(payload);
    await afterMutation("Archivo revisado cargado.");
  }

  async function approve(payload: ApproveReviewBody) {
    await actions.approve(payload);
    await afterMutation("Revision aprobada.");
  }

  async function reject(payload: { reason: string; note?: string }) {
    await actions.reject(payload);
    await afterMutation("Revision rechazada.");
  }

  async function generateAiSummary() {
    await actions.generateAiSummary(undefined);
    await afterMutation("Resumen IA actualizado.");
  }

  if (reviewResource.isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <AdminSidebar />
          <ReviewSkeleton />
        </div>
      </main>
    );
  }

  if (reviewResource.error && !review) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <AdminSidebar />
          <ReviewErrorState message={reviewResource.error} onRetry={reviewResource.refetch} />
        </div>
      </main>
    );
  }

  if (!review) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <AdminSidebar />
          <ReviewErrorState message="No encontramos esta revision profesional." />
        </div>
      </main>
    );
  }

  const canComment = reviewHasAction(review, "comment");
  const canUploadReviewedFile = reviewHasAction(review, "upload_reviewed_file");
  const canApprove = reviewHasAction(review, "approve");
  const canReject = reviewHasAction(review, "reject");
  const canRequestClientAction = reviewHasAction(review, "request_client_action");
  const canGenerateAi = reviewHasAction(review, "generate_ai_summary");

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <section className="space-y-5">
          <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <Link
              href="/backoffice/professional-reviews"
              className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Bandeja de revisiones
            </Link>
            <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                  Revision profesional
                </p>
                <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
                  {review.caseNumber}
                </h1>
                <p className="mt-2 text-sm leading-6 text-labora-gray">
                  {reviewTypeCopy[review.reviewType]} - solicitada {formatReviewDate(review.requestedAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ReviewStatusBadge status={review.status} />
                <ReviewPriorityBadge priority={review.priority} />
              </div>
            </div>
          </header>

          {successMessage ? <InlineAlert tone="success">{successMessage}</InlineAlert> : null}
          {actions.error ? <InlineAlert tone="error">{actions.error}</InlineAlert> : null}

          <DetailTabs active={activeTab} onChange={setActiveTab} />

          <section className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel xl:hidden">
            <p className="text-sm font-semibold text-labora-charcoal">
              Estado actual
            </p>
            <p className="mt-1 text-sm leading-6 text-labora-gray">
              {reviewStatusCopy[review.status].message}
            </p>
          </section>

          <div className="hidden gap-5 xl:grid xl:grid-cols-[260px_minmax(0,1fr)_320px]">
            <aside className="space-y-5">
              <ReviewCaseSummary review={review} />
              <ReviewStatusTimeline status={review.status} />
            </aside>

            <div className="space-y-5">
              <ReviewDocumentViewer review={review} />
              <VersionComparison
                originalFile={review.originalFile}
                reviewedFiles={review.reviewedFiles}
              />
              <ReviewedFileUploader
                reviewId={review.id}
                canUpload={canUploadReviewedFile}
                isUploading={actions.isLoading}
                error={actions.error}
                onUpload={uploadFile}
              />
            </div>

            <aside className="space-y-5">
              <AIReviewerSummary
                review={review}
                canGenerate={canGenerateAi}
                isLoading={actions.isLoading}
                error={actions.error}
                onGenerate={generateAiSummary}
              />
              <ReviewCommentsPanel
                reviewId={review.id}
                comments={review.comments}
                mode="lawyer"
                canComment={canComment}
                isSubmitting={actions.isLoading}
                error={actions.error}
                onCreate={createComment}
                onResolve={resolveComment}
              />
              <RequestClientActionModal
                canRequest={canRequestClientAction}
                isSubmitting={actions.isLoading}
                error={actions.error}
                onSubmit={requestDocuments}
              />
              <ProfessionalApprovalPanel
                review={review}
                canApprove={canApprove}
                canReject={canReject}
                isSubmitting={actions.isLoading}
                error={actions.error}
                onApprove={approve}
                onReject={reject}
              />
              <ReviewAuditTimeline events={review.auditEvents} />
            </aside>
          </div>

          <div className="grid gap-5 xl:hidden">
            {activeTab === "summary" ? (
              <>
                <ReviewCaseSummary review={review} />
                <AIReviewerSummary
                  review={review}
                  canGenerate={canGenerateAi}
                  isLoading={actions.isLoading}
                  error={actions.error}
                  onGenerate={generateAiSummary}
                />
                <ReviewStatusTimeline status={review.status} />
              </>
            ) : null}

            {activeTab === "document" ? <ReviewDocumentViewer review={review} /> : null}

            {activeTab === "comments" ? (
              <ReviewCommentsPanel
                reviewId={review.id}
                comments={review.comments}
                mode="lawyer"
                canComment={canComment}
                isSubmitting={actions.isLoading}
                error={actions.error}
                onCreate={createComment}
                onResolve={resolveComment}
              />
            ) : null}

            {activeTab === "files" ? (
              <>
                <VersionComparison
                  originalFile={review.originalFile}
                  reviewedFiles={review.reviewedFiles}
                />
                <ReviewedFileUploader
                  reviewId={review.id}
                  canUpload={canUploadReviewedFile}
                  isUploading={actions.isLoading}
                  error={actions.error}
                  onUpload={uploadFile}
                />
              </>
            ) : null}

            {activeTab === "approval" ? (
              <>
                <RequestClientActionModal
                  canRequest={canRequestClientAction}
                  isSubmitting={actions.isLoading}
                  error={actions.error}
                  onSubmit={requestDocuments}
                />
                <ProfessionalApprovalPanel
                  review={review}
                  canApprove={canApprove}
                  canReject={canReject}
                  isSubmitting={actions.isLoading}
                  error={actions.error}
                  onApprove={approve}
                  onReject={reject}
                />
              </>
            ) : null}

            {activeTab === "audit" ? <ReviewAuditTimeline events={review.auditEvents} /> : null}
          </div>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-panel">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <ShieldAlert className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="font-heading text-lg font-semibold">
                    Permisos desde backend
                  </h2>
                  <p className="mt-1 text-sm leading-6">
                    Los botones se muestran segun availableActions. La interfaz no asume permisos solo por rol local.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={reviewResource.refetch}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-800"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Actualizar
              </button>
            </div>
          </section>

          {review.status === "completed" ? (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 shadow-panel">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="font-heading text-lg font-semibold">Revision finalizada</h2>
                  <p className="mt-1 text-sm leading-6">
                    La version final ya deberia estar disponible en el portal del cliente.
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

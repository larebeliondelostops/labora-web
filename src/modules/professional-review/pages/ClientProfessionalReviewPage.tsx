"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileCheck2, ShieldCheck } from "lucide-react";

import { InlineAlert } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import {
  FinalDownloadCenter,
  ProfessionalReviewCTA,
  RequestedDocumentsUpload,
  ReviewCommentsPanel,
  ReviewErrorState,
  ReviewPaymentCard,
  ReviewRequestErrors,
  ReviewRequestModal,
  ReviewScopeNotice,
  ReviewSkeleton,
  ReviewStatusBadge,
  ReviewStatusTimeline,
  VersionComparison,
  reviewHasAction,
  reviewStatusCopy,
  targetTypeCopy,
  trackProfessionalReviewEvent,
} from "@/src/modules/professional-review/components/professional-review-components";
import {
  useCaseProfessionalReview,
  useCreateProfessionalReview,
  useProfessionalReviewActions,
} from "@/src/modules/professional-review/hooks/useProfessionalReviews";
import type {
  RequestProfessionalReviewForm,
  ReviewTargetType,
  ReviewType,
} from "@/src/modules/professional-review/api/professional-review.types";

type ClientReviewView = "overview" | "request" | "payment" | "status" | "final";

const targetTypes: ReviewTargetType[] = [
  "report",
  "legal_draft",
  "generated_file",
  "case_result",
  "calculation",
];

const reviewTypes: ReviewType[] = [
  "report_review",
  "legal_draft_review",
  "lawsuit_draft_review",
  "claim_review",
  "petition_review",
  "calculation_review",
  "full_case_review",
];

function isTargetType(value: string | null | undefined): value is ReviewTargetType {
  return Boolean(value && targetTypes.includes(value as ReviewTargetType));
}

function isReviewType(value: string | null | undefined): value is ReviewType {
  return Boolean(value && reviewTypes.includes(value as ReviewType));
}

function makeInitialValues(
  caseId: string,
  targetType?: string | null,
  targetId?: string | null,
  reviewType?: string | null,
): RequestProfessionalReviewForm {
  const normalizedTargetType = isTargetType(targetType) ? targetType : "case_result";

  return {
    targetType: normalizedTargetType,
    targetId: targetId?.trim() || caseId,
    reviewType: isReviewType(reviewType)
      ? reviewType
      : normalizedTargetType === "legal_draft"
        ? "legal_draft_review"
        : normalizedTargetType === "report"
          ? "report_review"
          : normalizedTargetType === "calculation"
            ? "calculation_review"
            : "full_case_review",
    priority: "normal",
    clientNotes: "",
    acceptedScope: false,
  };
}

function validateRequest(values: RequestProfessionalReviewForm): ReviewRequestErrors {
  const errors: ReviewRequestErrors = {};

  if (!values.targetType) {
    errors.targetType = "Selecciona el tipo de documento.";
  }

  if (!values.targetId.trim()) {
    errors.targetId = "El documento objetivo es obligatorio.";
  }

  if (!values.priority) {
    errors.priority = "Selecciona una prioridad.";
  }

  if ((values.clientNotes || "").length > 1000) {
    errors.clientNotes = "El comentario no puede superar 1.000 caracteres.";
  }

  if (!values.acceptedScope) {
    errors.acceptedScope = "Debes aceptar el alcance de la revision.";
  }

  return errors;
}

function ClientReviewHeader({
  caseId,
  title,
}: {
  caseId: string;
  title: string;
}) {
  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <Link
        href={`/app/cases/${caseId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al expediente
      </Link>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
          Revision profesional
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
          {title}
        </h1>
      </div>
    </header>
  );
}

function ClientReviewTabs({
  caseId,
  active,
}: {
  caseId: string;
  active: ClientReviewView;
}) {
  const items: Array<{ id: ClientReviewView; label: string; href: string }> = [
    {
      id: "overview",
      label: "Resumen",
      href: `/app/cases/${caseId}/professional-review`,
    },
    {
      id: "request",
      label: "Solicitud",
      href: `/app/cases/${caseId}/professional-review/request`,
    },
    {
      id: "status",
      label: "Seguimiento",
      href: `/app/cases/${caseId}/professional-review/status`,
    },
    {
      id: "payment",
      label: "Pago",
      href: `/app/cases/${caseId}/professional-review/payment`,
    },
    {
      id: "final",
      label: "Final",
      href: `/app/cases/${caseId}/professional-review/final`,
    },
  ];

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-labora-ui bg-white p-2 shadow-panel">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={active === item.id ? "page" : undefined}
          className={
            active === item.id
              ? "inline-flex min-h-10 shrink-0 items-center rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white"
              : "inline-flex min-h-10 shrink-0 items-center rounded-lg px-4 py-2 text-sm font-semibold text-labora-gray hover:bg-labora-ivory hover:text-labora-deep"
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function ClientProfessionalReviewPage({
  caseId,
  view = "overview",
}: {
  caseId: string;
  view?: ClientReviewView;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetTypeParam = searchParams.get("targetType");
  const targetIdParam = searchParams.get("targetId");
  const reviewTypeParam = searchParams.get("reviewType");
  const reviewResource = useCaseProfessionalReview(caseId, { poll: view !== "request" });
  const createReview = useCreateProfessionalReview(caseId);
  const caseDetail = useCaseDetail(caseId);
  const actions = useProfessionalReviewActions(reviewResource.data?.id || "");
  const [values, setValues] = useState<RequestProfessionalReviewForm>(() =>
    makeInitialValues(caseId, targetTypeParam, targetIdParam, reviewTypeParam),
  );
  const [errors, setErrors] = useState<ReviewRequestErrors>({});

  const review = reviewResource.data;

  useEffect(() => {
    if (view === "request") {
      trackProfessionalReviewEvent("professional_review_request_started", {
        caseId,
        targetType: values.targetType,
        targetId: values.targetId,
        actorRole: "client",
      });
    }
  }, [caseId, values.targetId, values.targetType, view]);

  useEffect(() => {
    if (view === "status" && review) {
      trackProfessionalReviewEvent("professional_review_status_viewed", {
        caseId,
        reviewId: review.id,
        status: review.status,
        actorRole: "client",
      });
    }
  }, [caseId, review, view]);

  const title = useMemo(() => {
    if (view === "request") {
      return "Solicitar revision";
    }

    if (view === "payment") {
      return "Pago de revision";
    }

    if (view === "final") {
      return "Version final";
    }

    return "Seguimiento";
  }, [view]);

  function updateValue<TField extends keyof RequestProfessionalReviewForm>(
    field: TField,
    value: RequestProfessionalReviewForm[TField],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submitRequest() {
    const nextErrors = validateRequest(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const response = await createReview.request({
      targetType: values.targetType,
      targetId: values.targetId.trim(),
      reviewType: values.reviewType,
      priority: values.priority,
      clientNotes: values.clientNotes?.trim() || undefined,
    });

    trackProfessionalReviewEvent("professional_review_request_submitted", {
      caseId,
      reviewId: response.id,
      targetType: values.targetType,
      status: response.status,
      actorRole: "client",
    });

    reviewResource.refresh();

    if (response.requiresPayment || response.nextAction === "pay_review_order") {
      router.push(`/app/cases/${caseId}/professional-review/payment`);
      return;
    }

    router.push(`/app/cases/${caseId}/professional-review/status`);
  }

  async function createClientComment(payload: Parameters<typeof actions.createComment>[0]) {
    if (!review) {
      return;
    }

    await actions.createComment(payload);
    await reviewResource.refresh();
  }

  async function uploadRequested(payload: Parameters<typeof actions.uploadRequestedDocument>[0]) {
    if (!review) {
      return;
    }

    await actions.uploadRequestedDocument(payload);
    await reviewResource.refresh();
  }

  const caseHeader = caseDetail.data ? (
    <CaseHeader
      caseNumber={caseDetail.data.caseNumber}
      status={caseDetail.data.status}
      holderFullName={getHolderFullName(caseDetail.data.holder)}
      updatedAt={caseDetail.data.updatedAt}
    />
  ) : null;

  if (reviewResource.isLoading || caseDetail.isLoading) {
    return <ReviewSkeleton />;
  }

  if (reviewResource.error && !review) {
    return <ReviewErrorState message={reviewResource.error} onRetry={reviewResource.refetch} />;
  }

  if (view === "request") {
    return (
      <section className="space-y-5 pb-24 md:pb-0">
        {caseHeader}
        <ClientReviewHeader caseId={caseId} title={title} />
        <ClientReviewTabs caseId={caseId} active={view} />
        {review && !["completed", "cancelled", "rejected"].includes(review.status) ? (
          <InlineAlert tone="warning">
            Ya existe una revision activa para este expediente. Puedes consultar su estado en seguimiento.
          </InlineAlert>
        ) : null}
        <ReviewRequestModal
          values={values}
          errors={errors}
          isSubmitting={createReview.isLoading}
          submitError={createReview.error}
          onChange={updateValue}
          onSubmit={submitRequest}
        />
        <ReviewScopeNotice />
      </section>
    );
  }

  if (!review) {
    return (
      <section className="space-y-5 pb-24 md:pb-0">
        {caseHeader}
        <ClientReviewHeader caseId={caseId} title="Revision profesional" />
        <ClientReviewTabs caseId={caseId} active="overview" />
        <ProfessionalReviewCTA
          caseId={caseId}
          targetType="case_result"
          targetId={caseId}
          recommended
        />
        <ReviewScopeNotice />
      </section>
    );
  }

  return (
    <section className="space-y-5 pb-24 md:pb-0">
      {caseHeader}
      <ClientReviewHeader caseId={caseId} title={title} />
      <ClientReviewTabs caseId={caseId} active={view} />

      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <ReviewStatusBadge status={review.status} />
              <span className="rounded-full border border-labora-ui bg-labora-ivory px-3 py-1 text-xs font-semibold text-labora-gray">
                {targetTypeCopy[review.targetType]}
              </span>
            </div>
            <h2 className="mt-3 font-heading text-2xl font-semibold text-labora-charcoal">
              {reviewStatusCopy[review.status].message}
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Caso {review.caseNumber}. Proxima accion: {review.nextAction || "esperar actualizacion del equipo"}.
            </p>
          </div>
          <Link
            href={`/app/cases/${caseId}/professional-review/final`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            Ver version final
          </Link>
        </div>
      </section>

      {view === "payment" ? <ReviewPaymentCard review={review} /> : null}

      {view !== "payment" ? <ReviewStatusTimeline status={review.status} /> : null}

      {review.status === "client_action_required" ? (
        <RequestedDocumentsUpload
          reviewId={review.id}
          requestedDocuments={review.requestedDocuments}
          onUpload={uploadRequested}
          isUploading={actions.isLoading}
          error={actions.error}
        />
      ) : null}

      {view === "final" ? (
        <>
          <FinalDownloadCenter review={review} />
          <VersionComparison
            originalFile={review.originalFile}
            reviewedFiles={review.reviewedFiles}
          />
        </>
      ) : null}

      {view !== "final" ? (
        <ReviewCommentsPanel
          reviewId={review.id}
          comments={review.comments}
          mode="client"
          canComment={reviewHasAction(review, "comment")}
          isSubmitting={actions.isLoading}
          error={actions.error}
          onCreate={createClientComment}
        />
      ) : null}

      <ReviewScopeNotice />

      <Link
        href={`/app/cases/${caseId}`}
        className="fixed inset-x-4 bottom-4 z-20 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white shadow-panel md:hidden"
      >
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Volver al expediente
      </Link>
    </section>
  );
}

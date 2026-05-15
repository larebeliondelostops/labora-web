"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  AdminQuestionnaireReview,
  QuestionnaireErrorState,
  QuestionnaireSkeleton,
} from "@/src/modules/questionnaire/components/questionnaire-components";
import { useAdminQuestionnaireReview } from "@/src/modules/questionnaire/hooks/useQuestionnaire";

export function AdminQuestionnaireReviewPage({ caseId }: { caseId: string }) {
  const review = useAdminQuestionnaireReview(caseId);

  if (review.isLoading) {
    return <QuestionnaireSkeleton />;
  }

  if (review.error || !review.data) {
    return (
      <QuestionnaireErrorState
        message={review.error || "No encontramos el cuestionario de este expediente."}
        onRetry={review.refetch}
      />
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <Link
          href={`/admin/cases/${caseId}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al expediente
        </Link>
      </div>
      <AdminQuestionnaireReview
        data={review.data}
        onDecision={review.decide}
        isMutating={review.isMutating}
        error={review.mutationError}
      />
    </main>
  );
}

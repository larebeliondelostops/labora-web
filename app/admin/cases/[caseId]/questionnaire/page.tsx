import type { Metadata } from "next";

import { AdminQuestionnaireReviewPage } from "@/src/modules/questionnaire/pages/AdminQuestionnaireReviewPage";

export const metadata: Metadata = {
  title: "Revision del cuestionario",
  description: "Vista interna de respuestas y senales del cuestionario guiado.",
};

export default async function AdminCaseQuestionnaireRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return <AdminQuestionnaireReviewPage caseId={caseId} />;
}

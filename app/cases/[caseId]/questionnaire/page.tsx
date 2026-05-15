import { redirect } from "next/navigation";

export default async function QuestionnaireRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/questionnaire`);
}

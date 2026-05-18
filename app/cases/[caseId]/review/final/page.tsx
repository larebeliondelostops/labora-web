import { redirect } from "next/navigation";

export default async function CaseReviewFinalAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/professional-review/final`);
}

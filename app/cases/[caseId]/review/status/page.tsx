import { redirect } from "next/navigation";

export default async function CaseReviewStatusAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/professional-review/status`);
}

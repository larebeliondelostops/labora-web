import { redirect } from "next/navigation";

export default async function CaseReviewRequestAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/professional-review/request`);
}

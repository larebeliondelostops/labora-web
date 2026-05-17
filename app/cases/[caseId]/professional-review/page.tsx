import { redirect } from "next/navigation";

export default async function CaseProfessionalReviewAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/professional-review`);
}

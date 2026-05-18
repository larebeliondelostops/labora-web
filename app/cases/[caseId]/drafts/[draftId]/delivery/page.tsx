import { redirect } from "next/navigation";

export default async function CaseDraftDeliveryAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string; draftId: string }>;
}) {
  const { caseId, draftId } = await params;

  redirect(`/app/cases/${caseId}/drafts/${draftId}/delivery`);
}

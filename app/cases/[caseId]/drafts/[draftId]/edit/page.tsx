import { redirect } from "next/navigation";

export default async function CaseDraftEditorAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string; draftId: string }>;
}) {
  const { caseId, draftId } = await params;

  redirect(`/app/cases/${caseId}/drafts/${draftId}/edit`);
}

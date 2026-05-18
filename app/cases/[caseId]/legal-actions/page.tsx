import { redirect } from "next/navigation";

export default async function CaseLegalActionsAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/legal-actions`);
}

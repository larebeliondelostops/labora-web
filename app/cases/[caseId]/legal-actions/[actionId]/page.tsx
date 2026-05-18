import { redirect } from "next/navigation";

export default async function CaseLegalActionAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string; actionId: string }>;
}) {
  const { caseId, actionId } = await params;

  redirect(`/app/cases/${caseId}/legal-actions/${actionId}`);
}

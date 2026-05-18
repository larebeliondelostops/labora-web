import { redirect } from "next/navigation";

export default async function CaseDeliveryCloseAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/delivery/close`);
}

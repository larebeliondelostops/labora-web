import { redirect } from "next/navigation";

export default async function CaseDeliveryComplementAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/delivery/complement`);
}

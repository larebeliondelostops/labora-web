import { redirect } from "next/navigation";

export default async function CaseDeliveryTimelineAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/delivery/timeline`);
}

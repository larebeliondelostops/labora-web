import { redirect } from "next/navigation";

export default async function CaseDeliveryDownloadsAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/delivery/downloads`);
}

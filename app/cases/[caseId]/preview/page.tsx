import { redirect } from "next/navigation";

export default async function CasePreviewRedirectRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/preview`);
}

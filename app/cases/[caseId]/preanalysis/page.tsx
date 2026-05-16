import { redirect } from "next/navigation";

export default async function CasePreanalysisRedirectRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/pre-analysis`);
}

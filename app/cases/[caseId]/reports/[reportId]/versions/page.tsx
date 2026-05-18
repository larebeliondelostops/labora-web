import { redirect } from "next/navigation";

export default async function CaseReportVersionsAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string; reportId: string }>;
}) {
  const { caseId, reportId } = await params;

  redirect(`/app/cases/${caseId}/reports/${reportId}/versions`);
}

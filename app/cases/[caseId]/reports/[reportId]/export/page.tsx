import { redirect } from "next/navigation";

export default async function CaseReportExportAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string; reportId: string }>;
}) {
  const { caseId, reportId } = await params;

  redirect(`/app/cases/${caseId}/reports/${reportId}/export`);
}

import { redirect } from "next/navigation";

export default async function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  redirect(`/admin/cases/${caseId}/overview`);
}

import { redirect } from "next/navigation";

export default async function DocumentPrecheckRedirectRoute({
  params,
}: {
  params: Promise<{ caseId: string; documentId: string }>;
}) {
  const { caseId, documentId } = await params;

  redirect(`/app/cases/${caseId}/documents/${documentId}/precheck`);
}

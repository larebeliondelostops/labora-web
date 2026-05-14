import { redirect } from "next/navigation";

export default async function DocumentsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/documents`);
}

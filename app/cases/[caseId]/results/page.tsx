import { redirect } from "next/navigation";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/results`);
}

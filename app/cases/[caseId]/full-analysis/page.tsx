import { redirect } from "next/navigation";

export default async function CaseFullAnalysisAliasRoute({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { caseId } = await params;
  const { tab } = await searchParams;
  const query = tab ? `?tab=${encodeURIComponent(tab)}` : "";

  redirect(`/app/cases/${caseId}/full-analysis${query}`);
}

import { redirect } from "next/navigation";

export default async function ExtractionRoute({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { caseId } = await params;
  const query = await searchParams;
  const suffix = query?.tab ? `?tab=${encodeURIComponent(query.tab)}` : "";

  redirect(`/app/cases/${caseId}/extraction${suffix}`);
}

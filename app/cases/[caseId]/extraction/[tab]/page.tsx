import { redirect } from "next/navigation";

const tabAliases: Record<string, string> = {
  timeline: "timeline",
  employers: "employers",
  weeks: "weeks",
  salaries: "salaries",
  gaps: "gaps",
  corrections: "corrections",
  confirm: "confirm",
  "pdf-data": "pdf-data",
  summary: "summary",
};

export default async function ExtractionTabRoute({
  params,
}: {
  params: Promise<{ caseId: string; tab: string }>;
}) {
  const { caseId, tab } = await params;
  const normalized = tabAliases[tab] || "summary";

  redirect(`/app/cases/${caseId}/extraction?tab=${normalized}`);
}

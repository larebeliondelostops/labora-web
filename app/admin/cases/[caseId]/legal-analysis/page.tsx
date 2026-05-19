import type { Metadata } from "next";

import { AdminCaseWorkspacePage } from "@/src/modules/admin/pages/AdminCaseWorkspacePage";

export const metadata: Metadata = {
  title: "Consola juridica",
  description: "Revision juridica interna del expediente.",
};

export default async function AdminCaseLegalAnalysisRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return <AdminCaseWorkspacePage caseId={caseId} section="legal-analysis" />;
}

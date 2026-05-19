import type { Metadata } from "next";

import { AdminCaseWorkspacePage } from "@/src/modules/admin/pages/AdminCaseWorkspacePage";

export const metadata: Metadata = {
  title: "Gestor de escritos",
  description: "Revision administrativa de escritos juridicos.",
};

export default async function AdminCaseLegalDraftsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return <AdminCaseWorkspacePage caseId={caseId} section="legal-drafts" />;
}

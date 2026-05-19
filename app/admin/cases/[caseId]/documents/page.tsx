import type { Metadata } from "next";

import { AdminCaseWorkspacePage } from "@/src/modules/admin/pages/AdminCaseWorkspacePage";

export const metadata: Metadata = {
  title: "Revision documental",
  description: "Revision administrativa de documentos del expediente.",
};

export default async function AdminCaseDocumentsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return <AdminCaseWorkspacePage caseId={caseId} section="documents" />;
}

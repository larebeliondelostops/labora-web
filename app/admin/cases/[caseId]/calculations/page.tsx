import type { Metadata } from "next";

import { AdminCaseWorkspacePage } from "@/src/modules/admin/pages/AdminCaseWorkspacePage";

export const metadata: Metadata = {
  title: "Consola de calculo",
  description: "Revision administrativa de calculos.",
};

export default async function AdminCaseCalculationsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return <AdminCaseWorkspacePage caseId={caseId} section="calculations" />;
}

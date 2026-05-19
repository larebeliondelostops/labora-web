import type { Metadata } from "next";

import { AdminCaseWorkspacePage } from "@/src/modules/admin/pages/AdminCaseWorkspacePage";

export const metadata: Metadata = {
  title: "Extraccion OCR",
  description: "Consola de extraccion y correccion OCR.",
};

export default async function AdminCaseExtractionRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return <AdminCaseWorkspacePage caseId={caseId} section="extraction" />;
}

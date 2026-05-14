import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DocumentsPage } from "@/src/modules/documents/pages/DocumentsPage";

export const metadata: Metadata = {
  title: "Documentos",
  description: "Carga y gestion documental del expediente digital.",
};

export default async function AppCaseDocumentsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <DocumentsPage caseId={caseId} />
    </CasesAppFrame>
  );
}

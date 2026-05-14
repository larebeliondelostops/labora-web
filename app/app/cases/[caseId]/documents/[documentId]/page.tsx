import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DocumentViewerPage } from "@/src/modules/documents/pages/DocumentViewerPage";

export const metadata: Metadata = {
  title: "Documento",
  description: "Visor y revision documental del expediente digital.",
};

export default async function AppCaseDocumentRoute({
  params,
}: {
  params: Promise<{ caseId: string; documentId: string }>;
}) {
  const { caseId, documentId } = await params;

  return (
    <CasesAppFrame>
      <DocumentViewerPage caseId={caseId} documentId={documentId} />
    </CasesAppFrame>
  );
}

import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DocumentViewerPage } from "@/src/modules/documents/pages/DocumentViewerPage";

export const metadata: Metadata = {
  title: "Revision documental",
  description: "Revision de clasificacion y validacion documental.",
};

export default async function AppCaseDocumentReviewRoute({
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

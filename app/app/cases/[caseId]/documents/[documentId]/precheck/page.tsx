import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DocumentPrecheckPage } from "@/src/modules/document-precheck/pages/DocumentPrecheckPage";

export const metadata: Metadata = {
  title: "IA documental preliminar",
  description: "Revision automatica de calidad documental del expediente.",
};

export default async function AppDocumentPrecheckRoute({
  params,
}: {
  params: Promise<{ caseId: string; documentId: string }>;
}) {
  const { caseId, documentId } = await params;

  return (
    <CasesAppFrame>
      <DocumentPrecheckPage caseId={caseId} documentId={documentId} />
    </CasesAppFrame>
  );
}

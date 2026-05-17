import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { PreviewPage } from "@/src/modules/paywall-preview/pages/PreviewPage";

export const metadata: Metadata = {
  title: "Vista previa del resultado",
  description: "Vista previa limitada y paywall del analisis completo.",
};

export default async function AppCasePreviewRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <PreviewPage caseId={caseId} />
    </CasesAppFrame>
  );
}

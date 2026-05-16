import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { PreAnalysisLockedPreviewPage } from "@/src/modules/preanalysis/pages/PreAnalysisLockedPreviewPage";

export const metadata: Metadata = {
  title: "Vista previa bloqueada",
  description: "Vista previa bloqueada del analisis completo.",
};

export default async function AppCasePreviewRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <PreAnalysisLockedPreviewPage caseId={caseId} />
    </CasesAppFrame>
  );
}

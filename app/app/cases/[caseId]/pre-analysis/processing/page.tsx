import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { PreAnalysisPage } from "@/src/modules/preanalysis/pages/PreAnalysisPage";

export const metadata: Metadata = {
  title: "Procesando preanalisis",
  description: "Estado de procesamiento del analisis preliminar.",
};

export default async function AppCasePreAnalysisProcessingRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <PreAnalysisPage caseId={caseId} />
    </CasesAppFrame>
  );
}

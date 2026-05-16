import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { PreAnalysisPage } from "@/src/modules/preanalysis/pages/PreAnalysisPage";

export const metadata: Metadata = {
  title: "Preanalisis",
  description: "Analisis preliminar gratuito del expediente.",
};

export default async function AppCasePreAnalysisRoute({
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

import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { PreAnalysisPage } from "@/src/modules/preanalysis/pages/PreAnalysisPage";

export const metadata: Metadata = {
  title: "Resultado preliminar",
  description: "Resultado preliminar gratuito del expediente.",
};

export default async function AppCasePreAnalysisResultRoute({
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

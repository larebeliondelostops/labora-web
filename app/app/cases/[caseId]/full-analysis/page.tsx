import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { FullAnalysisPage } from "@/src/modules/full-analysis/pages/FullAnalysisPage";

export const metadata: Metadata = {
  title: "Analisis completo",
  description: "Analisis juridico y de calculo completo del expediente.",
};

export default async function AppCaseFullAnalysisRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <FullAnalysisPage caseId={caseId} />
    </CasesAppFrame>
  );
}

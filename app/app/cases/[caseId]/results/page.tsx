import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CasePreanalysisPage } from "@/src/modules/cases/pages/CasePreanalysisPage";

export const metadata: Metadata = {
  title: "Resultado preliminar",
  description: "Resultado documental preliminar del expediente.",
};

export default async function AppCaseResultsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CasePreanalysisPage caseId={caseId} />
    </CasesAppFrame>
  );
}

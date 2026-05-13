import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseModuleRedirectPage } from "@/src/modules/cases/pages/CaseModuleRedirectPage";

export const metadata: Metadata = {
  title: "Preanalisis",
  description: "Redireccion al modulo de resultado preliminar.",
};

export default async function AppCasePreanalysisRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseModuleRedirectPage destination={`/cases/${caseId}/results`} />
    </CasesAppFrame>
  );
}

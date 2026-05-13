import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseModuleRedirectPage } from "@/src/modules/cases/pages/CaseModuleRedirectPage";

export const metadata: Metadata = {
  title: "Informe",
  description: "Redireccion al modulo de informes.",
};

export default async function AppCaseReportRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseModuleRedirectPage destination={`/cases/${caseId}/report`} />
    </CasesAppFrame>
  );
}

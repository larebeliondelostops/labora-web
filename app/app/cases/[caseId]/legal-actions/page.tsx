import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseModuleRedirectPage } from "@/src/modules/cases/pages/CaseModuleRedirectPage";

export const metadata: Metadata = {
  title: "Escritos",
  description: "Redireccion al modulo de acciones juridicas.",
};

export default async function AppCaseLegalActionsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseModuleRedirectPage destination={`/cases/${caseId}/legal-actions`} />
    </CasesAppFrame>
  );
}

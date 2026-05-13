import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseModuleRedirectPage } from "@/src/modules/cases/pages/CaseModuleRedirectPage";

export const metadata: Metadata = {
  title: "Documentos",
  description: "Redireccion al modulo de carga documental.",
};

export default async function AppCaseDocumentsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseModuleRedirectPage destination={`/cases/${caseId}/documents`} />
    </CasesAppFrame>
  );
}

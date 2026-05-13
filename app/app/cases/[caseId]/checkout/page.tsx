import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseModuleRedirectPage } from "@/src/modules/cases/pages/CaseModuleRedirectPage";

export const metadata: Metadata = {
  title: "Pago",
  description: "Redireccion al modulo de pago.",
};

export default async function AppCaseCheckoutRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseModuleRedirectPage destination={`/cases/${caseId}/payment`} />
    </CasesAppFrame>
  );
}

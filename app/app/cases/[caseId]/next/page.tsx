import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseNextRedirectPage } from "@/src/modules/cases/pages/CaseNextRedirectPage";

export const metadata: Metadata = {
  title: "Siguiente paso",
  description: "Redireccion inteligente al siguiente paso del expediente.",
};

export default async function AppCaseNextRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseNextRedirectPage caseId={caseId} />
    </CasesAppFrame>
  );
}

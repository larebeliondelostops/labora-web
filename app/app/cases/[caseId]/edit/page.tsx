import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseEditPage } from "@/src/modules/cases/pages/CaseEditPage";

export const metadata: Metadata = {
  title: "Editar expediente",
  description: "Corrige informacion basica de tu expediente digital.",
};

export default async function AppCaseEditRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseEditPage caseId={caseId} />
    </CasesAppFrame>
  );
}

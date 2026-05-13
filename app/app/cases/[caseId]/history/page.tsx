import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseHistoryPage } from "@/src/modules/cases/pages/CaseHistoryPage";

export const metadata: Metadata = {
  title: "Historial del expediente",
  description: "Consulta la trazabilidad de tu expediente digital.",
};

export default async function AppCaseHistoryRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseHistoryPage caseId={caseId} />
    </CasesAppFrame>
  );
}

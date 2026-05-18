import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseProgressPage } from "@/src/modules/cases/pages/CaseProgressPage";

export const metadata: Metadata = {
  title: "Progreso del expediente",
  description: "Etapas del flujo del expediente.",
};

export default async function AppCaseProgressRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseProgressPage caseId={caseId} />
    </CasesAppFrame>
  );
}

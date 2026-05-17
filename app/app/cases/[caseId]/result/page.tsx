import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { ResultPage } from "@/src/modules/result/pages/ResultPage";

export const metadata: Metadata = {
  title: "Resultado completo",
  description: "Conclusion ejecutiva, inconsistencias y ruta recomendada del expediente.",
};

export default async function AppCaseResultRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <ResultPage caseId={caseId} />
    </CasesAppFrame>
  );
}

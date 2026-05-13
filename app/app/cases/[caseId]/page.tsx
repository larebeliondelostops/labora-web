import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseDetailPage } from "@/src/modules/cases/pages/CaseDetailPage";

export const metadata: Metadata = {
  title: "Expediente",
  description: "Panel de estado del expediente digital en Labora.",
};

export default async function AppCaseDetailRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseDetailPage caseId={caseId} />
    </CasesAppFrame>
  );
}

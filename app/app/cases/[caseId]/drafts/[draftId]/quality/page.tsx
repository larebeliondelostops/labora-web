import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { QualityCheckPage } from "@/src/modules/legal-actions/pages/QualityCheckPage";

export const metadata: Metadata = {
  title: "Calidad del escrito",
  description: "Control de calidad del borrador juridico.",
};

export default async function AppCaseDraftQualityRoute({
  params,
}: {
  params: Promise<{ caseId: string; draftId: string }>;
}) {
  const { caseId, draftId } = await params;

  return (
    <CasesAppFrame>
      <QualityCheckPage caseId={caseId} draftId={draftId} />
    </CasesAppFrame>
  );
}

import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DraftDeliveryPage } from "@/src/modules/legal-actions/pages/DraftDeliveryPage";

export const metadata: Metadata = {
  title: "Entrega del escrito",
  description: "Exportacion y entrega del borrador juridico.",
};

export default async function AppCaseDraftDeliveryRoute({
  params,
}: {
  params: Promise<{ caseId: string; draftId: string }>;
}) {
  const { caseId, draftId } = await params;

  return (
    <CasesAppFrame>
      <DraftDeliveryPage caseId={caseId} draftId={draftId} />
    </CasesAppFrame>
  );
}

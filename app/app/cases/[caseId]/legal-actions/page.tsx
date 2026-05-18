import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { LegalActionsPage } from "@/src/modules/legal-actions/pages/LegalActionsPage";

export const metadata: Metadata = {
  title: "Acciones juridicas",
  description: "Selector de acciones juridicas y generacion de escritos.",
};

export default async function AppCaseLegalActionsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <LegalActionsPage caseId={caseId} />
    </CasesAppFrame>
  );
}

import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { LegalDraftWizardPage } from "@/src/modules/legal-actions/pages/LegalDraftWizardPage";

export const metadata: Metadata = {
  title: "Wizard de escrito",
  description: "Datos finales para generar el borrador juridico.",
};

export default async function AppCaseLegalActionWizardRoute({
  params,
}: {
  params: Promise<{ caseId: string; actionId: string }>;
}) {
  const { caseId, actionId } = await params;

  return (
    <CasesAppFrame>
      <LegalDraftWizardPage caseId={caseId} actionId={actionId} />
    </CasesAppFrame>
  );
}

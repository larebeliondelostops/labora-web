import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { ClientProfessionalReviewPage } from "@/src/modules/professional-review/pages/ClientProfessionalReviewPage";

export const metadata: Metadata = {
  title: "Version final revisada",
  description: "Centro de descarga de la version revisada profesionalmente.",
};

export default async function AppCaseProfessionalReviewFinalRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <ClientProfessionalReviewPage caseId={caseId} view="final" />
    </CasesAppFrame>
  );
}

import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { ClientProfessionalReviewPage } from "@/src/modules/professional-review/pages/ClientProfessionalReviewPage";

export const metadata: Metadata = {
  title: "Solicitar revision profesional",
  description: "Formulario para solicitar revision profesional de un documento.",
};

export default async function AppCaseProfessionalReviewRequestRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <ClientProfessionalReviewPage caseId={caseId} view="request" />
    </CasesAppFrame>
  );
}

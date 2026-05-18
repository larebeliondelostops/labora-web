import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { ClientProfessionalReviewPage } from "@/src/modules/professional-review/pages/ClientProfessionalReviewPage";

export const metadata: Metadata = {
  title: "Seguimiento de revision profesional",
  description: "Estado, comentarios y documentos solicitados de la revision.",
};

export default async function AppCaseProfessionalReviewStatusRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <ClientProfessionalReviewPage caseId={caseId} view="status" />
    </CasesAppFrame>
  );
}

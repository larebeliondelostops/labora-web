import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { ClientProfessionalReviewPage } from "@/src/modules/professional-review/pages/ClientProfessionalReviewPage";

export const metadata: Metadata = {
  title: "Pago de revision profesional",
  description: "Estado de pago adicional para revision profesional.",
};

export default async function AppCaseProfessionalReviewPaymentRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <ClientProfessionalReviewPage caseId={caseId} view="payment" />
    </CasesAppFrame>
  );
}

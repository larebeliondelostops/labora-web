import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DeliveryComplementPage } from "@/src/modules/delivery/pages/DeliveryComplementPage";

export const metadata: Metadata = {
  title: "Complementar expediente",
  description: "Solicitud de complemento para la entrega final.",
};

export default async function AppCaseDeliveryComplementRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <DeliveryComplementPage caseId={caseId} />
    </CasesAppFrame>
  );
}

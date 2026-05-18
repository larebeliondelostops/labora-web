import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DeliveryHomePage } from "@/src/modules/delivery/pages/DeliveryHomePage";

export const metadata: Metadata = {
  title: "Entrega final",
  description: "Centro de entrega final y descargas del expediente.",
};

export default async function AppCaseDeliveryRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <DeliveryHomePage caseId={caseId} />
    </CasesAppFrame>
  );
}

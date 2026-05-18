import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DeliveryClosePage } from "@/src/modules/delivery/pages/DeliveryClosePage";

export const metadata: Metadata = {
  title: "Cerrar caso",
  description: "Cierre controlado del expediente.",
};

export default async function AppCaseDeliveryCloseRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <DeliveryClosePage caseId={caseId} />
    </CasesAppFrame>
  );
}

import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DeliveryTimelinePage } from "@/src/modules/delivery/pages/DeliveryTimelinePage";

export const metadata: Metadata = {
  title: "Timeline de entrega",
  description: "Trazabilidad visible de la entrega final.",
};

export default async function AppCaseDeliveryTimelineRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <DeliveryTimelinePage caseId={caseId} />
    </CasesAppFrame>
  );
}

import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DeliverySharePage } from "@/src/modules/delivery/pages/DeliverySharePage";

export const metadata: Metadata = {
  title: "Compartir entrega final",
  description: "Gestion de enlaces temporales para compartir documentos.",
};

export default async function AppCaseDeliveryShareRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <DeliverySharePage caseId={caseId} />
    </CasesAppFrame>
  );
}

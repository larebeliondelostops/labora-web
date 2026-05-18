import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DeliveryDownloadsPage } from "@/src/modules/delivery/pages/DeliveryDownloadsPage";

export const metadata: Metadata = {
  title: "Descargas de entrega final",
  description: "Archivos finales disponibles para descarga.",
};

export default async function AppCaseDeliveryDownloadsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <DeliveryDownloadsPage caseId={caseId} />
    </CasesAppFrame>
  );
}

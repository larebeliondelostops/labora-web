import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { PaymentUnlockPage } from "@/src/modules/payments/pages/PaymentUnlockPage";

export const metadata: Metadata = {
  title: "Desbloquear analisis",
  description: "Pago seguro para desbloquear el analisis completo del expediente.",
};

export default async function AppCaseCheckoutRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <PaymentUnlockPage caseId={caseId} />
    </CasesAppFrame>
  );
}

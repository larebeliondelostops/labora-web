import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { PaymentReceiptPage } from "@/src/modules/payments/pages/PaymentReceiptPage";

export const metadata: Metadata = {
  title: "Comprobante de pago",
  description: "Comprobante del desbloqueo del analisis completo.",
};

export default async function AppCasePaymentReceiptRoute({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { caseId } = await params;
  const { orderId } = await searchParams;

  return (
    <CasesAppFrame>
      <PaymentReceiptPage caseId={caseId} orderId={orderId} />
    </CasesAppFrame>
  );
}

"use client";

import { useMemo } from "react";

import {
  CasePaymentHeader,
  PaymentErrorAlert,
  PaymentSkeleton,
  PaymentStateCard,
  ReceiptCard,
} from "@/src/modules/payments/components/payment-components";
import {
  usePaymentFlow,
  usePaymentReceipt,
} from "@/src/modules/payments/hooks/usePaymentFlow";

export function PaymentReceiptPage({
  caseId,
  orderId,
}: {
  caseId: string;
  orderId?: string;
}) {
  const flow = usePaymentFlow(caseId, { poll: false });
  const receiptOrderId = useMemo(
    () => orderId || flow.data?.order?.id || null,
    [flow.data?.order?.id, orderId],
  );
  const receipt = usePaymentReceipt(receiptOrderId);

  if ((flow.isLoading && !orderId) || receipt.isLoading) {
    return <PaymentSkeleton />;
  }

  if (!receiptOrderId) {
    return (
      <PaymentErrorAlert
        message="No encontramos una orden para consultar el comprobante."
        onRetry={flow.refetch}
      />
    );
  }

  if (receipt.error && !receipt.data) {
    return (
      <section className="space-y-5">
        {flow.data ? (
          <CasePaymentHeader
            caseId={caseId}
            status={flow.data.caseStatus}
            caseCode={flow.data.caseId}
          />
        ) : null}
        <PaymentErrorAlert message={receipt.error} onRetry={receipt.refetch} />
        {flow.data ? <PaymentStateCard flow={flow.data} onRefresh={flow.refetch} /> : null}
      </section>
    );
  }

  if (!receipt.data) {
    return (
      <PaymentErrorAlert
        message="El comprobante aun no esta disponible."
        onRetry={receipt.refetch}
      />
    );
  }

  return (
    <section className="space-y-5 pb-24 md:pb-0">
      <CasePaymentHeader
        caseId={caseId}
        status={flow.data?.caseStatus || "payment_approved"}
        caseCode={flow.data?.caseId}
      />
      <ReceiptCard
        receipt={receipt.data}
        caseId={caseId}
        flowStatus={flow.data?.caseStatus}
        isUnlocked={flow.data?.isUnlocked}
      />
    </section>
  );
}

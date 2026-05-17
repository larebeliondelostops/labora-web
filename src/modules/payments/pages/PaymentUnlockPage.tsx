"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import {
  CasePaymentHeader,
  CheckoutForm,
  OrderSummaryCard,
  PaymentErrorAlert,
  PaymentSkeleton,
  PaymentStateCard,
  ScopeNotice,
  SecurePaymentNotice,
  UnlockBenefitsList,
} from "@/src/modules/payments/components/payment-components";
import type {
  CheckoutFormErrors,
  CheckoutFormValues,
} from "@/src/modules/payments/components/payment-components";
import {
  useCreatePaymentOrder,
  usePaymentFlow,
  useStartPaymentCheckout,
} from "@/src/modules/payments/hooks/usePaymentFlow";
import type {
  PaymentFlowDto,
  PaymentMethod,
  PaymentOrderDto,
} from "@/src/modules/payments/api/payments.types";

const terminalPaymentStatuses = [
  "payment_pending",
  "payment_approved",
  "payment_rejected",
  "payment_failed",
  "payment_expired",
  "payment_requires_review",
  "full_analysis_unlocked",
] as const;

function makeInitialValues(): CheckoutFormValues {
  return {
    paymentMethod: "",
    fullName: "",
    email: "",
    documentType: "",
    documentNumber: "",
    phone: "",
    scopeAccepted: false,
  };
}

function isTerminalFlow(flow: PaymentFlowDto) {
  return terminalPaymentStatuses.includes(
    flow.caseStatus as (typeof terminalPaymentStatuses)[number],
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateCheckout(values: CheckoutFormValues): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};

  if (!values.paymentMethod) {
    errors.paymentMethod = "Selecciona un metodo de pago.";
  }

  if (!values.fullName.trim()) {
    errors.fullName = "Ingresa el nombre completo del pagador.";
  }

  if (!isValidEmail(values.email)) {
    errors.email = "Ingresa un correo valido.";
  }

  if (values.paymentMethod === "CARD" || values.paymentMethod === "PSE") {
    if (!values.documentType) {
      errors.documentType = "Selecciona el tipo de documento.";
    }

    if (!values.documentNumber.trim()) {
      errors.documentNumber = "Ingresa el numero de documento.";
    }
  }

  if (values.phone.trim() && values.phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Ingresa un celular valido.";
  }

  if (!values.scopeAccepted) {
    errors.scopeAccepted = "Debes confirmar el alcance del servicio.";
  }

  return errors;
}

function trackPaymentEvent(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("labora:analytics", {
      detail: {
        event,
        payload,
      },
    }),
  );
}

function makePaymentPayload(flow?: PaymentFlowDto | null) {
  return {
    orderId: flow?.order?.id,
    paymentId: flow?.payment?.id,
    status: flow?.caseStatus,
    amount: flow?.order?.totalAmount,
    currency: flow?.order?.currency,
    paymentMethod: flow?.payment?.paymentMethod,
  };
}

export function PaymentUnlockPage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flowResource = usePaymentFlow(caseId, { poll: true });
  const createOrder = useCreatePaymentOrder(caseId);
  const checkout = useStartPaymentCheckout();
  const caseDetail = useCaseDetail(caseId);
  const [localOrder, setLocalOrder] = useState<PaymentOrderDto | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [values, setValues] = useState<CheckoutFormValues>(() => makeInitialValues());
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const viewedRef = useRef(false);
  const prefilledRef = useRef(false);
  const paymentReturnHandledRef = useRef(false);
  const paymentReturn = searchParams.get("payment") === "return";

  const flow = flowResource.data;
  const order = flow?.order || localOrder;
  const checkoutVisible =
    Boolean(order) &&
    !flow?.isUnlocked &&
    !isTerminalFlow(flow || {
      caseId,
      caseStatus: "payment_not_started",
      canPay: false,
      canRetry: false,
      canContinue: false,
      isUnlocked: false,
      order: null,
      payment: null,
      receipt: null,
    }) &&
    (showCheckout || flow?.caseStatus === "payment_order_created");

  useEffect(() => {
    if (!flow || viewedRef.current) {
      return;
    }

    viewedRef.current = true;
    trackPaymentEvent("payment_unlock_viewed", {
      caseId,
      ...makePaymentPayload(flow),
    });
  }, [caseId, flow]);

  useEffect(() => {
    if (!flow) {
      return;
    }

    if (flow.caseStatus === "payment_pending") {
      trackPaymentEvent("payment_pending_viewed", {
        caseId,
        ...makePaymentPayload(flow),
      });
    }

    if (flow.caseStatus === "full_analysis_unlocked") {
      trackPaymentEvent("payment_approved_viewed", {
        caseId,
        ...makePaymentPayload(flow),
      });
      router.prefetch(`/app/cases/${caseId}/results`);
    }

    if (flow.caseStatus === "payment_rejected") {
      trackPaymentEvent("payment_rejected_viewed", {
        caseId,
        ...makePaymentPayload(flow),
      });
    }

    if (flow.caseStatus === "payment_failed") {
      trackPaymentEvent("payment_failed_viewed", {
        caseId,
        ...makePaymentPayload(flow),
      });
    }
  }, [caseId, flow, router]);

  useEffect(() => {
    if (!paymentReturn || paymentReturnHandledRef.current) {
      return;
    }

    paymentReturnHandledRef.current = true;
    flowResource.refresh();
  }, [paymentReturn]);

  useEffect(() => {
    if (!caseDetail.data || prefilledRef.current) {
      return;
    }

    prefilledRef.current = true;
    const holder = caseDetail.data.holder;
    const holderDocumentType = holder.documentType;
    const documentType =
      holderDocumentType === "PA"
        ? "PASSPORT"
        : holderDocumentType === "CC" ||
            holderDocumentType === "CE" ||
            holderDocumentType === "NIT"
          ? holderDocumentType
          : "";

    setValues((current) => ({
      ...current,
      fullName: current.fullName || getHolderFullName(holder),
      email: current.email || holder.email || "",
      phone: current.phone || holder.phone || "",
      documentType: current.documentType || documentType,
    }));
  }, [caseDetail.data]);

  const canCreateOrder = useMemo(() => {
    if (!flow) {
      return false;
    }

    return flow.canPay || flow.canRetry || flow.caseStatus === "payment_expired";
  }, [flow]);

  async function handleCreateOrder() {
    if (order && flow?.caseStatus === "payment_order_created") {
      setShowCheckout(true);
      return;
    }

    trackPaymentEvent("payment_order_create_clicked", {
      caseId,
      ...makePaymentPayload(flow),
    });

    const origin = window.location.origin;
    const nextOrder = await createOrder.create({
      productCode: "FULL_ANALYSIS_UNLOCK",
      returnUrl: `${origin}/app/cases/${caseId}/checkout?payment=return`,
      cancelUrl: `${origin}/app/cases/${caseId}/preview`,
    });

    setLocalOrder(nextOrder);
    setShowCheckout(true);
    trackPaymentEvent("payment_order_created", {
      caseId,
      orderId: nextOrder.id,
      amount: nextOrder.totalAmount,
      currency: nextOrder.currency,
    });
    flowResource.refresh();
  }

  function handleChange(field: keyof CheckoutFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleCheckout() {
    if (!order) {
      return;
    }

    const nextErrors = validateCheckout(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const paymentMethod = values.paymentMethod as PaymentMethod;
    trackPaymentEvent("payment_method_selected", {
      caseId,
      orderId: order.id,
      paymentMethod,
    });
    trackPaymentEvent("payment_checkout_started", {
      caseId,
      orderId: order.id,
      paymentMethod,
      amount: order.totalAmount,
      currency: order.currency,
    });

    const payment = await checkout.start({
      orderId: order.id,
      paymentMethod,
      customer: {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        documentType: values.documentType || undefined,
        documentNumber: values.documentNumber.trim() || undefined,
        phone: values.phone.trim() || undefined,
      },
    });

    if (payment.checkoutUrl) {
      trackPaymentEvent("payment_provider_redirected", {
        caseId,
        orderId: order.id,
        paymentId: payment.id,
        paymentMethod,
      });
      window.location.assign(payment.checkoutUrl);
      return;
    }

    setShowCheckout(false);
    flowResource.refresh();
  }

  async function handleRefresh() {
    trackPaymentEvent("payment_status_polled", {
      caseId,
      ...makePaymentPayload(flow),
    });
    await flowResource.refetch();
  }

  if (flowResource.isLoading || caseDetail.isLoading) {
    return <PaymentSkeleton />;
  }

  if (flowResource.error && !flow) {
    return <PaymentErrorAlert message={flowResource.error} onRetry={flowResource.refetch} />;
  }

  if (!flow) {
    return (
      <PaymentErrorAlert
        message="No pudimos cargar el estado del pago."
        onRetry={flowResource.refetch}
      />
    );
  }

  if (flow.isUnlocked || isTerminalFlow(flow)) {
    return (
      <section className="space-y-5 pb-24 md:pb-0">
        <CasePaymentHeader
          caseId={caseId}
          caseCode={caseDetail.data?.caseNumber}
          status={flow.caseStatus}
        />
        <PaymentStateCard
          flow={flow}
          onRefresh={handleRefresh}
          onRetry={handleCreateOrder}
          isRefreshing={flowResource.isRefreshing}
          isRetrying={createOrder.isLoading}
        />
      </section>
    );
  }

  return (
    <section className="space-y-5 pb-36 md:pb-0">
      <CasePaymentHeader
        caseId={caseId}
        caseCode={caseDetail.data?.caseNumber}
        status={flow.caseStatus}
      />

      {flowResource.error ? (
        <PaymentErrorAlert message={flowResource.error} onRetry={flowResource.refetch} />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <UnlockBenefitsList />
          <ScopeNotice />
          {checkoutVisible && order ? (
            <CheckoutForm
              order={order}
              values={values}
              errors={errors}
              isSubmitting={checkout.isLoading}
              submitError={checkout.error}
              onChange={handleChange}
              onSubmit={handleCheckout}
            />
          ) : null}
          <SecurePaymentNotice />
        </div>

        <OrderSummaryCard
          order={order}
          caseId={caseId}
          canPay={canCreateOrder}
          isUnlocked={flow.isUnlocked}
          onCreateOrder={handleCreateOrder}
          isCreating={createOrder.isLoading}
          createError={createOrder.error}
        />
      </div>
    </section>
  );
}

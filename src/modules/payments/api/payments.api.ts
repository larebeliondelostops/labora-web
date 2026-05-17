import { ApiError, apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  CheckoutRequest,
  CreateOrderRequest,
  CustomerDocumentType,
  PaymentDto,
  PaymentFlowCaseStatus,
  PaymentFlowDto,
  PaymentMethod,
  PaymentOrderDto,
  PaymentOrderStatus,
  PaymentReceiptDto,
  PaymentReceiptItemDto,
  PaymentReceiptSummaryDto,
  PaymentStatus,
} from "@/src/modules/payments/api/payments.types";

type RawRecord = Record<string, unknown>;

const flowStatuses: PaymentFlowCaseStatus[] = [
  "preview_locked",
  "payment_not_started",
  "payment_order_created",
  "payment_pending",
  "payment_approved",
  "payment_rejected",
  "payment_failed",
  "payment_expired",
  "payment_requires_review",
  "full_analysis_unlocked",
];

const orderStatuses: PaymentOrderStatus[] = [
  "created",
  "checkout_started",
  "pending",
  "paid",
  "cancelled",
  "expired",
  "failed",
  "refunded",
  "requires_review",
];

const paymentStatuses: PaymentStatus[] = [
  "created",
  "pending",
  "approved",
  "rejected",
  "failed",
  "cancelled",
  "expired",
  "refunded",
  "chargeback",
  "unknown",
];

const paymentMethods: PaymentMethod[] = ["CARD", "PSE", "TRANSFER", "WALLET"];
const documentTypes: CustomerDocumentType[] = ["CC", "CE", "NIT", "PASSPORT"];

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function normalizeFlowStatus(value: unknown): PaymentFlowCaseStatus {
  const status = asString(value);

  if (status && flowStatuses.includes(status as PaymentFlowCaseStatus)) {
    return status as PaymentFlowCaseStatus;
  }

  if (status === "pending_payment") {
    return "payment_pending";
  }

  if (status === "paid_unlocked" || status === "unlocked") {
    return "full_analysis_unlocked";
  }

  if (status === "payment_created" || status === "order_created") {
    return "payment_order_created";
  }

  return "payment_not_started";
}

function normalizeOrderStatus(value: unknown): PaymentOrderStatus {
  const status = asString(value);
  return status && orderStatuses.includes(status as PaymentOrderStatus)
    ? (status as PaymentOrderStatus)
    : "created";
}

function normalizePaymentStatus(value: unknown): PaymentStatus {
  const status = asString(value);
  return status && paymentStatuses.includes(status as PaymentStatus)
    ? (status as PaymentStatus)
    : "unknown";
}

function normalizeCurrency(value: unknown): "COP" {
  const currency = asString(value);
  return currency === "COP" ? "COP" : "COP";
}

function normalizePaymentMethod(value: unknown): PaymentMethod | undefined {
  const method = asString(value)?.toUpperCase();
  return method && paymentMethods.includes(method as PaymentMethod)
    ? (method as PaymentMethod)
    : undefined;
}

function normalizeDocumentType(value: unknown): CustomerDocumentType | undefined {
  const documentType = asString(value)?.toUpperCase();
  return documentType && documentTypes.includes(documentType as CustomerDocumentType)
    ? (documentType as CustomerDocumentType)
    : undefined;
}

function normalizeOrder(raw: unknown): PaymentOrderDto | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = asString(raw.id) || asString(raw.orderId) || asString(raw.order_id);

  if (!id) {
    return null;
  }

  return {
    id,
    caseId: asString(raw.caseId) || asString(raw.case_id),
    status: normalizeOrderStatus(raw.status),
    currency: normalizeCurrency(raw.currency),
    subtotalAmount:
      asNumber(raw.subtotalAmount ?? raw.subtotal_amount ?? raw.subtotal) ?? 0,
    taxAmount: asNumber(raw.taxAmount ?? raw.tax_amount ?? raw.tax) ?? 0,
    discountAmount:
      asNumber(raw.discountAmount ?? raw.discount_amount ?? raw.discount) ?? 0,
    totalAmount: asNumber(raw.totalAmount ?? raw.total_amount ?? raw.amount) ?? 0,
    productCode:
      asString(raw.productCode) ||
      asString(raw.product_code) ||
      "FULL_ANALYSIS_UNLOCK",
    productName:
      asString(raw.productName) ||
      asString(raw.product_name) ||
      "Analisis completo",
    expiresAt: asString(raw.expiresAt) || asString(raw.expires_at),
  };
}

function normalizePayment(raw: unknown): PaymentDto | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = asString(raw.id) || asString(raw.paymentId) || asString(raw.payment_id);

  if (!id) {
    return null;
  }

  return {
    id,
    orderId: asString(raw.orderId) || asString(raw.order_id),
    caseId: asString(raw.caseId) || asString(raw.case_id),
    status: normalizePaymentStatus(raw.status),
    provider: asString(raw.provider),
    providerStatus: asString(raw.providerStatus) || asString(raw.provider_status),
    paymentMethod:
      asString(raw.paymentMethod) ||
      asString(raw.payment_method) ||
      normalizePaymentMethod(raw.method),
    checkoutUrl: asString(raw.checkoutUrl) || asString(raw.checkout_url),
    amount: asNumber(raw.amount ?? raw.totalAmount ?? raw.total_amount),
    currency: normalizeCurrency(raw.currency),
    approvedAt: asString(raw.approvedAt) || asString(raw.approved_at),
    rejectedAt: asString(raw.rejectedAt) || asString(raw.rejected_at),
    failedAt: asString(raw.failedAt) || asString(raw.failed_at),
    expiresAt: asString(raw.expiresAt) || asString(raw.expires_at),
  };
}

function normalizeReceiptSummary(raw: unknown): PaymentReceiptSummaryDto | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = asString(raw.id) || asString(raw.receiptId) || asString(raw.receipt_id);
  const receiptNumber =
    asString(raw.receiptNumber) || asString(raw.receipt_number) || id;

  if (!id || !receiptNumber) {
    return null;
  }

  return {
    id,
    receiptNumber,
    available:
      asBoolean(raw.available) ??
      asBoolean(raw.isAvailable) ??
      asBoolean(raw.is_available) ??
      false,
    pdfUrl: asString(raw.pdfUrl) || asString(raw.pdf_url) || null,
  };
}

function normalizeReceiptItem(raw: unknown): PaymentReceiptItemDto[] {
  if (!isRecord(raw)) {
    return [];
  }

  const name = asString(raw.name) || asString(raw.description);

  if (!name) {
    return [];
  }

  return [
    {
      name,
      quantity: asNumber(raw.quantity) ?? 1,
      unitAmount: asNumber(raw.unitAmount ?? raw.unit_amount) ?? 0,
      totalAmount: asNumber(raw.totalAmount ?? raw.total_amount) ?? 0,
    },
  ];
}

function normalizeReceiptItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(normalizeReceiptItem);
}

function normalizeReceipt(raw: unknown): PaymentReceiptDto | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = asString(raw.id) || asString(raw.receiptId) || asString(raw.receipt_id);
  const receiptNumber = asString(raw.receiptNumber) || asString(raw.receipt_number);

  if (!id || !receiptNumber) {
    return null;
  }

  return {
    id,
    receiptNumber,
    orderId: asString(raw.orderId) || asString(raw.order_id) || "",
    paymentId: asString(raw.paymentId) || asString(raw.payment_id) || "",
    caseId: asString(raw.caseId) || asString(raw.case_id) || "",
    status: asString(raw.status) === "void" || asString(raw.status) === "failed"
      ? (asString(raw.status) as "void" | "failed")
      : "issued",
    currency: normalizeCurrency(raw.currency),
    totalAmount: asNumber(raw.totalAmount ?? raw.total_amount ?? raw.amount) ?? 0,
    issuedAt: asString(raw.issuedAt) || asString(raw.issued_at) || "",
    items: normalizeReceiptItems(raw.items),
    pdfUrl: asString(raw.pdfUrl) || asString(raw.pdf_url) || null,
  };
}

function makeFallbackFlow(caseId: string): PaymentFlowDto {
  return {
    caseId,
    caseStatus: "payment_not_started",
    canPay: false,
    canRetry: false,
    canContinue: false,
    isUnlocked: false,
    order: null,
    payment: null,
    receipt: null,
  };
}

export function normalizePaymentFlow(
  raw: unknown,
  fallbackCaseId: string,
): PaymentFlowDto {
  const data = unwrapApiData(raw);
  const flow = isRecord(data) && isRecord(data.paymentFlow)
    ? data.paymentFlow
    : isRecord(data) && isRecord(data.payment_flow)
      ? data.payment_flow
      : data;

  if (!isRecord(flow)) {
    return makeFallbackFlow(fallbackCaseId);
  }

  const caseStatus = normalizeFlowStatus(
    flow.caseStatus ?? flow.case_status ?? flow.status,
  );
  const isUnlocked =
    asBoolean(flow.isUnlocked) ??
    asBoolean(flow.is_unlocked) ??
    caseStatus === "full_analysis_unlocked";

  return {
    caseId:
      asString(flow.caseId) ||
      asString(flow.case_id) ||
      fallbackCaseId,
    caseStatus,
    canPay: asBoolean(flow.canPay) ?? asBoolean(flow.can_pay) ?? false,
    canRetry: asBoolean(flow.canRetry) ?? asBoolean(flow.can_retry) ?? false,
    canContinue:
      asBoolean(flow.canContinue) ??
      asBoolean(flow.can_continue) ??
      isUnlocked,
    isUnlocked,
    order: normalizeOrder(flow.order),
    payment: normalizePayment(flow.payment),
    receipt: normalizeReceiptSummary(flow.receipt),
    uiMessage: asString(flow.uiMessage) || asString(flow.ui_message),
  };
}

export function normalizeOrderResponse(
  raw: unknown,
  fallbackCaseId: string,
): PaymentOrderDto {
  const data = unwrapApiData(raw);
  const order = normalizeOrder(isRecord(data) ? data.order ?? data : data);

  if (!order) {
    throw new ApiError({
      message: "No pudimos crear la orden de pago.",
      status: 500,
      code: "ORDER_NOT_CREATED",
      data,
    });
  }

  return {
    ...order,
    caseId: order.caseId || fallbackCaseId,
  };
}

export function normalizeCheckoutResponse(raw: unknown): PaymentDto {
  const data = unwrapApiData(raw);
  const payment = normalizePayment(isRecord(data) ? data.payment ?? data : data);

  if (!payment) {
    throw new ApiError({
      message: "No pudimos iniciar el checkout.",
      status: 500,
      code: "PROVIDER_CHECKOUT_FAILED",
      data,
    });
  }

  return payment;
}

export function normalizeReceiptResponse(raw: unknown): PaymentReceiptDto {
  const data = unwrapApiData(raw);
  const receipt = normalizeReceipt(isRecord(data) ? data.receipt ?? data : data);

  if (!receipt) {
    throw new ApiError({
      message: "El comprobante aun no esta disponible.",
      status: 404,
      code: "RECEIPT_NOT_FOUND",
      data,
    });
  }

  return receipt;
}

export function getPaymentErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      UNAUTHORIZED: "Debes iniciar sesion para continuar.",
      FORBIDDEN: "No tienes permiso para ver este pago.",
      CASE_NOT_FOUND: "No encontramos el expediente solicitado.",
      CASE_NOT_ELIGIBLE_FOR_PAYMENT:
        "Este expediente aun no esta listo para pago.",
      CASE_ALREADY_UNLOCKED: "Este analisis ya esta desbloqueado.",
      ORDER_NOT_FOUND: "No encontramos la orden de pago.",
      ORDER_ALREADY_PAID: "Esta orden ya fue pagada.",
      ORDER_EXPIRED: "La orden vencio. Puedes crear una nueva.",
      PAYMENT_NOT_FOUND: "No encontramos la transaccion.",
      PROVIDER_CHECKOUT_FAILED:
        "No pudimos abrir el checkout. Intenta nuevamente.",
      REQUIRES_MANUAL_REVIEW:
        "Estamos revisando la confirmacion del pago.",
      RECEIPT_NOT_FOUND: "El comprobante aun no esta disponible.",
    };

    if (error.status === 401) {
      return messages.UNAUTHORIZED;
    }

    if (error.status === 403) {
      return messages.FORBIDDEN;
    }

    return (error.code && messages[error.code]) || error.message;
  }

  return "No pudimos completar la accion. Intenta nuevamente.";
}

export async function getPaymentFlow(caseId: string): Promise<PaymentFlowDto> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/payment-flow`,
  );

  return normalizePaymentFlow(response, caseId);
}

export async function createPaymentOrder(
  caseId: string,
  payload: CreateOrderRequest,
): Promise<PaymentOrderDto> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/cases/${caseId}/orders`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return normalizeOrderResponse(response, caseId);
}

export async function startPaymentCheckout(
  payload: CheckoutRequest,
): Promise<PaymentDto> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    "/payments/checkout",
    {
      method: "POST",
      body: JSON.stringify({
        orderId: payload.orderId,
        paymentMethod: normalizePaymentMethod(payload.paymentMethod),
        customer: payload.customer
          ? {
              fullName: payload.customer.fullName,
              email: payload.customer.email,
              documentType: normalizeDocumentType(payload.customer.documentType),
              documentNumber: payload.customer.documentNumber,
              phone: payload.customer.phone,
            }
          : undefined,
      }),
    },
  );

  return normalizeCheckoutResponse(response);
}

export async function getPayment(paymentId: string): Promise<PaymentDto> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/payments/${paymentId}`,
  );
  const data = unwrapApiData(response);
  const payment = normalizePayment(isRecord(data) ? data.payment ?? data : data);

  if (!payment) {
    throw new ApiError({
      message: "No encontramos la transaccion.",
      status: 404,
      code: "PAYMENT_NOT_FOUND",
      data,
    });
  }

  return payment;
}

export async function getOrderReceipt(orderId: string): Promise<PaymentReceiptDto> {
  const response = await apiFetch<unknown | ApiEnvelope<unknown>>(
    `/orders/${orderId}/receipt`,
  );

  return normalizeReceiptResponse(response);
}

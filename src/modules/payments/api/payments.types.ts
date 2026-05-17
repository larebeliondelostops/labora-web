export type PaymentFlowCaseStatus =
  | "preview_locked"
  | "payment_not_started"
  | "payment_order_created"
  | "payment_pending"
  | "payment_approved"
  | "payment_rejected"
  | "payment_failed"
  | "payment_expired"
  | "payment_requires_review"
  | "full_analysis_unlocked";

export type PaymentOrderStatus =
  | "created"
  | "checkout_started"
  | "pending"
  | "paid"
  | "cancelled"
  | "expired"
  | "failed"
  | "refunded"
  | "requires_review";

export type PaymentStatus =
  | "created"
  | "pending"
  | "approved"
  | "rejected"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded"
  | "chargeback"
  | "unknown";

export type PaymentMethod = "CARD" | "PSE" | "TRANSFER" | "WALLET";
export type CustomerDocumentType = "CC" | "CE" | "NIT" | "PASSPORT";

export interface PaymentOrderDto {
  id: string;
  caseId?: string;
  status: PaymentOrderStatus;
  currency: "COP";
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  productCode: string;
  productName: string;
  expiresAt?: string;
}

export interface PaymentDto {
  id: string;
  orderId?: string;
  caseId?: string;
  status: PaymentStatus;
  provider?: string;
  providerStatus?: string;
  paymentMethod?: string;
  checkoutUrl?: string;
  amount?: number;
  currency?: "COP";
  approvedAt?: string;
  rejectedAt?: string;
  failedAt?: string;
  expiresAt?: string;
}

export interface PaymentReceiptSummaryDto {
  id: string;
  receiptNumber: string;
  available: boolean;
  pdfUrl?: string | null;
}

export interface PaymentFlowDto {
  caseId: string;
  caseStatus: PaymentFlowCaseStatus;
  canPay: boolean;
  canRetry: boolean;
  canContinue: boolean;
  isUnlocked: boolean;
  order: PaymentOrderDto | null;
  payment: PaymentDto | null;
  receipt: PaymentReceiptSummaryDto | null;
  uiMessage?: string;
}

export interface CreateOrderRequest {
  productCode: "FULL_ANALYSIS_UNLOCK";
  returnUrl: string;
  cancelUrl?: string;
}

export interface CheckoutCustomer {
  fullName: string;
  email: string;
  documentType?: CustomerDocumentType;
  documentNumber?: string;
  phone?: string;
}

export interface CheckoutRequest {
  orderId: string;
  paymentMethod?: PaymentMethod;
  customer?: CheckoutCustomer;
}

export interface PaymentReceiptItemDto {
  name: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
}

export interface PaymentReceiptDto {
  id: string;
  receiptNumber: string;
  orderId: string;
  paymentId: string;
  caseId: string;
  status: "issued" | "void" | "failed";
  currency: "COP";
  totalAmount: number;
  issuedAt: string;
  items: PaymentReceiptItemDto[];
  pdfUrl?: string | null;
}

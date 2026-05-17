"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  HelpCircle,
  Loader2,
  LockKeyhole,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  WalletCards,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/src/modules/cases/utils/caseFormatters";
import type {
  CustomerDocumentType,
  PaymentFlowCaseStatus,
  PaymentFlowDto,
  PaymentMethod,
  PaymentOrderDto,
  PaymentReceiptDto,
} from "@/src/modules/payments/api/payments.types";

type Tone = "success" | "warning" | "danger" | "neutral" | "progress";

export type CheckoutFormValues = {
  paymentMethod: PaymentMethod | "";
  fullName: string;
  email: string;
  documentType: CustomerDocumentType | "";
  documentNumber: string;
  phone: string;
  scopeAccepted: boolean;
};

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>;

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-labora-ui bg-white text-labora-gray",
  progress: "border-labora-mint bg-labora-mint/20 text-labora-deep",
};

const flowStatusCopy: Record<
  PaymentFlowCaseStatus,
  { label: string; tone: Tone; title: string; message: string }
> = {
  preview_locked: {
    label: "Listo para pago",
    tone: "progress",
    title: "Desbloquea el analisis completo de tu expediente",
    message:
      "Ya revisamos tu informacion preliminar. Con este pago podras acceder al informe completo, la matriz de inconsistencias, los calculos detallados y las acciones juridicas disponibles segun tu caso.",
  },
  payment_not_started: {
    label: "No iniciado",
    tone: "neutral",
    title: "Aun no has iniciado el pago",
    message:
      "Puedes crear una orden segura para desbloquear el analisis completo.",
  },
  payment_order_created: {
    label: "Orden creada",
    tone: "progress",
    title: "Tu orden esta lista",
    message: "Elige un metodo de pago para continuar con el proveedor seguro.",
  },
  payment_pending: {
    label: "Pago pendiente",
    tone: "warning",
    title: "Estamos confirmando tu pago",
    message:
      "Algunos metodos pueden tardar unos minutos. Cuando el proveedor lo apruebe, desbloquearemos automaticamente tu analisis completo.",
  },
  payment_approved: {
    label: "Pago aprobado",
    tone: "success",
    title: "Estamos habilitando tu analisis completo",
    message:
      "El pago fue aprobado. Estamos esperando la confirmacion de desbloqueo del expediente.",
  },
  payment_rejected: {
    label: "Pago rechazado",
    tone: "danger",
    title: "No pudimos aprobar tu pago",
    message:
      "El proveedor rechazo la transaccion o no pudo completarla. Puedes intentarlo nuevamente con otro metodo.",
  },
  payment_failed: {
    label: "Error de pago",
    tone: "danger",
    title: "Tuvimos un problema al procesar el pago",
    message:
      "No se realizo ningun desbloqueo. Puedes reintentar o consultar soporte.",
  },
  payment_expired: {
    label: "Orden vencida",
    tone: "warning",
    title: "La orden vencio",
    message: "Puedes generar una nueva orden para continuar con el desbloqueo.",
  },
  payment_requires_review: {
    label: "En revision",
    tone: "warning",
    title: "Estamos revisando la confirmacion del pago",
    message:
      "Si el cobro fue realizado, no tendras que pagar de nuevo. Te mostraremos el estado actualizado cuando el backend confirme.",
  },
  full_analysis_unlocked: {
    label: "Desbloqueado",
    tone: "success",
    title: "Pago aprobado",
    message: "Tu analisis completo ya esta desbloqueado.",
  },
};

const paymentMethods: Array<{
  value: PaymentMethod;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    value: "CARD",
    label: "Tarjeta",
    description: "Credito o debito con proveedor seguro.",
    icon: <CreditCard className="h-5 w-5" aria-hidden="true" />,
  },
  {
    value: "PSE",
    label: "PSE",
    description: "Pago desde cuenta bancaria en Colombia.",
    icon: <Smartphone className="h-5 w-5" aria-hidden="true" />,
  },
  {
    value: "TRANSFER",
    label: "Transferencia",
    description: "Disponible si el proveedor la habilita.",
    icon: <WalletCards className="h-5 w-5" aria-hidden="true" />,
  },
  {
    value: "WALLET",
    label: "Billetera",
    description: "Otros medios digitales configurables.",
    icon: <WalletCards className="h-5 w-5" aria-hidden="true" />,
  },
];

function formatMoney(value?: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex items-start justify-between gap-4 border-b border-labora-ui py-3 last:border-b-0">
      <dt className="text-sm font-medium text-labora-gray">{label}</dt>
      <dd className="text-right text-sm font-semibold text-labora-charcoal">{value}</dd>
    </div>
  );
}

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
        variant === "primary" && "bg-labora-green text-white hover:bg-labora-deep",
        variant === "secondary" &&
          "border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory",
        variant === "ghost" &&
          "border border-transparent bg-transparent text-labora-deep hover:bg-labora-ivory",
      )}
    >
      {children}
    </Link>
  );
}

export function PaymentActionButton({
  children,
  onClick,
  disabled,
  isLoading,
  variant = "primary",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-labora-green text-white hover:bg-labora-deep",
        variant === "secondary" &&
          "border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory",
      )}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentFlowCaseStatus }) {
  const copy = flowStatusCopy[status] || flowStatusCopy.payment_not_started;

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[copy.tone],
      )}
    >
      {copy.tone === "progress" ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : copy.tone === "danger" ? (
        <XCircle className="h-4 w-4" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      )}
      {copy.label}
    </span>
  );
}

export function PaymentSkeleton() {
  return (
    <div className="grid gap-5">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <div className="h-4 w-32 animate-pulse rounded bg-labora-ui" />
          <div className="mt-4 h-7 w-2/3 animate-pulse rounded bg-labora-ui" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-labora-ui" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-labora-ui" />
        </div>
      ))}
    </div>
  );
}

export function PaymentErrorAlert({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-panel">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold">
            No pudimos cargar el estado del pago
          </h2>
          <p className="mt-2 text-sm leading-6">{message}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {onRetry ? (
              <PaymentActionButton onClick={onRetry} variant="secondary">
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Intentar nuevamente
              </PaymentActionButton>
            ) : null}
            <ButtonLink href="/app/cases" variant="secondary">
              Volver a Mis casos
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CasePaymentHeader({
  caseId,
  caseCode,
  status,
}: {
  caseId: string;
  caseCode?: string;
  status: PaymentFlowCaseStatus;
}) {
  const copy = flowStatusCopy[status] || flowStatusCopy.payment_not_started;

  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <nav
        aria-label="Ruta del pago"
        className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-labora-gray"
      >
        <Link href="/app/cases" className="hover:text-labora-deep">
          Mis casos
        </Link>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/app/cases/${caseId}`} className="hover:text-labora-deep">
          {caseCode || caseId}
        </Link>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-labora-green">Desbloquear analisis</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Pago seguro
            </p>
            <h1 className="mt-2 max-w-4xl font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-labora-gray">
              {copy.message}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <PaymentStatusBadge status={status} />
          <ButtonLink href={`/app/cases/${caseId}/preview`} variant="secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a vista previa
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

export function UnlockBenefitsList() {
  const benefits = [
    "Informe completo del expediente.",
    "Calculos detallados si aplican al caso.",
    "Matriz de inconsistencias y brechas documentales.",
    "Acciones juridicas disponibles segun el caso.",
    "Comprobante de compra cuando el backend lo emita.",
  ];

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
          <FileCheck2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Que incluye el desbloqueo
          </h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-labora-gray">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ScopeNotice() {
  return (
    <section className="rounded-2xl border border-labora-ui bg-labora-ivory p-5 text-sm leading-6 text-labora-gray">
      <div className="flex gap-3">
        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
        <p>
          El pago desbloquea el analisis completo preparado por Labora. No
          garantiza una decision administrativa o judicial favorable.
        </p>
      </div>
    </section>
  );
}

export function SecurePaymentNotice() {
  return (
    <section className="rounded-2xl border border-labora-mint bg-labora-mint/15 p-4 text-sm leading-6 text-labora-deep">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          Labora no almacena datos de tarjeta. El pago se procesa mediante un
          proveedor seguro.
        </p>
      </div>
    </section>
  );
}

export function OrderSummaryCard({
  order,
  caseId,
  canPay,
  isUnlocked,
  onCreateOrder,
  isCreating,
  createError,
}: {
  order?: PaymentOrderDto | null;
  caseId: string;
  canPay: boolean;
  isUnlocked: boolean;
  onCreateOrder?: () => void;
  isCreating?: boolean;
  createError?: string | null;
}) {
  return (
    <aside className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel xl:sticky xl:top-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Resumen de compra
          </p>
          <h2 className="mt-2 font-heading text-xl font-semibold text-labora-charcoal">
            {order?.productName || "Analisis completo Labora"}
          </h2>
        </div>
        <ReceiptText className="h-5 w-5 text-labora-green" aria-hidden="true" />
      </div>

      <dl className="mt-5">
        <DetailRow label="Subtotal" value={formatMoney(order?.subtotalAmount, order?.currency)} />
        <DetailRow label="Impuestos" value={formatMoney(order?.taxAmount, order?.currency)} />
        {order?.discountAmount ? (
          <DetailRow label="Descuento" value={`-${formatMoney(order.discountAmount, order.currency)}`} />
        ) : null}
        <DetailRow
          label="Total"
          value={
            <span className="font-heading text-2xl text-labora-deep">
              {formatMoney(order?.totalAmount, order?.currency)}
            </span>
          }
        />
        <DetailRow label="Moneda" value={order?.currency || "COP"} />
        <DetailRow label="Orden" value={order?.id} />
        <DetailRow
          label="Vence"
          value={order?.expiresAt ? formatDateTime(order.expiresAt) : undefined}
        />
      </dl>

      <p className="mt-4 rounded-xl border border-labora-ui bg-labora-ivory p-3 text-sm leading-6 text-labora-gray">
        El pago se confirma de forma segura. Si queda pendiente, te avisaremos
        cuando sea aprobado.
      </p>

      {createError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-700">
          {createError}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {isUnlocked ? (
          <ButtonLink href={`/app/cases/${caseId}/full-analysis`} variant="secondary">
            Ir al analisis completo
          </ButtonLink>
        ) : (
          <PaymentActionButton
            onClick={onCreateOrder}
            isLoading={isCreating}
            disabled={!canPay && !order}
            title={!canPay && !order ? "El backend aun no permite crear una orden." : undefined}
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            {order ? "Continuar al pago" : "Pagar y desbloquear"}
          </PaymentActionButton>
        )}
        <ButtonLink href="/contacto" variant="secondary">
          Necesito ayuda
        </ButtonLink>
      </div>
    </aside>
  );
}

export function PaymentMethodSelector({
  value,
  error,
  onChange,
}: {
  value: PaymentMethod | "";
  error?: string;
  onChange: (value: PaymentMethod) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-labora-charcoal">
        Metodo de pago
      </legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {paymentMethods.map((method) => (
          <label
            key={method.value}
            className={cn(
              "flex cursor-pointer gap-3 rounded-xl border bg-white p-4 text-sm transition focus-within:ring-2 focus-within:ring-labora-green focus-within:ring-offset-2",
              value === method.value
                ? "border-labora-green bg-labora-mint/15"
                : "border-labora-ui hover:bg-labora-ivory",
            )}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.value}
              checked={value === method.value}
              onChange={() => onChange(method.value)}
              className="mt-1 h-4 w-4 border-labora-ui text-labora-green focus:ring-labora-green"
            />
            <span className="flex min-w-0 gap-3">
              <span className="text-labora-green">{method.icon}</span>
              <span>
                <span className="block font-semibold text-labora-charcoal">
                  {method.label}
                </span>
                <span className="mt-1 block leading-5 text-labora-gray">
                  {method.description}
                </span>
              </span>
            </span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm font-medium text-red-700">{error}</p> : null}
    </fieldset>
  );
}

function TextInput({
  id,
  label,
  value,
  error,
  type = "text",
  autoComplete,
  onChange,
}: {
  id: keyof CheckoutFormValues;
  label: string;
  value: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  onChange: (field: keyof CheckoutFormValues, value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
      {label}
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(id, event.target.value)}
        className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-normal text-labora-charcoal outline-none transition focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
      />
      {error ? (
        <span id={`${id}-error`} className="font-medium text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function CheckoutForm({
  order,
  values,
  errors,
  isSubmitting,
  submitError,
  onChange,
  onSubmit,
}: {
  order: PaymentOrderDto;
  values: CheckoutFormValues;
  errors: CheckoutFormErrors;
  isSubmitting?: boolean;
  submitError?: string | null;
  onChange: (field: keyof CheckoutFormValues, value: string | boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
          <CreditCard className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
            Checkout
          </p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
            Continuar al pago
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            Orden {order.id}. Total {formatMoney(order.totalAmount, order.currency)}.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <PaymentMethodSelector
          value={values.paymentMethod}
          error={errors.paymentMethod}
          onChange={(value) => onChange("paymentMethod", value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            id="fullName"
            label="Nombre completo"
            value={values.fullName}
            error={errors.fullName}
            autoComplete="name"
            onChange={onChange}
          />
          <TextInput
            id="email"
            label="Correo"
            value={values.email}
            error={errors.email}
            type="email"
            autoComplete="email"
            onChange={onChange}
          />
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Tipo de documento
            <select
              value={values.documentType}
              onChange={(event) => onChange("documentType", event.target.value)}
              className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm font-normal text-labora-charcoal outline-none transition focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
            >
              <option value="">Selecciona</option>
              <option value="CC">CC</option>
              <option value="CE">CE</option>
              <option value="NIT">NIT</option>
              <option value="PASSPORT">Pasaporte</option>
            </select>
            {errors.documentType ? (
              <span className="font-medium text-red-700">{errors.documentType}</span>
            ) : null}
          </label>
          <TextInput
            id="documentNumber"
            label="Numero de documento"
            value={values.documentNumber}
            error={errors.documentNumber}
            autoComplete="off"
            onChange={onChange}
          />
          <TextInput
            id="phone"
            label="Celular"
            value={values.phone}
            error={errors.phone}
            type="tel"
            autoComplete="tel"
            onChange={onChange}
          />
        </div>

        <label className="flex gap-3 rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray">
          <input
            type="checkbox"
            checked={values.scopeAccepted}
            onChange={(event) => onChange("scopeAccepted", event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green focus:ring-labora-green"
          />
          <span>
            Confirmo que entiendo el alcance del servicio y que el desbloqueo
            depende de la confirmacion del pago por parte del backend.
            {errors.scopeAccepted ? (
              <span className="mt-1 block font-medium text-red-700">
                {errors.scopeAccepted}
              </span>
            ) : null}
          </span>
        </label>

        {submitError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-700">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <PaymentActionButton onClick={onSubmit} isLoading={isSubmitting}>
            Continuar al pago
          </PaymentActionButton>
          <ButtonLink href="/contacto" variant="secondary">
            Necesito ayuda
          </ButtonLink>
        </div>

        <SecurePaymentNotice />
      </div>
    </section>
  );
}

export function PaymentStateCard({
  flow,
  onRefresh,
  onRetry,
  isRefreshing,
  isRetrying,
}: {
  flow: PaymentFlowDto;
  onRefresh?: () => void;
  onRetry?: () => void;
  isRefreshing?: boolean;
  isRetrying?: boolean;
}) {
  const copy = flowStatusCopy[flow.caseStatus] || flowStatusCopy.payment_not_started;
  const isFinal =
    flow.caseStatus === "payment_rejected" ||
    flow.caseStatus === "payment_failed" ||
    flow.caseStatus === "payment_expired" ||
    flow.caseStatus === "full_analysis_unlocked";
  const icon =
    copy.tone === "success" ? (
      <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
    ) : copy.tone === "danger" ? (
      <XCircle className="h-7 w-7" aria-hidden="true" />
    ) : copy.tone === "warning" ? (
      <Clock3 className="h-7 w-7" aria-hidden="true" />
    ) : (
      <LockKeyhole className="h-7 w-7" aria-hidden="true" />
    );

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-6 text-center shadow-panel">
      <div
        className={cn(
          "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border",
          toneClasses[copy.tone],
        )}
      >
        {icon}
      </div>
      <PaymentStatusBadge status={flow.caseStatus} />
      <h2 className="mt-4 font-heading text-2xl font-semibold text-labora-charcoal">
        {flow.uiMessage || copy.title}
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-labora-gray">
        {copy.message}
      </p>

      <dl className="mx-auto mt-5 max-w-xl rounded-2xl border border-labora-ui bg-labora-ivory px-4">
        <DetailRow label="Orden" value={flow.order?.id} />
        <DetailRow
          label="Metodo"
          value={flow.payment?.paymentMethod || flow.payment?.provider}
        />
        <DetailRow
          label="Valor"
          value={flow.order ? formatMoney(flow.order.totalAmount, flow.order.currency) : undefined}
        />
        <DetailRow label="Estado" value={flow.payment?.status || flow.order?.status} />
      </dl>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {flow.isUnlocked ? (
          <ButtonLink href={`/app/cases/${flow.caseId}/full-analysis`}>
            Ver analisis completo
          </ButtonLink>
        ) : null}
        {flow.receipt?.available && flow.order ? (
          <ButtonLink href={`/app/cases/${flow.caseId}/checkout/receipt?orderId=${flow.order.id}`} variant="secondary">
            Ver comprobante
          </ButtonLink>
        ) : null}
        {!isFinal && onRefresh ? (
          <PaymentActionButton
            onClick={onRefresh}
            isLoading={isRefreshing}
            variant="secondary"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Actualizar estado
          </PaymentActionButton>
        ) : null}
        {(flow.canRetry || flow.caseStatus === "payment_expired") && onRetry ? (
          <PaymentActionButton
            onClick={onRetry}
            isLoading={isRetrying}
            variant={flow.isUnlocked ? "secondary" : "primary"}
          >
            Intentar nuevamente
          </PaymentActionButton>
        ) : null}
        <ButtonLink href={`/app/cases/${flow.caseId}`} variant="secondary">
          Volver al expediente
        </ButtonLink>
      </div>
    </section>
  );
}

export function ReceiptCard({
  receipt,
  caseId,
  flowStatus,
  isUnlocked,
}: {
  receipt: PaymentReceiptDto;
  caseId: string;
  flowStatus?: PaymentFlowCaseStatus;
  isUnlocked?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
            <ReceiptText className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Comprobante
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
              {receipt.receiptNumber}
            </h1>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Soporte de compra emitido por el backend.
            </p>
          </div>
        </div>
        {flowStatus ? <PaymentStatusBadge status={flowStatus} /> : null}
      </div>

      <dl className="mt-6 rounded-2xl border border-labora-ui bg-labora-ivory px-4">
        <DetailRow label="Fecha" value={receipt.issuedAt ? formatDateTime(receipt.issuedAt) : "No disponible"} />
        <DetailRow label="Servicio" value={receipt.items[0]?.name || "Analisis completo"} />
        <DetailRow label="Valor" value={formatMoney(receipt.totalAmount, receipt.currency)} />
        <DetailRow label="Estado" value={receipt.status} />
        <DetailRow label="Caso" value={receipt.caseId || caseId} />
        <DetailRow label="Orden" value={receipt.orderId} />
      </dl>

      {receipt.items.length ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-labora-ui">
          <div className="border-b border-labora-ui bg-labora-ivory px-4 py-3 text-sm font-semibold text-labora-charcoal">
            Items
          </div>
          <div className="grid gap-0">
            {receipt.items.map((item) => (
              <div
                key={`${item.name}-${item.totalAmount}`}
                className="flex items-center justify-between gap-4 border-b border-labora-ui px-4 py-3 text-sm last:border-b-0"
              >
                <span className="text-labora-gray">
                  {item.quantity} x {item.name}
                </span>
                <span className="font-semibold text-labora-charcoal">
                  {formatMoney(item.totalAmount, receipt.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {receipt.pdfUrl ? (
          <ButtonLink href={receipt.pdfUrl}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Descargar comprobante
          </ButtonLink>
        ) : (
          <PaymentActionButton disabled title="El comprobante PDF aun no esta disponible.">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Descargar comprobante
          </PaymentActionButton>
        )}
        {isUnlocked ? (
          <ButtonLink href={`/app/cases/${caseId}/full-analysis`} variant="secondary">
            Volver al analisis completo
          </ButtonLink>
        ) : (
          <ButtonLink href={`/app/cases/${caseId}`} variant="secondary">
            Volver al expediente
          </ButtonLink>
        )}
      </div>
    </section>
  );
}

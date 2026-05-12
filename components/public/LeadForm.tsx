"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { CtaLink } from "@/components/public/Buttons";
import { ErrorState, SuccessState } from "@/components/public/StateBlocks";
import { createLead, trackPublicEvent } from "@/lib/public-api";
import { leadInterestOptions } from "@/lib/public-content";

interface LeadFormState {
  fullName: string;
  email: string;
  phone: string;
  serviceInterest: string;
  message: string;
  acceptedPrivacyNotice: boolean;
}

const initialState: LeadFormState = {
  fullName: "",
  email: "",
  phone: "",
  serviceInterest: "",
  message: "",
  acceptedPrivacyNotice: false,
};

function getEmailIsValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LeadForm() {
  const [form, setForm] = useState<LeadFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const errors = useMemo(() => {
    const nextErrors: Partial<Record<keyof LeadFormState, string>> = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Ingresa tu nombre.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Ingresa tu correo.";
    } else if (!getEmailIsValid(form.email)) {
      nextErrors.email = "Ingresa un correo valido.";
    }

    if (form.message.length > 2000) {
      nextErrors.message = "El mensaje debe tener maximo 2000 caracteres.";
    }

    if (!form.acceptedPrivacyNotice) {
      nextErrors.acceptedPrivacyNotice = "Debes aceptar el aviso de privacidad.";
    }

    return nextErrors;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      message: true,
      acceptedPrivacyNotice: true,
    });

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createLead({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        serviceInterest: form.serviceInterest || undefined,
        message: form.message.trim() || undefined,
        source: "contact_form",
        acceptedPrivacyNotice: form.acceptedPrivacyNotice,
        utm: {},
      });
      await trackPublicEvent("landing_publica.submitted", { source: "contact_form" });
      setSuccess(true);
      setForm(initialState);
    } catch {
      setSubmitError(
        "No pudimos enviar tus datos en este momento. Revisa la informacion o intenta de nuevo.",
      );
      trackPublicEvent("landing_publica.failed", {
        page: "contacto",
        reason: "lead_submit",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-labora-ui bg-white p-6">
        <SuccessState message="Recibimos tus datos. Para revisar tu caso, crea tu cuenta e inicia un expediente." />
        <div className="mt-5">
          <CtaLink href="/registro" eventLabel="lead_success_crear_cuenta">
            Crear cuenta
          </CtaLink>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-labora-ui bg-white p-6">
      <div className="grid gap-5">
        {submitError ? <ErrorState message={submitError} /> : null}

        <Field
          label="Nombre completo"
          name="fullName"
          value={form.fullName}
          error={touched.fullName ? errors.fullName : undefined}
          onBlur={() => setTouched((value) => ({ ...value, fullName: true }))}
          onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
          required
        />

        <Field
          label="Correo electronico"
          name="email"
          type="email"
          value={form.email}
          error={touched.email ? errors.email : undefined}
          onBlur={() => setTouched((value) => ({ ...value, email: true }))}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          required
        />

        <Field
          label="Telefono"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
        />

        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Interes principal
          <select
            value={form.serviceInterest}
            onChange={(event) =>
              setForm((current) => ({ ...current, serviceInterest: event.target.value }))
            }
            className="h-11 rounded-lg border border-labora-ui bg-white px-3 text-sm font-normal text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-mint"
          >
            {leadInterestOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
          Mensaje
          <textarea
            value={form.message}
            maxLength={2000}
            rows={5}
            onBlur={() => setTouched((value) => ({ ...value, message: true }))}
            onChange={(event) =>
              setForm((current) => ({ ...current, message: event.target.value }))
            }
            className="rounded-lg border border-labora-ui bg-white px-3 py-3 text-sm font-normal text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-mint"
            placeholder="Cuentanos de forma general que necesitas. No incluyas documentos ni datos sensibles."
          />
          <span className="text-xs font-normal text-labora-gray">
            {form.message.length}/2000 caracteres
          </span>
          {touched.message && errors.message ? (
            <InlineFieldError message={errors.message} />
          ) : null}
        </label>

        <label className="flex gap-3 rounded-lg border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray">
          <input
            type="checkbox"
            checked={form.acceptedPrivacyNotice}
            onChange={(event) => {
              setTouched((value) => ({ ...value, acceptedPrivacyNotice: true }));
              setForm((current) => ({
                ...current,
                acceptedPrivacyNotice: event.target.checked,
              }));
            }}
            className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green focus:ring-labora-green"
          />
          <span>
            Acepto ser contactado y entiendo que no debo enviar documentos ni informacion
            sensible por este formulario. Puedo revisar la pagina de{" "}
            <Link href="/privacidad" className="font-semibold text-labora-deep underline">
              privacidad
            </Link>
            .
            {touched.acceptedPrivacyNotice && errors.acceptedPrivacyNotice ? (
              <span className="mt-2 block">
                <InlineFieldError message={errors.acceptedPrivacyNotice} />
              </span>
            ) : null}
          </span>
        </label>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Enviando..." : "Enviar datos"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
      {label}
      <input
        name={name}
        type={type}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-labora-ui bg-white px-3 text-sm font-normal text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-mint"
      />
      {error ? <InlineFieldError id={`${name}-error`} message={error} /> : null}
    </label>
  );
}

function InlineFieldError({ message, id }: { message: string; id?: string }) {
  return (
    <span id={id} className="text-xs font-normal text-red-700">
      {message}
    </span>
  );
}

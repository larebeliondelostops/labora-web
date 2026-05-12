"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { FormErrorSummary, InlineAlert } from "@/components/auth/FormFeedback";
import { TextInput } from "@/components/auth/FormField";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { getApiErrorMessage } from "@/lib/auth-errors";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { forgotPassword } from "@/services/auth.service";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailError = !isValidEmail(email) ? "Ingresa un correo valido." : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    setSubmitError(null);

    if (emailError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPassword({ email: normalizeEmail(email) });
      setSuccess(true);
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "No pudimos procesar la solicitud. Intentalo luego."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="grid gap-5">
        <InlineAlert tone="success">
          Si el correo existe, enviaremos instrucciones para restablecer la contrasena.
        </InlineAlert>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
        >
          Volver a login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <FormErrorSummary message={submitError} />
      <TextInput
        label="Correo electronico"
        name="email"
        type="email"
        value={email}
        disabled={isSubmitting}
        error={touched ? emailError : undefined}
        onBlur={() => setTouched(true)}
        onChange={(event) => setEmail(event.target.value.toLowerCase())}
      />
      <LoadingButton type="submit" isLoading={isSubmitting}>
        Enviar instrucciones
      </LoadingButton>
      <Link href="/login" className="text-center text-sm font-semibold text-labora-deep underline">
        Recorde mi contrasena
      </Link>
    </form>
  );
}

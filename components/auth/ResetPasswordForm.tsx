"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { FormErrorSummary, InlineAlert } from "@/components/auth/FormFeedback";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { getApiErrorMessage } from "@/lib/auth-errors";
import { isStrongPassword } from "@/lib/auth-validation";
import { resetPassword } from "@/services/auth.service";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordError = !isStrongPassword(password)
    ? "La contrasena debe cumplir las reglas minimas."
    : undefined;
  const confirmError =
    password !== confirmPassword ? "Las contrasenas no coinciden." : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    setSubmitError(null);

    if (!token) {
      setSubmitError("El enlace no es valido. Solicita uno nuevo.");
      return;
    }

    if (passwordError || confirmError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "No pudimos restablecer la contrasena."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="grid gap-5">
        <InlineAlert tone="success">
          Tu contrasena fue actualizada. Ya puedes iniciar sesion.
        </InlineAlert>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
        >
          Ir a login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {!token ? (
        <InlineAlert tone="warning">
          Falta el token de restablecimiento. Solicita un nuevo enlace.
        </InlineAlert>
      ) : null}
      <FormErrorSummary message={submitError} />
      <PasswordInput
        label="Nueva contrasena"
        name="password"
        value={password}
        disabled={isSubmitting}
        error={touched.password ? passwordError : undefined}
        onBlur={() => setTouched((value) => ({ ...value, password: true }))}
        onChange={(event) => setPassword(event.target.value)}
      />
      <PasswordInput
        label="Confirmar contrasena"
        name="confirmPassword"
        value={confirmPassword}
        disabled={isSubmitting}
        error={touched.confirmPassword ? confirmError : undefined}
        onBlur={() => setTouched((value) => ({ ...value, confirmPassword: true }))}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />
      <PasswordStrengthMeter password={password} confirmPassword={confirmPassword} />
      <LoadingButton type="submit" disabled={!token} isLoading={isSubmitting}>
        Restablecer contrasena
      </LoadingButton>
      <Link
        href="/recuperar-contrasena"
        className="text-center text-sm font-semibold text-labora-deep underline"
      >
        Solicitar nuevo enlace
      </Link>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { FormErrorSummary, InlineAlert } from "@/components/auth/FormFeedback";
import { TextInput } from "@/components/auth/FormField";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { getApiErrorMessage, getErrorCode } from "@/lib/auth-errors";
import { getNextAuthPath, isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { login } from "@/services/auth.service";
import { getMe } from "@/services/user.service";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailError = !isValidEmail(email) ? "Ingresa un correo valido." : undefined;
  const passwordError = !password ? "Ingresa tu contrasena." : undefined;

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        if (!user.isVerified) {
          router.replace(`/verificar-otp?recipient=${encodeURIComponent(user.email)}&purpose=register`);
          return;
        }

        router.replace("/consentimientos");
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setSubmitError(null);
    setBlocked(false);

    if (emailError || passwordError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = normalizeEmail(email);
      const response = await login({
        email: normalizedEmail,
        password,
        rememberDevice,
      });

      if (response.nextStep === "verify_otp") {
        router.push(
          `/verificar-otp?recipient=${encodeURIComponent(normalizedEmail)}&purpose=${
            response.purpose || "login"
          }`,
        );
        return;
      }

      router.push(getNextAuthPath(response.nextStep));
    } catch (error) {
      const code = getErrorCode(error);

      if (code === "ACCOUNT_NOT_VERIFIED") {
        router.push(
          `/verificar-otp?recipient=${encodeURIComponent(normalizeEmail(email))}&purpose=register`,
        );
        return;
      }

      if (code === "ACCOUNT_BLOCKED") {
        setBlocked(true);
      }

      setSubmitError(
        getApiErrorMessage(error, "No pudimos iniciar sesion. Intentalo nuevamente."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {blocked ? (
        <InlineAlert tone="warning">
          Tu cuenta esta bloqueada. Contacta soporte para revisar el acceso.
        </InlineAlert>
      ) : null}
      <FormErrorSummary message={submitError} />

      <TextInput
        label="Correo electronico"
        name="email"
        type="email"
        value={email}
        disabled={isSubmitting}
        error={touched.email ? emailError : undefined}
        onBlur={() => setTouched((value) => ({ ...value, email: true }))}
        onChange={(event) => setEmail(event.target.value.toLowerCase())}
      />

      <PasswordInput
        label="Contrasena"
        name="password"
        value={password}
        disabled={isSubmitting}
        error={touched.password ? passwordError : undefined}
        onBlur={() => setTouched((value) => ({ ...value, password: true }))}
        onChange={(event) => setPassword(event.target.value)}
      />

      <label className="flex items-center gap-3 text-sm text-labora-gray">
        <input
          type="checkbox"
          checked={rememberDevice}
          disabled={isSubmitting}
          onChange={(event) => setRememberDevice(event.target.checked)}
          className="h-4 w-4 rounded border-labora-ui text-labora-green focus:ring-labora-green"
        />
        Recordar este dispositivo
      </label>

      <LoadingButton type="submit" isLoading={isSubmitting}>
        Ingresar
      </LoadingButton>

      <div className="flex flex-col gap-2 text-center text-sm text-labora-gray sm:flex-row sm:justify-between">
        <Link href="/registro" className="font-semibold text-labora-deep underline">
          Crear cuenta
        </Link>
        <Link
          href="/recuperar-contrasena"
          className="font-semibold text-labora-deep underline"
        >
          Olvide mi contrasena
        </Link>
      </div>
    </form>
  );
}

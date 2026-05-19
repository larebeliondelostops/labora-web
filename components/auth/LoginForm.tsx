"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FormErrorSummary, InlineAlert } from "@/components/auth/FormFeedback";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { TextInput } from "@/components/auth/FormField";
import { ApiError } from "@/lib/api";
import {
  getApiErrorCode,
  getApiErrorDetails,
  getApiErrorMessage,
  getApiFieldErrors,
} from "@/lib/auth-errors";
import {
  getNextAuthPath,
  getSafeNextAuthPath,
  isValidEmail,
  normalizeEmail,
  withEmailQuery,
} from "@/lib/auth-validation";
import { login } from "@/services/auth.service";
import { getMe } from "@/services/user.service";

interface LoginAction {
  href: string;
  label: string;
}

function getBackendRedirectPath(error: unknown, fallback: string): string {
  const redirectTo = getApiErrorDetails(error).find((detail) => detail.redirectTo)?.redirectTo;

  return getSafeNextAuthPath(redirectTo) || fallback;
}

function getLoginClientErrors(email: string, password: string): Record<string, string> {
  return {
    ...(!isValidEmail(email) ? { email: "Ingresa un correo valido." } : {}),
    ...(!password ? { password: "Ingresa tu contrasena." } : {}),
  };
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = normalizeEmail(
    searchParams.get("email") || searchParams.get("recipient") || "",
  );
  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authAction, setAuthAction] = useState<LoginAction | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        router.replace(getNextAuthPath(user.nextStep, user.email));
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiError && error.status !== 401) {
          setSessionError("No pudimos revisar tu sesion. Puedes intentar entrar con Google.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (email || !emailFromQuery) {
      return;
    }

    setEmail(emailFromQuery);
  }, [email, emailFromQuery]);

  const errors = { ...getLoginClientErrors(email, password), ...fieldErrors };

  const showError = (field: "email" | "password") =>
    touched[field] ? errors[field] : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setFieldErrors({});
    setSubmitError(null);
    setAuthAction(null);

    const clientErrors = getLoginClientErrors(email, password);

    if (Object.values(clientErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await login({
        email: normalizeEmail(email),
        password,
      });

      router.push(getNextAuthPath(response.nextStep || "dashboard", response.recipient || email));
    } catch (error) {
      const message = getApiErrorMessage(error, "No pudimos iniciar sesion.");
      const code = getApiErrorCode(error);
      const nextFieldErrors = getApiFieldErrors(error);

      if (code === "USER_NOT_REGISTERED") {
        const redirectPath = getBackendRedirectPath(error, "/registro");

        setAuthAction({
          label: "Crear cuenta",
          href: withEmailQuery(redirectPath, email),
        });

        if (!nextFieldErrors.email) {
          nextFieldErrors.email = message;
        }
      }

      if (code === "INVALID_CREDENTIALS" && !nextFieldErrors.password) {
        nextFieldErrors.password = message;
      }

      setFieldErrors(nextFieldErrors);
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {isCheckingSession ? (
        <InlineAlert tone="info">Revisando si ya tienes una sesion activa.</InlineAlert>
      ) : null}
      {sessionError ? <InlineAlert tone="warning">{sessionError}</InlineAlert> : null}

      <InlineAlert tone="info">
        Ingresa con el correo y contrasena de tu cuenta. El backend valida el
        estado real del usuario antes de continuar.
      </InlineAlert>

      <FormErrorSummary message={submitError} />
      {authAction ? (
        <Link
          href={authAction.href}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep underline hover:bg-labora-ivory"
        >
          {authAction.label}
        </Link>
      ) : null}

      <TextInput
        label="Correo electronico"
        name="email"
        type="email"
        value={email}
        disabled={isSubmitting}
        error={showError("email")}
        onBlur={() => setTouched((value) => ({ ...value, email: true }))}
        onChange={(event) => {
          setFieldErrors((current) => ({ ...current, email: "" }));
          setAuthAction(null);
          setEmail(event.target.value);
        }}
      />

      <PasswordInput
        label="Contrasena"
        name="password"
        value={password}
        disabled={isSubmitting}
        error={showError("password")}
        onBlur={() => setTouched((value) => ({ ...value, password: true }))}
        onChange={(event) => {
          setFieldErrors((current) => ({ ...current, password: "" }));
          setAuthAction(null);
          setPassword(event.target.value);
        }}
      />

      <LoadingButton type="submit" isLoading={isSubmitting}>
        Iniciar sesion
      </LoadingButton>

      <div className="grid gap-3 border-t border-labora-ui pt-5">
        <GoogleLoginButton redirectTo="/app/dashboard" label="Ingresar con Google" />
      </div>

      <p className="text-center text-sm text-labora-gray">
        Aun no tienes cuenta?{" "}
        <Link
          href={withEmailQuery("/registro", email)}
          className="font-semibold text-labora-deep underline"
        >
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}

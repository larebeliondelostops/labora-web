import type { ApiErrorDetail } from "@/lib/api";
import {
  getApiErrorCode,
  getApiErrorDetails,
  getApiErrorMessage,
  getApiFieldErrors,
} from "@/lib/auth-errors";
import { getNextAuthPath, getSafeNextAuthPath, normalizeEmail, withEmailQuery } from "@/lib/auth-validation";
import type { LoginResponse } from "@/types/auth";

export const profileCompletionPath = "/registro?step=datos";

export interface AuthRedirectAction {
  href: string;
  label: string;
}

export interface AuthErrorResult {
  message: string;
  fieldErrors: Record<string, string>;
  action: AuthRedirectAction | null;
}

function getBackendRedirectPath(error: unknown, fallback: string): string {
  const redirectTo = getApiErrorDetails(error).find((detail) => detail.redirectTo)?.redirectTo;

  return getSafeNextAuthPath(redirectTo) || fallback;
}

function getDetailField(details: ApiErrorDetail[], fallback: string): string {
  return details.find((detail) => detail.field)?.field || fallback;
}

function withFallbackFieldError(
  fieldErrors: Record<string, string>,
  field: string,
  message: string,
): Record<string, string> {
  if (fieldErrors[field]) {
    return fieldErrors;
  }

  return { ...fieldErrors, [field]: message };
}

export function buildRegisterOtpPath(email?: string): string {
  const params = new URLSearchParams({
    purpose: "register",
    next: profileCompletionPath,
    auto: "1",
  });

  if (email) {
    params.set("recipient", normalizeEmail(email));
  }

  return `/verificar-otp?${params.toString()}`;
}

export function getRegisterSuccessPath(response: LoginResponse, email: string): string {
  const nextStep = response.nextStep || "verify_otp";
  const recipient = response.recipient || email;

  return nextStep === "verify_otp"
    ? buildRegisterOtpPath(recipient)
    : getNextAuthPath(nextStep, recipient);
}

export function getLoginSuccessPath(response: LoginResponse, email: string): string {
  return getNextAuthPath(response.nextStep || "dashboard", response.recipient || email);
}

export function resolveRegisterError(error: unknown, email: string): AuthErrorResult {
  const message = getApiErrorMessage(error, "No pudimos crear tu cuenta. Intentalo nuevamente.");
  const code = getApiErrorCode(error);
  const details = getApiErrorDetails(error);
  let fieldErrors = getApiFieldErrors(error);
  let action: AuthRedirectAction | null = null;

  if (code === "EMAIL_ALREADY_EXISTS" || code === "DOCUMENT_ALREADY_EXISTS") {
    const fallbackField = code === "EMAIL_ALREADY_EXISTS" ? "email" : "documentNumber";
    const field = getDetailField(details, fallbackField);
    const redirectPath = getBackendRedirectPath(error, "/auth/login");

    fieldErrors = withFallbackFieldError(fieldErrors, field, message);
    action = {
      label: "Iniciar sesion",
      href: withEmailQuery(redirectPath, email),
    };
  }

  return { message, fieldErrors, action };
}

export function resolveLoginError(error: unknown, email: string): AuthErrorResult {
  const message = getApiErrorMessage(error, "No pudimos iniciar sesion.");
  const code = getApiErrorCode(error);
  const details = getApiErrorDetails(error);
  let fieldErrors = getApiFieldErrors(error);
  let action: AuthRedirectAction | null = null;

  if (code === "USER_NOT_REGISTERED") {
    const field = getDetailField(details, "email");
    const redirectPath = getBackendRedirectPath(error, "/registro");

    fieldErrors = withFallbackFieldError(fieldErrors, field, message);
    action = {
      label: "Crear cuenta",
      href: withEmailQuery(redirectPath, email),
    };
  }

  if (code === "INVALID_CREDENTIALS") {
    fieldErrors = withFallbackFieldError(fieldErrors, "password", message);
  }

  return { message, fieldErrors, action };
}

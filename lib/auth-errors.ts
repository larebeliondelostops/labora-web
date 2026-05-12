import { ApiError } from "@/lib/api";

const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: "Revisa los campos marcados.",
  EMAIL_ALREADY_EXISTS:
    "Este correo ya esta registrado. Puedes iniciar sesion o recuperar tu contrasena.",
  DOCUMENT_ALREADY_EXISTS: "Ya existe una cuenta asociada a este documento.",
  INVALID_CREDENTIALS: "Correo o contrasena incorrectos.",
  ACCOUNT_NOT_VERIFIED:
    "Tu cuenta aun no esta verificada. Ingresa el codigo enviado.",
  ACCOUNT_BLOCKED: "Tu cuenta esta bloqueada. Contacta soporte.",
  OTP_EXPIRED: "El codigo vencio. Solicita uno nuevo.",
  OTP_INVALID: "El codigo no coincide. Intentalo nuevamente.",
  OTP_ATTEMPTS_EXCEEDED:
    "Superaste el numero de intentos. Solicita un nuevo codigo.",
  RATE_LIMITED: "Has hecho muchos intentos. Espera unos minutos.",
  TOKEN_EXPIRED: "El enlace vencio. Solicita uno nuevo.",
  TOKEN_INVALID: "El enlace no es valido. Solicita uno nuevo.",
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.code) {
    return errorMessages[error.code] || error.message || fallback;
  }

  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  return fallback;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details) {
    return {};
  }

  return error.details.reduce<Record<string, string>>((fields, detail) => {
    if (detail.field) {
      fields[detail.field] = detail.message;
    }

    return fields;
  }, {});
}

export function getErrorCode(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}

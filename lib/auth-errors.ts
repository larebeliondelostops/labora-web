import { ApiError } from "@/lib/api";
import type { ApiErrorDetail } from "@/lib/api";

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
  unauthorized: "Tu sesion expiro. Inicia sesion nuevamente.",
  legal_document_not_found:
    "Uno de los documentos legales ya no esta disponible. Recarga la pagina.",
  legal_document_not_active:
    "Hay una nueva version del documento. Recarga para verla.",
  consent_type_mismatch:
    "Hubo un problema validando el consentimiento. Recarga e intenta de nuevo.",
  missing_required_consents: "Faltan autorizaciones obligatorias para continuar.",
  duplicate_consent: "Este consentimiento ya fue registrado. Actualizaremos tu estado.",
  invalid_payload: "Revisa las autorizaciones seleccionadas e intenta de nuevo.",
  internal_error: "No pudimos guardar tus autorizaciones. Intenta nuevamente.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() && value !== "[object Object]"
    ? value
    : undefined;
}

function getPath(value: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[key];
  }, value);
}

function normalizeDetails(value: unknown): ApiErrorDetail[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const message = asString(item.message);

    if (!message) {
      return [];
    }

    return [
      {
        field: asString(item.field),
        message,
      },
    ];
  });
}

function firstDetails(...values: unknown[]): ApiErrorDetail[] {
  for (const value of values) {
    const details = normalizeDetails(value);

    if (details.length) {
      return details;
    }
  }

  return [];
}

function getNestedError(error: unknown): Record<string, unknown> | undefined {
  return (
    asRecord(getPath(error, ["response", "data", "error"])) ||
    asRecord(getPath(error, ["data", "error"])) ||
    asRecord(getPath(error, ["error"])) ||
    asRecord(error)
  );
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocurrio un error inesperado.",
): string {
  const details = getApiFieldErrors(error);
  const firstFieldMessage = Object.values(details)[0];

  if (firstFieldMessage) {
    return firstFieldMessage;
  }

  const nestedError = getNestedError(error);
  const code = getApiErrorCode(error);
  const message =
    asString(getPath(error, ["response", "data", "error", "message"])) ||
    asString(getPath(error, ["response", "data", "message"])) ||
    asString(getPath(error, ["data", "error", "message"])) ||
    asString(getPath(error, ["data", "message"])) ||
    asString(nestedError?.message) ||
    (error instanceof ApiError ? asString(error.message) : undefined) ||
    (error instanceof Error ? asString(error.message) : undefined);

  if (message) {
    return message;
  }

  return (code && errorMessages[code]) || fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  return (
    asString(getPath(error, ["response", "data", "error", "code"])) ||
    asString(getPath(error, ["response", "data", "code"])) ||
    asString(getPath(error, ["data", "error", "code"])) ||
    asString(getPath(error, ["data", "code"])) ||
    asString(getPath(error, ["error", "code"])) ||
    (error instanceof ApiError ? error.code : undefined)
  );
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  const details = firstDetails(
    getPath(error, ["response", "data", "error", "details"]),
    getPath(error, ["response", "data", "details"]),
    getPath(error, ["data", "error", "details"]),
    getPath(error, ["data", "details"]),
    getPath(error, ["error", "details"]),
    error instanceof ApiError ? error.details : undefined,
  );

  return details.reduce<Record<string, string>>((fields, detail) => {
    if (detail.field && detail.message) {
      fields[detail.field] = detail.message;
    }

    return fields;
  }, {});
}

export function getErrorCode(error: unknown): string | undefined {
  return getApiErrorCode(error);
}

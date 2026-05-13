import { publicEnv } from "@/lib/env";

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: ApiErrorDetail[];
  traceId?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: ApiErrorDetail[];
  data?: unknown;
  traceId?: string;

  constructor({
    message,
    status,
    code,
    details,
    data,
    traceId,
  }: {
    message: string;
    status: number;
    code?: string;
    details?: ApiErrorDetail[];
    data?: unknown;
    traceId?: string;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.data = data;
    this.traceId = traceId;
  }
}

export interface ApiEnvelope<T> {
  data: T;
}

export function unwrapApiData<T>(response: T | ApiEnvelope<T>): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as ApiEnvelope<T>).data !== undefined
  ) {
    return (response as ApiEnvelope<T>).data;
  }

  return response as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeDetails(value: unknown): ApiErrorDetail[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const details = value.flatMap((item) => {
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

  return details.length ? details : undefined;
}

function normalizeErrorBody(body: unknown): ApiErrorBody {
  if (!isRecord(body)) {
    return {};
  }

  const nestedError = body.error;

  if (isRecord(nestedError)) {
    return {
      code: asString(nestedError.code) || asString(body.code),
      message: asString(nestedError.message) || asString(body.message),
      details:
        normalizeDetails(nestedError.details) ||
        normalizeDetails(body.details) ||
        normalizeDetails(body.errors),
      traceId: asString(nestedError.traceId) || asString(body.traceId),
    };
  }

  return {
    code: asString(body.code) || asString(nestedError),
    message: asString(body.message) || asString(nestedError),
    details: normalizeDetails(body.details) || normalizeDetails(body.errors),
    traceId: asString(body.traceId),
  };
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);

  if (!headers.has("Content-Type") && !(options?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${publicEnv.apiUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...Object.fromEntries(headers.entries()),
    },
    cache: options?.cache ?? "no-store",
  });

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError({
        message: "API request failed",
        status: response.status,
      });
    }

    return undefined as T;
  }

  const body = await response.text();

  if (!response.ok) {
    let parsedBody: unknown = {};

    try {
      parsedBody = body ? JSON.parse(body) : {};
    } catch {
      parsedBody = {};
    }

    const apiError = normalizeErrorBody(parsedBody);
    const detailMessage = apiError.details?.[0]?.message;

    throw new ApiError({
      message: detailMessage || apiError.message || "API request failed",
      status: response.status,
      code: apiError.code,
      details: apiError.details,
      data: parsedBody,
      traceId: apiError.traceId,
    });
  }

  if (!body) {
    return undefined as T;
  }

  return JSON.parse(body) as T;
}

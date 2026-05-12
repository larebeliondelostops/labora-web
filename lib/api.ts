import { publicEnv } from "@/lib/env";

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: ApiErrorDetail[];

  constructor({
    message,
    status,
    code,
    details,
  }: {
    message: string;
    status: number;
    code?: string;
    details?: ApiErrorDetail[];
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
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
    let errorBody: {
      message?: string;
      code?: string;
      error?: string;
      details?: ApiErrorDetail[];
      errors?: ApiErrorDetail[];
    } = {};

    try {
      errorBody = body ? JSON.parse(body) : {};
    } catch {
      errorBody = {};
    }

    throw new ApiError({
      message: errorBody.message || errorBody.error || "API request failed",
      status: response.status,
      code: errorBody.code || errorBody.error,
      details: errorBody.details || errorBody.errors,
    });
  }

  if (!body) {
    return undefined as T;
  }

  return JSON.parse(body) as T;
}

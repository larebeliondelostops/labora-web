import { publicEnv } from "@/lib/env";

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

  if (!response.ok) {
    throw new Error("API request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();

  if (!body) {
    return undefined as T;
  }

  return JSON.parse(body) as T;
}

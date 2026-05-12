import { apiFetch } from "@/lib/api";
import type { AccountSession } from "@/types/session";

export async function getSessions(): Promise<AccountSession[]> {
  const response = await apiFetch<AccountSession[] | { items?: AccountSession[] }>(
    "/users/me/sessions",
  );

  if (Array.isArray(response)) {
    return response;
  }

  return response.items || [];
}

export async function revokeSession(sessionId: string): Promise<void> {
  await apiFetch<void>(`/users/me/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

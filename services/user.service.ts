import { apiFetch } from "@/lib/api";
import type { CurrentUser } from "@/types/user";

export interface UpdateMePayload {
  firstName: string;
  lastName: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
}

export async function getMe(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/users/me");
}

export async function updateMe(payload: UpdateMePayload): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

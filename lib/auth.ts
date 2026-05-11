import { apiFetch } from "@/lib/api";
import type { CurrentUser } from "@/types/user";

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/users/me");
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", {
    method: "POST",
  });
}

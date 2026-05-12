import { apiFetch } from "@/lib/api";
import type { CurrentUser } from "@/types/user";
import { logout as logoutFromService } from "@/services/auth.service";

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/users/me");
}

export async function logout(): Promise<void> {
  await logoutFromService();
}

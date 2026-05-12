import type { CurrentUser } from "@/types/user";
import { logout as logoutFromService } from "@/services/auth.service";
import { getMe } from "@/services/user.service";

export async function getCurrentUser(): Promise<CurrentUser> {
  return getMe();
}

export async function logout(): Promise<void> {
  await logoutFromService();
}

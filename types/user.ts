export type UserRole = "user" | "admin" | "reviewer";

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
  email?: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
}

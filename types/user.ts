export type UserRole = "user" | "admin" | "reviewer" | "legal_reviewer" | "support";

export type UserNextStep =
  | "dashboard"
  | "verify_otp"
  | "complete_profile"
  | "profile"
  | "consents";

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
  roles?: UserRole[];
  status?: "pending_verification" | "active" | "blocked" | "suspended" | "deleted";
  documentType?: string | null;
  documentNumber?: string | null;
  phone?: string | null;
  isActive: boolean;
  isVerified: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  requiresOtp?: boolean;
  registrationCompleted?: boolean;
  nextStep?: UserNextStep;
}

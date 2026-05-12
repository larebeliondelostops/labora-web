import type { CurrentUser } from "@/types/user";

export type AuthStatus =
  | "unknown"
  | "guest"
  | "authenticated"
  | "pending_verification"
  | "blocked";

export type AuthUserStatus =
  | "pending_verification"
  | "active"
  | "blocked"
  | "suspended"
  | "deleted";

export type AuthUserRole = "user" | "admin" | "legal_reviewer" | "support";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: AuthUserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: AuthUserRole[];
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberDevice?: boolean;
}

export interface LoginResponse {
  user?: AuthUser | CurrentUser;
  nextStep?: "verify_otp" | "consents" | "dashboard" | "profile";
  /** OTP en frontend se maneja exclusivamente por correo. */
  recipient?: string;
  purpose?: OtpPurpose;
}

export type OtpPurpose = "register" | "login" | "password_reset";

export interface OtpPayload {
  /** Correo electronico del usuario. */
  recipient: string;
  purpose: OtpPurpose;
  code: string;
}

export interface ResendOtpPayload {
  /** Correo electronico del usuario. */
  recipient: string;
  purpose: OtpPurpose;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

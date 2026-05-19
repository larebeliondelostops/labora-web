import { apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  OtpPayload,
  RegisterPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
} from "@/types/auth";

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse | ApiEnvelope<LoginResponse>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return unwrapApiData(response);
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse | ApiEnvelope<LoginResponse>>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return unwrapApiData(response);
}

export async function verifyOtp(payload: OtpPayload): Promise<LoginResponse | void> {
  const response = await apiFetch<
    LoginResponse | ApiEnvelope<LoginResponse> | void
  >("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response ? unwrapApiData(response) : undefined;
}

export async function resendOtp(payload: ResendOtpPayload): Promise<void> {
  await apiFetch<void>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await apiFetch<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiFetch<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refreshToken(): Promise<void> {
  await apiFetch<void>("/auth/refresh", {
    method: "POST",
  });
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", {
    method: "POST",
  });
}

export async function logoutAll(): Promise<void> {
  await apiFetch<void>("/auth/logout-all", {
    method: "POST",
  });
}

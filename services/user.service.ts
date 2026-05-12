import { apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type { CurrentUser, UserNextStep, UserRole } from "@/types/user";

export interface UpdateMePayload {
  firstName: string;
  lastName: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
}

type RawCurrentUser = Partial<CurrentUser> & {
  id: string;
  email: string;
};

function hasProfileData(user: RawCurrentUser): boolean {
  return Boolean(
    user.firstName?.trim() &&
      user.lastName?.trim() &&
      user.documentType?.trim() &&
      user.documentNumber?.trim(),
  );
}

function inferNextStep(user: RawCurrentUser): UserNextStep {
  if (user.nextStep) {
    return user.nextStep;
  }

  if (user.requiresOtp || user.isVerified === false || user.emailVerified === false) {
    return "verify_otp";
  }

  if (user.registrationCompleted === false || !hasProfileData(user)) {
    return "complete_profile";
  }

  return "dashboard";
}

function normalizeCurrentUser(user: RawCurrentUser): CurrentUser {
  const nextStep = inferNextStep(user);
  const emailVerified = user.emailVerified ?? user.isVerified ?? nextStep !== "verify_otp";
  const isVerified = user.isVerified ?? emailVerified;
  const status =
    user.status ?? (nextStep === "verify_otp" ? "pending_verification" : "active");
  const isActive =
    user.isActive ?? !["blocked", "suspended", "deleted"].includes(status || "");

  return {
    ...user,
    role: (user.role || "user") as UserRole,
    roles: user.roles || [(user.role || "user") as UserRole],
    status,
    isActive,
    isVerified,
    emailVerified,
    phoneVerified: user.phoneVerified ?? false,
    requiresOtp: user.requiresOtp ?? nextStep === "verify_otp",
    registrationCompleted:
      user.registrationCompleted ?? (nextStep !== "complete_profile" && hasProfileData(user)),
    nextStep,
  };
}

export async function getMe(): Promise<CurrentUser> {
  const response = await apiFetch<RawCurrentUser | ApiEnvelope<RawCurrentUser>>("/users/me");

  return normalizeCurrentUser(unwrapApiData(response));
}

export async function updateMe(payload: UpdateMePayload): Promise<CurrentUser> {
  const response = await apiFetch<
    RawCurrentUser | ApiEnvelope<RawCurrentUser> | void
  >("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!response) {
    return getMe();
  }

  return normalizeCurrentUser(unwrapApiData(response));
}

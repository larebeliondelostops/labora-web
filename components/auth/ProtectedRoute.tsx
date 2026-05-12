"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { useAuth } from "@/components/auth/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }

    if (status === "pending_verification") {
      const recipient = user?.email ? `?recipient=${encodeURIComponent(user.email)}&purpose=register` : "";
      router.replace(`/verificar-otp${recipient}`);
    }
  }, [router, status, user?.email]);

  if (status === "unknown" || status === "guest" || status === "pending_verification") {
    return <SkeletonCard />;
  }

  if (status === "blocked") {
    return (
      <InlineAlert tone="warning">
        Tu cuenta esta bloqueada. Contacta soporte para revisar el acceso.
      </InlineAlert>
    );
  }

  return <>{children}</>;
}

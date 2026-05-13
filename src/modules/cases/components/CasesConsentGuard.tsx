"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { useConsentGuard } from "@/hooks/useConsentGuard";

export function CasesConsentGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoading, error, canContinue } = useConsentGuard({
    returnUrl: pathname,
    redirectTo: "/app/consents",
  });

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (error) {
    return <InlineAlert tone="warning">{error}</InlineAlert>;
  }

  if (!canContinue) {
    return <SkeletonCard />;
  }

  return <>{children}</>;
}

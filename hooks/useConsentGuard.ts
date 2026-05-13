"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/auth-errors";
import { getConsentStatus } from "@/services/consent.service";
import type { ConsentStatusResponse } from "@/types/consent";

interface UseConsentGuardOptions {
  enabled?: boolean;
  returnUrl?: string;
  redirectTo?: string;
}

export function useConsentGuard({
  enabled = true,
  returnUrl,
  redirectTo = "/app/onboarding/consentimientos",
}: UseConsentGuardOptions = {}) {
  const router = useRouter();
  const [status, setStatus] = useState<ConsentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!enabled) {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoading(true);
    getConsentStatus()
      .then((nextStatus) => {
        if (!isMounted) {
          return;
        }

        setStatus(nextStatus);

        if (nextStatus.status !== "completed" || !nextStatus.canUploadDocuments) {
          const params = new URLSearchParams();

          if (returnUrl) {
            params.set("returnUrl", returnUrl);
          }

          router.replace(params.toString() ? `${redirectTo}?${params.toString()}` : redirectTo);
        }
      })
      .catch((requestError) => {
        if (!isMounted) {
          return;
        }

        setError(
          getApiErrorMessage(
            requestError,
            "No pudimos verificar tus consentimientos.",
          ),
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [enabled, redirectTo, returnUrl, router]);

  return {
    status,
    isLoading,
    error,
    canContinue: Boolean(status?.canUploadDocuments && status.status === "completed"),
  };
}

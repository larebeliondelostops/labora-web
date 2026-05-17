"use client";

import { useCallback } from "react";

import { trackConversionEvent } from "@/src/modules/paywall-preview/api/preview.api";
import type { ConversionEventName } from "@/src/modules/paywall-preview/api/preview.types";

function getSource(): "web" | "mobile_web" {
  if (typeof window === "undefined") {
    return "web";
  }

  return window.matchMedia("(max-width: 767px)").matches ? "mobile_web" : "web";
}

export function useConversionEvents(caseId?: string) {
  const track = useCallback(
    async (eventName: ConversionEventName, metadata?: Record<string, unknown>) => {
      try {
        await trackConversionEvent({
          caseId,
          eventName,
          source: getSource(),
          metadata,
        });
      } catch {
        // Analytics should never block the paywall or checkout flow.
      }
    },
    [caseId],
  );

  return { track };
}

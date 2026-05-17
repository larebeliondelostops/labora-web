"use client";

import { useCallback } from "react";

import { actionEventByType } from "@/src/modules/result/utils/result-status-copy";
import type {
  CaseResultResponse,
  ResultAction,
} from "@/src/modules/result/api/result.types";

export function emitResultEvent(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("labora:analytics", {
      detail: {
        event,
        payload,
      },
    }),
  );
}

export function useResultActions(result: CaseResultResponse | null) {
  const basePayload = {
    caseId: result?.caseId,
    resultId: result?.resultId,
    routeType: result?.recommendedRoute?.routeType,
    viabilityLevel: result?.finalViability?.level,
  };

  const trackAction = useCallback(
    (action: ResultAction, extraPayload: Record<string, unknown> = {}) => {
      const event = actionEventByType[action.type] || "result_cta_clicked";

      emitResultEvent(event, {
        ...basePayload,
        action: action.type,
        label: action.label,
        enabled: action.enabled,
        timestamp: new Date().toISOString(),
        ...extraPayload,
      });

      if (event !== "result_cta_clicked") {
        emitResultEvent("result_cta_clicked", {
          ...basePayload,
          action: action.type,
          label: action.label,
          enabled: action.enabled,
          timestamp: new Date().toISOString(),
          ...extraPayload,
        });
      }
    },
    [
      basePayload.caseId,
      basePayload.resultId,
      basePayload.routeType,
      basePayload.viabilityLevel,
    ],
  );

  return { trackAction };
}

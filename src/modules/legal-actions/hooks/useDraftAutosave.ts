"use client";

import { useCallback, useRef, useState } from "react";

import type {
  LegalDraft,
  UpdateDraftRequest,
} from "@/src/modules/legal-actions/api/legal-actions.types";

export type AutosaveState = "idle" | "saving" | "saved" | "error";

export function useDraftAutosave({
  onSave,
}: {
  onSave: (payload: UpdateDraftRequest) => Promise<LegalDraft>;
}) {
  const timerRef = useRef<number | null>(null);
  const [state, setState] = useState<AutosaveState>("idle");

  const scheduleSave = useCallback(
    (payload: UpdateDraftRequest) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(async () => {
        setState("saving");

        try {
          await onSave(payload);
          setState("saved");
        } catch {
          setState("error");
        }
      }, 1400);
    },
    [onSave],
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    state,
    scheduleSave,
    cancel,
    setState,
  };
}

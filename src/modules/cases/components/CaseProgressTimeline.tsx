import { AlertCircle, Check, Circle, LockKeyhole } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/src/modules/cases/api/cases.types";
import {
  getProgressStates,
  progressSteps,
  type CaseProgressState,
} from "@/src/modules/cases/utils/caseActions";

const stateClasses: Record<CaseProgressState, string> = {
  pending: "border-labora-ui bg-white text-labora-gray",
  current: "border-labora-green bg-labora-green text-white",
  completed: "border-labora-green bg-emerald-50 text-labora-green",
  blocked: "border-amber-300 bg-amber-50 text-amber-800",
  error: "border-red-300 bg-red-50 text-red-700",
};

function StepIcon({ state }: { state: CaseProgressState }) {
  if (state === "completed") {
    return <Check className="h-4 w-4" aria-hidden="true" />;
  }

  if (state === "blocked") {
    return <LockKeyhole className="h-4 w-4" aria-hidden="true" />;
  }

  if (state === "error") {
    return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
  }

  return <Circle className="h-4 w-4" aria-hidden="true" />;
}

export function CaseProgressTimeline({ status }: { status: CaseStatus }) {
  const states = getProgressStates(status);

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
        Estado del expediente
      </h2>
      <p className="mt-1 text-sm text-labora-gray">
        El recorrido completo del caso, desde la creacion hasta la entrega final.
      </p>

      <ol className="mt-6 grid gap-3 lg:grid-cols-2">
        {progressSteps.map((step, index) => {
          const state = states[step.id];

          return (
            <li key={step.id} className="flex gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  stateClasses[state],
                )}
              >
                <StepIcon state={state} />
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-sm font-semibold text-labora-charcoal">
                  {index + 1}. {step.label}
                </p>
                <p className="text-xs capitalize text-labora-gray">{state}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

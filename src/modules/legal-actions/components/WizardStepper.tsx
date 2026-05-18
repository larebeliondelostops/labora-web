import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string;
  label: string;
};

export function WizardStepper({
  steps,
  activeIndex,
  onSelect,
}: {
  steps: WizardStep[];
  activeIndex: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <nav aria-label="Progreso del wizard">
      <p className="mb-2 text-sm font-semibold text-labora-deep md:hidden">
        Paso {activeIndex + 1} de {steps.length}: {steps[activeIndex]?.label}
      </p>
      <ol className="hidden gap-2 overflow-x-auto rounded-2xl border border-labora-ui bg-white p-2 shadow-panel md:flex">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;

          return (
            <li key={step.id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onSelect?.(index)}
                disabled={!onSelect}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition",
                  isActive
                    ? "bg-labora-green text-white"
                    : isDone
                      ? "bg-labora-mint/30 text-labora-deep"
                      : "text-labora-gray hover:bg-labora-ivory",
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px]">
                    {index + 1}
                  </span>
                )}
                <span className="truncate">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

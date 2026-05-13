import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const steps = [
  { key: "account", label: "Cuenta" },
  { key: "consents", label: "Consentimientos" },
  { key: "case", label: "Expediente" },
  { key: "documents", label: "Documentos" },
];

export function ConsentStepper() {
  return (
    <ol
      aria-label="Progreso del flujo"
      className="grid grid-cols-4 overflow-hidden rounded-lg border border-labora-ui bg-white text-xs font-semibold text-labora-gray"
    >
      {steps.map((step, index) => {
        const isCurrent = step.key === "consents";
        const isDone = index === 0;

        return (
          <li
            key={step.key}
            className={cn(
              "flex min-h-12 items-center justify-center gap-2 border-r border-labora-ui px-2 text-center last:border-r-0",
              isCurrent && "bg-labora-green text-white",
              isDone && !isCurrent && "bg-labora-ivory text-labora-deep",
            )}
            aria-current={isCurrent ? "step" : undefined}
          >
            {isDone ? <CheckCircle2 className="hidden h-4 w-4 sm:block" /> : null}
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

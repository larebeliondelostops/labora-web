import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { FieldError } from "@/components/auth/FormFeedback";
import type { CaseTypeRequested } from "@/src/modules/cases/api/cases.types";
import { caseTypeLabels } from "@/src/modules/cases/utils/caseFormatters";

export const caseTypeOptions: CaseTypeRequested[] = [
  "labor_history_analysis",
  "pension_liquidation_review",
  "pension_reliquidation",
  "missing_weeks_review",
  "teacher_magisterio_case",
  "special_regime_case",
  "administrative_claim",
  "lawsuit_draft_preparation",
  "not_sure",
];

export function CaseTypeSelector({
  value,
  error,
  onChange,
  disabled = false,
}: {
  value: CaseTypeRequested | "";
  error?: string;
  onChange: (value: CaseTypeRequested) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de analisis">
        {caseTypeOptions.map((option) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={cn(
                "min-h-[92px] rounded-2xl border bg-white p-4 text-left text-sm font-semibold text-labora-charcoal transition focus:outline-none focus:ring-2 focus:ring-labora-green/20 disabled:bg-labora-ivory disabled:text-labora-gray",
                selected
                  ? "border-labora-green shadow-panel"
                  : "border-labora-ui hover:border-labora-mint",
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span>{caseTypeLabels[option]}</span>
                {selected ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <FieldError message={error} />
    </div>
  );
}

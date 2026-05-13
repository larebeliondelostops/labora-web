import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { FieldError } from "@/components/auth/FormFeedback";
import type { SituationType } from "@/src/modules/cases/api/cases.types";
import { situationTypeLabels } from "@/src/modules/cases/utils/caseFormatters";

export const situationTypeOptions: SituationType[] = [
  "not_pensioned_yet",
  "pensioned_with_doubts",
  "request_denied",
  "recognized_with_possible_error",
  "reliquidation_needed",
  "missing_weeks_or_time",
  "employer_default_or_omission",
  "regime_transfer_issue",
  "other",
  "not_sure",
];

export function SituationTypeSelector({
  value,
  description,
  error,
  onChange,
  onDescriptionChange,
  disabled = false,
}: {
  value: SituationType | "";
  description: string;
  error?: string;
  onChange: (value: SituationType) => void;
  onDescriptionChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Situacion actual">
        {situationTypeOptions.map((option) => {
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
                "min-h-[88px] rounded-2xl border bg-white p-4 text-left text-sm font-semibold text-labora-charcoal transition focus:outline-none focus:ring-2 focus:ring-labora-green/20 disabled:bg-labora-ivory disabled:text-labora-gray",
                selected
                  ? "border-labora-green shadow-panel"
                  : "border-labora-ui hover:border-labora-mint",
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span>{situationTypeLabels[option]}</span>
                {selected ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-labora-green" aria-hidden="true" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <FieldError message={error} />

      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Cuentanos brevemente que quieres revisar
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          disabled={disabled}
          rows={4}
          className="w-full rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm leading-6 text-labora-charcoal outline-none transition focus:border-labora-green focus:ring-2 focus:ring-labora-green/15 disabled:bg-labora-ivory disabled:text-labora-gray"
        />
      </label>
    </div>
  );
}

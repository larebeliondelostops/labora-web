import { CheckCircle2, UserRound, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { FieldError } from "@/components/auth/FormFeedback";

export interface ThirdPartyValue {
  actingAsThirdParty: boolean | null;
  relationship: string;
  authorizationConfirmed: boolean;
}

export type ThirdPartyErrors = Partial<
  Record<"actingAsThirdParty" | "relationship" | "authorizationConfirmed", string>
>;

const relationships = [
  "Hijo/a",
  "Conyuge o companero/a",
  "Apoderado/a",
  "Familiar",
  "Representante legal",
  "Otro",
];

export function ThirdPartyStep({
  value,
  errors,
  onChange,
  disabled = false,
}: {
  value: ThirdPartyValue;
  errors: ThirdPartyErrors;
  onChange: (value: ThirdPartyValue) => void;
  disabled?: boolean;
}) {
  const options = [
    {
      label: "Actuo por mi",
      description: "El expediente es sobre tu propia historia laboral o pensional.",
      selected: value.actingAsThirdParty === false,
      icon: UserRound,
      nextValue: false,
    },
    {
      label: "Actuo por otra persona",
      description: "Crearas el expediente de un titular que autorizo la revision.",
      selected: value.actingAsThirdParty === true,
      icon: UsersRound,
      nextValue: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de actuacion">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            disabled={disabled}
            role="radio"
            aria-checked={option.selected}
            onClick={() =>
              onChange({
                ...value,
                actingAsThirdParty: option.nextValue,
                relationship: option.nextValue ? value.relationship : "",
                authorizationConfirmed: option.nextValue ? value.authorizationConfirmed : false,
              })
            }
            className={cn(
              "min-h-[132px] rounded-2xl border bg-white p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-labora-green/20 disabled:bg-labora-ivory disabled:text-labora-gray",
              option.selected
                ? "border-labora-green shadow-panel"
                : "border-labora-ui hover:border-labora-mint",
            )}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
                <option.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {option.selected ? (
                <CheckCircle2 className="h-5 w-5 text-labora-green" aria-hidden="true" />
              ) : null}
            </span>
            <span className="mt-4 block font-heading text-base font-semibold text-labora-charcoal">
              {option.label}
            </span>
            <span className="mt-2 block text-sm leading-6 text-labora-gray">
              {option.description}
            </span>
          </button>
        ))}
      </div>
      <FieldError message={errors.actingAsThirdParty} />

      {value.actingAsThirdParty ? (
        <div className="rounded-2xl border border-labora-ui bg-labora-ivory p-4">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
              Relacion con el titular
              <select
                value={value.relationship}
                onChange={(event) => onChange({ ...value, relationship: event.target.value })}
                disabled={disabled}
                aria-invalid={Boolean(errors.relationship)}
                className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15 disabled:bg-labora-ivory"
              >
                <option value="">Selecciona una relacion</option>
                {relationships.map((relationship) => (
                  <option key={relationship} value={relationship}>
                    {relationship}
                  </option>
                ))}
              </select>
              <FieldError message={errors.relationship} />
            </label>

            <label className="flex gap-3 text-sm leading-6 text-labora-gray">
              <input
                type="checkbox"
                checked={value.authorizationConfirmed}
                onChange={(event) =>
                  onChange({ ...value, authorizationConfirmed: event.target.checked })
                }
                disabled={disabled}
                className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green focus:ring-labora-green"
              />
              <span>
                Confirmo que cuento con autorizacion del titular para iniciar este
                expediente. Mas adelante podremos pedir un soporte de autorizacion.
              </span>
            </label>
            <FieldError message={errors.authorizationConfirmed} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

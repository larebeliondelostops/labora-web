import type { ChangeEvent } from "react";

import { FieldError } from "@/components/auth/FormFeedback";
import type { DocumentType } from "@/src/modules/cases/api/cases.types";
import { documentTypeLabels } from "@/src/modules/cases/utils/caseFormatters";

export interface HolderFormValue {
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: string;
  email: string;
  phone: string;
}

export type HolderFormErrors = Partial<Record<keyof HolderFormValue, string>>;

const inputClass =
  "min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal outline-none transition focus:border-labora-green focus:ring-2 focus:ring-labora-green/15 disabled:bg-labora-ivory disabled:text-labora-gray";

const documentTypes: DocumentType[] = ["CC", "CE", "PA", "NIT", "OTHER"];

export function HolderForm({
  value,
  errors,
  onChange,
  disabled = false,
  documentNumberRequired = true,
  documentNumberPlaceholder,
}: {
  value: HolderFormValue;
  errors: HolderFormErrors;
  onChange: (value: HolderFormValue) => void;
  disabled?: boolean;
  documentNumberRequired?: boolean;
  documentNumberPlaceholder?: string;
}) {
  function update(field: keyof HolderFormValue) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange({ ...value, [field]: event.target.value });
    };
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Nombres
        <input
          value={value.firstName}
          onChange={update("firstName")}
          disabled={disabled}
          autoComplete="given-name"
          aria-invalid={Boolean(errors.firstName)}
          aria-describedby={errors.firstName ? "holder-first-name-error" : undefined}
          className={inputClass}
        />
        <FieldError id="holder-first-name-error" message={errors.firstName} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Apellidos
        <input
          value={value.lastName}
          onChange={update("lastName")}
          disabled={disabled}
          autoComplete="family-name"
          aria-invalid={Boolean(errors.lastName)}
          aria-describedby={errors.lastName ? "holder-last-name-error" : undefined}
          className={inputClass}
        />
        <FieldError id="holder-last-name-error" message={errors.lastName} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Tipo de documento
        <select
          value={value.documentType}
          onChange={update("documentType")}
          disabled={disabled}
          aria-invalid={Boolean(errors.documentType)}
          aria-describedby={errors.documentType ? "holder-document-type-error" : undefined}
          className={inputClass}
        >
          {documentTypes.map((type) => (
            <option key={type} value={type}>
              {documentTypeLabels[type]}
            </option>
          ))}
        </select>
        <FieldError id="holder-document-type-error" message={errors.documentType} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Numero de documento
        <input
          value={value.documentNumber}
          onChange={update("documentNumber")}
          disabled={disabled}
          autoComplete="off"
          placeholder={documentNumberPlaceholder}
          aria-invalid={Boolean(errors.documentNumber)}
          aria-describedby={errors.documentNumber ? "holder-document-number-error" : undefined}
          className={inputClass}
          required={documentNumberRequired}
        />
        <FieldError id="holder-document-number-error" message={errors.documentNumber} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Fecha de nacimiento
        <input
          type="date"
          value={value.birthDate}
          onChange={update("birthDate")}
          disabled={disabled}
          autoComplete="bday"
          aria-invalid={Boolean(errors.birthDate)}
          aria-describedby={errors.birthDate ? "holder-birth-date-error" : undefined}
          className={inputClass}
        />
        <FieldError id="holder-birth-date-error" message={errors.birthDate} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Correo del titular
        <input
          type="email"
          value={value.email}
          onChange={update("email")}
          disabled={disabled}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "holder-email-error" : undefined}
          className={inputClass}
        />
        <FieldError id="holder-email-error" message={errors.email} />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal sm:col-span-2">
        Celular del titular
        <input
          type="tel"
          value={value.phone}
          onChange={update("phone")}
          disabled={disabled}
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "holder-phone-error" : undefined}
          className={inputClass}
        />
        <FieldError id="holder-phone-error" message={errors.phone} />
      </label>
    </div>
  );
}

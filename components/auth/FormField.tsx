"use client";

import type { ChangeEventHandler, InputHTMLAttributes, SelectHTMLAttributes } from "react";

import { FieldError } from "@/components/auth/FormFeedback";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export function TextInput({ label, error, helpText, id, ...props }: TextInputProps) {
  const inputId = id || props.name || label;
  const errorId = `${inputId}-error`;

  return (
    <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
      {label}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="h-11 rounded-lg border border-labora-ui bg-white px-3 text-sm font-normal text-labora-charcoal outline-none transition focus:border-labora-green focus:ring-2 focus:ring-labora-mint disabled:bg-labora-ivory disabled:text-labora-gray"
        {...props}
      />
      {helpText ? <span className="text-xs font-normal text-labora-gray">{helpText}</span> : null}
      <FieldError id={errorId} message={error} />
    </label>
  );
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helpText?: string;
  options: Array<{ value: string; label: string }>;
}

export function SelectInput({
  label,
  error,
  helpText,
  options,
  id,
  ...props
}: SelectInputProps) {
  const inputId = id || props.name || label;
  const errorId = `${inputId}-error`;

  return (
    <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
      {label}
      <select
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="h-11 rounded-lg border border-labora-ui bg-white px-3 text-sm font-normal text-labora-charcoal outline-none transition focus:border-labora-green focus:ring-2 focus:ring-labora-mint disabled:bg-labora-ivory disabled:text-labora-gray"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText ? <span className="text-xs font-normal text-labora-gray">{helpText}</span> : null}
      <FieldError id={errorId} message={error} />
    </label>
  );
}

export const emailChangeHandler =
  (onChange: (value: string) => void): ChangeEventHandler<HTMLInputElement> =>
  (event) => {
    onChange(event.target.value.toLowerCase());
  };

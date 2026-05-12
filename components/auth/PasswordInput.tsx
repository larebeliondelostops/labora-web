"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

import { FieldError } from "@/components/auth/FormFeedback";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function PasswordInput({ label, error, id, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = id || props.name || label;
  const errorId = `${inputId}-error`;

  return (
    <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
      {label}
      <span className="relative">
        <input
          id={inputId}
          type={isVisible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-11 w-full rounded-lg border border-labora-ui bg-white px-3 pr-11 text-sm font-normal text-labora-charcoal outline-none transition focus:border-labora-green focus:ring-2 focus:ring-labora-mint disabled:bg-labora-ivory disabled:text-labora-gray"
          {...props}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-labora-gray hover:bg-labora-ivory hover:text-labora-deep"
          aria-label={isVisible ? "Ocultar contrasena" : "Mostrar contrasena"}
          onClick={() => setIsVisible((value) => !value)}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      <FieldError id={errorId} message={error} />
    </label>
  );
}

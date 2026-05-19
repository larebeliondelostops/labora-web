"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: ReactNode;
}

export function LoadingButton({
  isLoading,
  children,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "box-border inline-flex min-h-11 w-full max-w-full items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {isLoading ? "Cargando..." : children}
    </button>
  );
}

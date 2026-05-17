"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { toneClasses } from "@/src/modules/result/utils/result-colors";
import type { ResultTone } from "@/src/modules/result/api/result.types";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  onClick,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2",
        variant === "primary" && "bg-labora-green text-white hover:bg-labora-deep",
        variant === "secondary" &&
          "border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory",
        variant === "ghost" &&
          "border border-transparent bg-transparent text-labora-deep hover:bg-labora-ivory",
      )}
    >
      {children}
    </Link>
  );
}

export function DisabledButton({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled
      title={title}
      className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-gray opacity-70"
    >
      {children}
    </button>
  );
}

export function ToneBadge({
  tone,
  children,
  className,
}: {
  tone: ResultTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-labora-ui bg-white p-5 shadow-panel", className)}>
      {children}
    </section>
  );
}

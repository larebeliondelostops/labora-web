"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowRight } from "lucide-react";

import { trackPublicEvent } from "@/lib/public-api";
import { cn } from "@/lib/utils";

interface CtaLinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  eventLabel?: string;
}

export function CtaLink({
  href,
  children,
  variant = "primary",
  className,
  eventLabel,
}: CtaLinkProps) {
  const variantClass = {
    primary:
      "bg-labora-green text-white hover:bg-labora-deep focus:ring-labora-green",
    secondary:
      "border border-labora-ui bg-white text-labora-deep hover:bg-labora-ivory focus:ring-labora-green",
    ghost: "text-labora-deep hover:bg-white/70 focus:ring-labora-green",
  }[variant];

  return (
    <Link
      href={href}
      onClick={() =>
        trackPublicEvent("landing_publica.cta_clicked", {
          label: eventLabel || String(children),
          href,
        })
      }
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2",
        variantClass,
        className,
      )}
    >
      {children}
      {variant === "primary" ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
    </Link>
  );
}

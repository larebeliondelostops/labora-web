import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  compact?: boolean;
  className?: string;
}

export function Logo({ href = "/", compact = false, className }: LogoProps) {
  const image = compact ? (
    <img
      src="/icono-labora-192.png"
      alt="Labora"
      className="h-9 w-9 object-contain"
    />
  ) : (
    <span className="inline-flex items-center gap-2">
      <img
        src="/icono-labora-192.png"
        alt=""
        aria-hidden="true"
        className="h-10 w-10 object-contain"
      />
      <span className="font-heading text-2xl font-extrabold text-labora-charcoal">
        Labora
      </span>
    </span>
  );

  if (!href) {
    return <span className={className}>{image}</span>;
  }

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center", className)}
      aria-label="Ir al inicio de Labora"
    >
      {image}
    </Link>
  );
}

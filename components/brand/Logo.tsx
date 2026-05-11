import Link from "next/link";

interface LogoProps {
  href?: string;
  compact?: boolean;
  className?: string;
}

export function Logo({ href = "/", compact = false, className }: LogoProps) {
  const image = (
    <img
      src={compact ? "/logo-mark.svg" : "/logo.svg"}
      alt="Labora"
      className={compact ? "h-9 w-9" : "h-10 w-auto"}
    />
  );

  if (!href) {
    return <span className={className}>{image}</span>;
  }

  return (
    <Link href={href} className={className} aria-label="Ir al inicio de Labora">
      {image}
    </Link>
  );
}

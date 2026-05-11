import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto max-w-6xl px-5 sm:px-6", className)}>{children}</div>;
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-14 sm:py-18", className)}>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 font-heading text-3xl font-semibold tracking-normal text-labora-charcoal sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-labora-gray sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}

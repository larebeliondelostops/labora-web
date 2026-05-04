import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-labora-ui/70 bg-white/85 p-6 shadow-panel backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

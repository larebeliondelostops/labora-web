import type { ReactNode } from "react";

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-xs font-medium text-red-700">
      {message}
    </p>
  );
}

export function InlineAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info" | "warning";
  children: ReactNode;
}) {
  const className = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-slate-200 bg-slate-50 text-slate-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  }[tone];

  return <div className={`rounded-lg border p-4 text-sm leading-6 ${className}`}>{children}</div>;
}

export function FormErrorSummary({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return <InlineAlert>{message}</InlineAlert>;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
      <div className="h-5 w-36 animate-pulse rounded bg-labora-ui" />
      <div className="mt-5 h-4 w-full animate-pulse rounded bg-labora-ui" />
      <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-labora-ui" />
      <div className="mt-6 h-11 w-full animate-pulse rounded bg-labora-ui" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-labora-ui bg-white p-5 text-sm text-labora-gray">
      {message}
    </div>
  );
}

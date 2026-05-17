"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Panel } from "@/src/modules/result/components/ResultPrimitives";

export function ResultErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Panel>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-700">
              Error
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
              No pudimos cargar el resultado
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-labora-gray">
              {message}
            </p>
          </div>
        </div>

        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        ) : null}
      </div>
    </Panel>
  );
}

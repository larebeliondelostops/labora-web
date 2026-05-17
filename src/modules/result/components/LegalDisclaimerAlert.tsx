"use client";

import { AlertCircle, ShieldAlert } from "lucide-react";

import type { ResultWarning } from "@/src/modules/result/api/result.types";

const defaultEconomicCopy =
  "Los valores mostrados son estimaciones. Pueden cambiar con documentos adicionales, validacion juridica o revision profesional.";

export function LegalDisclaimerAlert({
  legalDisclaimer,
  warnings,
  showEconomicDisclaimer,
}: {
  legalDisclaimer: string | null;
  warnings: ResultWarning[];
  showEconomicDisclaimer: boolean;
}) {
  const items = [
    ...(showEconomicDisclaimer
      ? [{ code: "ECONOMIC_ESTIMATE", message: defaultEconomicCopy, severity: "warning" as const }]
      : []),
    ...warnings,
    ...(legalDisclaimer
      ? [{ code: "LEGAL_DISCLAIMER", message: legalDisclaimer, severity: "info" as const }]
      : []),
  ];

  if (!items.length) {
    return null;
  }

  return (
    <section className="grid gap-3" aria-label="Advertencias del resultado">
      {items.map((item) => {
        const critical = item.severity === "critical";

        return (
          <div
            key={`${item.code}-${item.message}`}
            role={critical ? "alert" : "status"}
            className={
              critical
                ? "flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700 shadow-panel"
                : "flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 shadow-panel"
            }
          >
            {critical ? (
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            <span>{item.message}</span>
          </div>
        );
      })}
    </section>
  );
}

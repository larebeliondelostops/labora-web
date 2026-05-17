"use client";

import { FileText } from "lucide-react";

import { Panel } from "@/src/modules/result/components/ResultPrimitives";
import type { CaseResultResponse } from "@/src/modules/result/api/result.types";
import { compactText } from "@/src/modules/result/utils/result-formatters";

export function ExecutiveSummaryCard({
  result,
}: {
  result: CaseResultResponse;
}) {
  return (
    <Panel>
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Resumen ejecutivo
          </h2>
          <p className="mt-3 text-sm leading-6 text-labora-gray">
            {compactText(
              result.executiveSummary || result.userExplanation,
              "El backend no envio un resumen ejecutivo para este resultado.",
            )}
          </p>
        </div>
      </div>
    </Panel>
  );
}

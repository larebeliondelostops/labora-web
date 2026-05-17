import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CaseNextAction } from "@/src/modules/cases/api/cases.types";
import {
  getNextActionHref,
  nextActionMeta,
} from "@/src/modules/cases/utils/caseActions";

export type NextActionCardProps = {
  nextBestAction: CaseNextAction;
  allowedActions: string[];
  caseId: string;
};

const actionAliases: Partial<Record<CaseNextAction, string[]>> = {
  start_preanalysis: ["view_preanalysis", "continue_to_preanalysis"],
  view_preanalysis: ["start_preanalysis"],
  start_full_analysis: ["view_full_analysis", "run_full_analysis"],
};

function isActionAllowed(action: CaseNextAction, allowedActions: string[]) {
  if (allowedActions.length === 0) {
    return true;
  }

  return (
    allowedActions.includes(action) ||
    actionAliases[action]?.some((alias) => allowedActions.includes(alias)) ||
    false
  );
}

export function NextActionCard({
  nextBestAction,
  allowedActions,
  caseId,
}: NextActionCardProps) {
  const meta = nextActionMeta[nextBestAction];
  const isDisabled = nextBestAction === "none" || !isActionAllowed(nextBestAction, allowedActions);

  return (
    <section className="rounded-2xl border border-labora-ui bg-labora-deep p-5 text-white shadow-panel">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/12">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-mint">
              Proxima accion
            </p>
            <h2 className="mt-1 font-heading text-xl font-semibold">{meta.label}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/78">
              {meta.description}
            </p>
          </div>
        </div>

        <Link
          href={getNextActionHref(nextBestAction, caseId)}
          aria-disabled={isDisabled}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition",
            isDisabled
              ? "pointer-events-none bg-white/10 text-white/60"
              : "bg-white text-labora-deep hover:bg-labora-ivory",
          )}
        >
          {meta.label}
          {!isDisabled && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </Link>
      </div>
    </section>
  );
}

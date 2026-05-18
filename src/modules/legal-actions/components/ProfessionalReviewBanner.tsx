import { ShieldAlert } from "lucide-react";

import type {
  LegalActionType,
  ProfessionalReviewLevel,
} from "@/src/modules/legal-actions/api/legal-actions.types";
import {
  isJudicialAction,
  professionalReviewLabels,
} from "@/src/modules/legal-actions/utils/mapStatusToLabel";

export function ProfessionalReviewBanner({
  actionType,
  level,
}: {
  actionType?: LegalActionType;
  level: ProfessionalReviewLevel;
}) {
  if (level === "none" && !isJudicialAction(actionType)) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
      <div className="flex gap-3">
        <ShieldAlert className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold">
            {professionalReviewLabels[level]}
          </h2>
          <p className="mt-2 text-sm leading-6">
            Este documento es un borrador tecnico-juridico. Para una radicacion
            formal puede requerir revision, firma o representacion profesional,
            segun el caso.
          </p>
        </div>
      </div>
    </section>
  );
}

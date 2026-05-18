import {
  AlertTriangle,
  ClipboardList,
  Download,
  FileText,
  Gavel,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  EligibilityStatus,
  LegalActionType,
  MissingAttachment,
  ProfessionalReviewLevel,
  Warning,
} from "@/src/modules/legal-actions/api/legal-actions.types";
import { EligibilityBadge } from "@/src/modules/legal-actions/components/EligibilityBadge";
import { professionalReviewLabels } from "@/src/modules/legal-actions/utils/mapStatusToLabel";

export type LegalActionCardProps = {
  actionType: LegalActionType;
  title: string;
  description: string;
  eligibilityStatus: EligibilityStatus;
  eligibilityReason?: string;
  professionalReviewLevel: ProfessionalReviewLevel;
  warnings?: Warning[];
  missingAttachments?: MissingAttachment[];
  isRecommended?: boolean;
  onStart: () => void;
  isLoading?: boolean;
};

const actionIcons: Record<LegalActionType, typeof FileText> = {
  technical_report_download: Download,
  executive_summary: ClipboardList,
  petition: FileText,
  administrative_claim: ShieldCheck,
  reliquidation_request: RefreshCcw,
  administrative_appeal: Scale,
  lawsuit_draft: Gavel,
  professional_review_request: Sparkles,
};

function getCta(status: EligibilityStatus) {
  if (status === "blocked" || status === "not_recommended") {
    return "No disponible";
  }

  if (status === "requires_more_data") {
    return "Completar datos";
  }

  if (status === "requires_professional_review") {
    return "Solicitar revision";
  }

  return "Iniciar";
}

export function LegalActionCard({
  actionType,
  title,
  description,
  eligibilityStatus,
  eligibilityReason,
  professionalReviewLevel,
  warnings = [],
  missingAttachments = [],
  isRecommended = false,
  onStart,
  isLoading = false,
}: LegalActionCardProps) {
  const Icon = actionIcons[actionType];
  const disabled =
    eligibilityStatus === "blocked" || eligibilityStatus === "not_recommended";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-white p-5 shadow-panel",
        isRecommended ? "border-labora-green/45" : "border-labora-ui",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-labora-ivory text-labora-deep">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {isRecommended ? (
            <span className="rounded-full border border-labora-green/25 bg-labora-mint/35 px-2.5 py-1 text-xs font-semibold text-labora-deep">
              Recomendada
            </span>
          ) : null}
          <EligibilityBadge status={eligibilityStatus} />
        </div>
      </div>

      <h3 className="mt-4 font-heading text-lg font-semibold text-labora-charcoal">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-labora-gray">{description}</p>

      <div className="mt-4 space-y-3 text-sm">
        <p className="rounded-lg bg-labora-ivory px-3 py-2 text-xs font-medium text-labora-deep">
          {professionalReviewLabels[professionalReviewLevel]}
        </p>

        {eligibilityReason ? (
          <p className="text-xs leading-5 text-labora-gray">{eligibilityReason}</p>
        ) : null}

        {warnings.slice(0, 2).map((warning) => (
          <p
            key={warning.code}
            className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {warning.message}
          </p>
        ))}

        {missingAttachments.length ? (
          <p className="rounded-lg border border-labora-ui px-3 py-2 text-xs leading-5 text-labora-gray">
            {missingAttachments.length} anexo(s) pendiente(s)
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={disabled || isLoading}
        className={cn(
          "mt-auto inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition",
          disabled
            ? "cursor-not-allowed border border-labora-ui bg-slate-50 text-labora-gray"
            : "bg-labora-green text-white hover:bg-labora-deep",
        )}
      >
        {isLoading ? "Procesando..." : getCta(eligibilityStatus)}
      </button>
    </article>
  );
}

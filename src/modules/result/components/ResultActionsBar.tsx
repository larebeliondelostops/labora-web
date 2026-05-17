"use client";

import {
  ClipboardEdit,
  FileText,
  RefreshCcw,
  UploadCloud,
  UserCheck,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  ButtonLink,
  DisabledButton,
} from "@/src/modules/result/components/ResultPrimitives";
import type { ResultAction } from "@/src/modules/result/api/result.types";

const actionIcon: Record<ResultAction["type"], ReactNode> = {
  generate_report: <FileText className="h-4 w-4" aria-hidden="true" />,
  generate_executive_summary: <FileText className="h-4 w-4" aria-hidden="true" />,
  generate_legal_action: <ClipboardEdit className="h-4 w-4" aria-hidden="true" />,
  upload_missing_documents: <UploadCloud className="h-4 w-4" aria-hidden="true" />,
  request_professional_review: <UserCheck className="h-4 w-4" aria-hidden="true" />,
  go_to_payment: <WalletCards className="h-4 w-4" aria-hidden="true" />,
  retry_analysis: <RefreshCcw className="h-4 w-4" aria-hidden="true" />,
};

export function ResultActionsBar({
  actions,
  onAction,
}: {
  actions: ResultAction[];
  onAction?: (action: ResultAction) => void;
}) {
  if (!actions.length) {
    return null;
  }

  return (
    <section
      aria-label="Acciones disponibles"
      className="sticky bottom-0 z-20 -mx-4 border-t border-labora-ui bg-white/95 p-4 shadow-panel backdrop-blur md:static md:mx-0 md:rounded-2xl md:border md:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        {actions.map((action, index) => {
          const icon = actionIcon[action.type];
          const variant = index === 0 ? "primary" : "secondary";

          if (action.enabled && action.href) {
            return (
              <ButtonLink
                key={`${action.type}-${action.label}`}
                href={action.href}
                variant={variant}
                onClick={() => onAction?.(action)}
              >
                {icon}
                {action.label}
              </ButtonLink>
            );
          }

          return (
            <DisabledButton
              key={`${action.type}-${action.label}`}
              title={action.disabledReason || "Accion no disponible"}
            >
              {icon}
              {action.label}
            </DisabledButton>
          );
        })}
      </div>
    </section>
  );
}

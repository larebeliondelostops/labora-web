"use client";

import {
  Clock3,
  LockKeyhole,
  RefreshCcw,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  ButtonLink,
  Panel,
  ToneBadge,
} from "@/src/modules/result/components/ResultPrimitives";
import { resultStatusCopy } from "@/src/modules/result/utils/result-status-copy";
import type {
  CaseResultResponse,
  ResultAction,
  ResultStatus,
} from "@/src/modules/result/api/result.types";

const statusIcon: Record<ResultStatus, ReactNode> = {
  not_started: <Clock3 className="h-6 w-6" aria-hidden="true" />,
  in_progress: <RefreshCcw className="h-6 w-6" aria-hidden="true" />,
  completed: <LockKeyhole className="h-6 w-6" aria-hidden="true" />,
  blocked: <LockKeyhole className="h-6 w-6" aria-hidden="true" />,
  requires_review: <ShieldAlert className="h-6 w-6" aria-hidden="true" />,
  approved: <LockKeyhole className="h-6 w-6" aria-hidden="true" />,
  rejected: <ShieldAlert className="h-6 w-6" aria-hidden="true" />,
  error: <ShieldAlert className="h-6 w-6" aria-hidden="true" />,
};

export function ResultBlockedState({
  result,
  caseId,
  onAction,
}: {
  result: CaseResultResponse;
  caseId: string;
  onAction?: (action: ResultAction) => void;
}) {
  const primaryAction = result.availableActions.find(
    (action) => action.enabled && action.href,
  );

  return (
    <Panel>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-900">
            {statusIcon[result.status]}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              {resultStatusCopy[result.status]}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
              El resultado completo aun no puede mostrarse
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-labora-gray">
              Labora necesita completar el paso indicado por el backend antes de
              desbloquear esta vista para el usuario.
            </p>

            {result.blockers.length ? (
              <div className="mt-4 grid gap-3">
                {result.blockers.map((blocker) => (
                  <div
                    key={`${blocker.code}-${blocker.message}`}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
                  >
                    <strong>{blocker.code}:</strong> {blocker.message}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3">
          <ToneBadge tone="warning">Vista bloqueada</ToneBadge>
          {primaryAction?.href ? (
            <ButtonLink href={primaryAction.href} onClick={() => onAction?.(primaryAction)}>
              {primaryAction.type === "go_to_payment" ? (
                <WalletCards className="h-4 w-4" aria-hidden="true" />
              ) : null}
              {primaryAction.label}
            </ButtonLink>
          ) : (
            <ButtonLink href={`/app/cases/${caseId}/full-analysis`} variant="secondary">
              Ver analisis completo
            </ButtonLink>
          )}
        </div>
      </div>
    </Panel>
  );
}

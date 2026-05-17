"use client";

import { ArrowRight, CheckCircle2, LockKeyhole, Route } from "lucide-react";

import { ButtonLink, Panel, ToneBadge } from "@/src/modules/result/components/ResultPrimitives";
import type {
  RecommendedRoute,
  ResultAction,
} from "@/src/modules/result/api/result.types";
import { routeTypeCopy } from "@/src/modules/result/utils/result-status-copy";

export function RecommendedRoutePanel({
  route,
  actions,
  onAction,
}: {
  route: RecommendedRoute | null;
  actions: ResultAction[];
  onAction?: (action: ResultAction) => void;
}) {
  if (!route) {
    return (
      <Panel>
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-gray">
            <Route className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Ruta recomendada
            </h2>
            <p className="mt-3 text-sm leading-6 text-labora-gray">
              El backend no envio una ruta recomendada para este resultado.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  const routeAction = actions.find(
    (action) =>
      action.enabled &&
      action.href &&
      (action.href === route.nextActionUrl ||
        action.type === route.nextActionType ||
        action.label === route.nextActionLabel),
  );

  return (
    <Panel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-labora-mint/25 text-labora-deep">
            <Route className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              {routeTypeCopy[route.routeType]}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
              {route.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-labora-gray">
              {route.description}
            </p>
          </div>
        </div>
        <ToneBadge tone={route.blockers.length ? "warning" : "success"}>
          {route.blockers.length ? "Con bloqueadores" : "Ruta disponible"}
        </ToneBadge>
      </div>

      <div className="mt-5 rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray">
        <h3 className="font-semibold text-labora-charcoal">Razon de la recomendacion</h3>
        <p className="mt-2">{route.rationale}</p>
      </div>

      {route.blockers.length ? (
        <div className="mt-4 grid gap-3">
          {route.blockers.map((blocker) => (
            <div
              key={`${blocker.code}-${blocker.message}`}
              className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
            >
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <strong>{blocker.code}:</strong> {blocker.message}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {route.requiredDocuments.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-labora-charcoal">
            Documentos requeridos para esta ruta
          </h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-labora-gray">
            {route.requiredDocuments.map((document) => (
              <li key={document.id || document.name} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-labora-green" aria-hidden="true" />
                <span>{document.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {route.nextActionLabel && route.nextActionUrl ? (
        <div className="mt-6">
          <ButtonLink
            href={route.nextActionUrl}
            onClick={() => {
              if (routeAction) {
                onAction?.(routeAction);
              }
            }}
          >
            {route.nextActionLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      ) : null}
    </Panel>
  );
}

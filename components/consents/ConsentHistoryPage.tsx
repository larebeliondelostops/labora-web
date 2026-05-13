"use client";

import { useEffect, useMemo, useState } from "react";

import { FormErrorSummary, InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { ConsentHistoryTable } from "@/components/consents/ConsentHistoryTable";
import {
  consentStatusLabels,
  getApiConsentTypeOptions,
  getConsentTypeLabel,
} from "@/lib/consent-content";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  getConsentHistory,
  getConsentStatus,
} from "@/services/consent.service";
import type {
  ConsentHistoryItem,
  ConsentStatusResponse,
  ConsentType,
} from "@/types/consent";

const allFilter = "all";

export function ConsentHistoryPage() {
  const [history, setHistory] = useState<ConsentHistoryItem[]>([]);
  const [status, setStatus] = useState<ConsentStatusResponse | null>(null);
  const [filter, setFilter] = useState<ConsentType | typeof allFilter>(allFilter);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getConsentHistory(), getConsentStatus()])
      .then(([nextHistory, nextStatus]) => {
        if (!isMounted) {
          return;
        }

        setHistory(nextHistory);
        setStatus(nextStatus);
      })
      .catch((requestError) => {
        if (!isMounted) {
          return;
        }

        setError(
          getApiErrorMessage(
            requestError,
            "No pudimos cargar tu historial de consentimientos.",
          ),
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredHistory = useMemo(
    () =>
      filter === allFilter
        ? history
        : history.filter((item) => item.consentType === filter),
    [filter, history],
  );

  const filterOptions = useMemo(() => {
    const uniqueTypes = Array.from(new Set(history.map((item) => item.consentType)));

    return uniqueTypes.length ? uniqueTypes : getApiConsentTypeOptions();
  }, [history]);

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
          Privacidad
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
          Historial de consentimientos
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-labora-gray">
          Consulta que aceptaste, cuando lo hiciste y bajo que version legal quedo
          registrada la evidencia.
        </p>
        {status ? (
          <div className="mt-5">
            <InlineAlert tone={status.status === "completed" ? "success" : "warning"}>
              Estado actual: {consentStatusLabels[status.status]}.{" "}
              {status.canUploadDocuments
                ? "Puedes continuar con carga documental."
                : "Aun no puedes cargar documentos."}
            </InlineAlert>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Registros
          </h2>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal sm:min-w-64">
            Filtrar por tipo
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as ConsentType | typeof allFilter)}
              className="h-11 rounded-lg border border-labora-ui bg-white px-3 text-sm font-normal text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-mint"
            >
              <option value={allFilter}>Todos</option>
              {filterOptions.map((type) => (
                <option key={type} value={type}>
                  {getConsentTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <FormErrorSummary message={error} />
          {isLoading ? <SkeletonCard /> : null}
          {!isLoading && !error ? <ConsentHistoryTable items={filteredHistory} /> : null}
        </div>
      </section>
    </div>
  );
}

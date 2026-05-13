"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { ConsentHistoryTable } from "@/components/consents/ConsentHistoryTable";
import { formatConsentDate } from "@/lib/consent-content";
import { getApiErrorMessage } from "@/lib/auth-errors";
import { getConsentHistory, getConsentStatus } from "@/services/consent.service";
import type { ConsentHistoryItem, ConsentStatusResponse } from "@/types/consent";

export function ConsentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/cases/new";
  const acceptedAtFromQuery = searchParams.get("acceptedAt") || undefined;
  const [status, setStatus] = useState<ConsentStatusResponse | null>(null);
  const [history, setHistory] = useState<ConsentHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getConsentStatus(), getConsentHistory()])
      .then(([nextStatus, nextHistory]) => {
        if (!isMounted) {
          return;
        }

        setStatus(nextStatus);
        setHistory(nextHistory);
      })
      .catch((requestError) => {
        if (!isMounted) {
          return;
        }

        setError(
          getApiErrorMessage(
            requestError,
            "Tus autorizaciones fueron registradas, pero no pudimos cargar el resumen.",
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

  const acceptedAt = status?.lastAcceptedAt || acceptedAtFromQuery;

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <CheckCircle2 className="h-10 w-10 text-labora-green" />
        <h1 className="mt-4 font-heading text-3xl font-semibold text-labora-charcoal">
          Tus autorizaciones fueron registradas correctamente
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-labora-gray">
          Ya puedes continuar con la creacion de tu expediente y cargar los documentos
          requeridos para el analisis.
        </p>
        {acceptedAt ? (
          <p className="mt-4 rounded-lg bg-labora-ivory p-4 text-sm text-labora-gray">
            Fecha de aceptacion:{" "}
            <span className="font-semibold text-labora-deep">{formatConsentDate(acceptedAt)}</span>
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(nextUrl)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white hover:bg-labora-deep"
          >
            Crear expediente
          </button>
          <Link
            href="/app/perfil/privacidad/consentimientos"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Ver historial de consentimientos
          </Link>
        </div>
      </section>

      {error ? <InlineAlert tone="warning">{error}</InlineAlert> : null}
      {isLoading ? <SkeletonCard /> : null}
      {!isLoading && history.length ? (
        <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
          <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
            Resumen aceptado
          </h2>
          <div className="mt-5">
            <ConsentHistoryTable items={history.slice(0, 5)} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

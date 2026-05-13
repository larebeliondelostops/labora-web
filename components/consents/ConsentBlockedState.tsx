"use client";

import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { getConsentTypeLabel } from "@/lib/consent-content";
import type { ConsentType } from "@/types/consent";

interface ConsentBlockedStateProps {
  missingConsentTypes: ConsentType[];
  onGoToConsents?: () => void;
}

export function ConsentBlockedState({
  missingConsentTypes,
  onGoToConsents,
}: ConsentBlockedStateProps) {
  const router = useRouter();

  const handleGoToConsents = () => {
    if (onGoToConsents) {
      onGoToConsents();
      return;
    }

    router.push("/app/onboarding/consentimientos");
  };

  return (
    <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
      <LockKeyhole className="h-8 w-8 text-labora-green" />
      <h1 className="mt-4 font-heading text-2xl font-semibold text-labora-charcoal">
        Falta completar tus consentimientos
      </h1>
      <p className="mt-2 text-sm leading-6 text-labora-gray">
        Para proteger tu informacion y continuar con el expediente, debes aceptar las
        autorizaciones obligatorias.
      </p>
      {missingConsentTypes.length ? (
        <ul className="mt-4 grid gap-2 text-sm text-labora-gray">
          {missingConsentTypes.map((type) => (
            <li key={type}>- {getConsentTypeLabel(type)}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleGoToConsents}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white hover:bg-labora-deep"
        >
          Completar consentimientos
        </button>
        <button
          type="button"
          onClick={() => router.push("/app/dashboard")}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
        >
          Volver al panel
        </button>
      </div>
    </section>
  );
}

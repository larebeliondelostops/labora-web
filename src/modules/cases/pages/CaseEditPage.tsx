"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";

import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { CaseStatusBadge } from "@/src/modules/cases/components/CaseStatusBadge";
import { CaseTypeSelector } from "@/src/modules/cases/components/CaseTypeSelector";
import {
  HolderForm,
  type HolderFormErrors,
  type HolderFormValue,
} from "@/src/modules/cases/components/HolderForm";
import { SituationTypeSelector } from "@/src/modules/cases/components/SituationTypeSelector";
import {
  ThirdPartyStep,
  type ThirdPartyErrors,
  type ThirdPartyValue,
} from "@/src/modules/cases/components/ThirdPartyStep";
import type {
  CaseTypeRequested,
  SituationType,
  UpdateCasePayload,
} from "@/src/modules/cases/api/cases.types";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { useUpdateCase } from "@/src/modules/cases/hooks/useUpdateCase";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";

interface EditState {
  holder: HolderFormValue;
  thirdParty: ThirdPartyValue;
  caseType: CaseTypeRequested | "";
  pensionFundOrEntity: string;
  situationType: SituationType | "";
  situationDescription: string;
}

type EditErrors = {
  holder: HolderFormErrors;
  thirdParty: ThirdPartyErrors;
  caseType?: string;
  situationType?: string;
  submit?: string;
};

function emptyErrors(): EditErrors {
  return {
    holder: {},
    thirdParty: {},
  };
}

function createStateFromCase(laboraCase: NonNullable<ReturnType<typeof useCaseDetail>["data"]>): EditState {
  return {
    holder: {
      firstName: laboraCase.holder.firstName,
      lastName: laboraCase.holder.lastName,
      documentType: laboraCase.holder.documentType,
      documentNumber: "",
      birthDate: laboraCase.holder.birthDate || "",
      email: laboraCase.holder.email || "",
      phone: laboraCase.holder.phone || "",
    },
    thirdParty: {
      actingAsThirdParty: laboraCase.actingAsThirdParty,
      relationship: laboraCase.thirdPartyRelationship || "",
      authorizationConfirmed: laboraCase.actingAsThirdParty,
    },
    caseType: laboraCase.caseTypeRequested,
    pensionFundOrEntity: laboraCase.pensionFundOrEntity || "",
    situationType: laboraCase.situationType,
    situationDescription: laboraCase.situationDescription || "",
  };
}

function validateHolder(holder: HolderFormValue) {
  const errors: HolderFormErrors = {};

  if (holder.firstName.trim().length < 2) {
    errors.firstName = "Ingresa los nombres del titular.";
  }

  if (holder.lastName.trim().length < 2) {
    errors.lastName = "Ingresa los apellidos del titular.";
  }

  if (holder.birthDate) {
    const birthDate = new Date(`${holder.birthDate}T00:00:00`);

    if (birthDate > new Date()) {
      errors.birthDate = "La fecha de nacimiento no puede ser futura.";
    }
  }

  if (holder.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(holder.email)) {
    errors.email = "Ingresa un correo valido.";
  }

  if (holder.phone && !/^[+\d\s().-]{7,20}$/.test(holder.phone)) {
    errors.phone = "Ingresa un celular valido.";
  }

  return errors;
}

function validateThirdParty(value: ThirdPartyValue) {
  const errors: ThirdPartyErrors = {};

  if (value.actingAsThirdParty === null) {
    errors.actingAsThirdParty = "Indica si actuas por ti o por otra persona.";
  }

  if (value.actingAsThirdParty && !value.relationship) {
    errors.relationship = "Selecciona la relacion con el titular.";
  }

  if (value.actingAsThirdParty && !value.authorizationConfirmed) {
    errors.authorizationConfirmed = "Confirma que cuentas con autorizacion del titular.";
  }

  return errors;
}

function containsErrors(errors: EditErrors) {
  return (
    Object.values(errors.holder).some(Boolean) ||
    Object.values(errors.thirdParty).some(Boolean) ||
    Boolean(errors.caseType) ||
    Boolean(errors.situationType) ||
    Boolean(errors.submit)
  );
}

function validate(state: EditState): EditErrors {
  const errors = emptyErrors();
  errors.holder = validateHolder(state.holder);
  errors.thirdParty = validateThirdParty(state.thirdParty);

  if (!state.caseType) {
    errors.caseType = "Selecciona un tipo de analisis.";
  }

  if (!state.situationType) {
    errors.situationType = "Selecciona una situacion para orientar el expediente.";
  }

  return errors;
}

function toPayload(state: EditState): UpdateCasePayload {
  const holder: NonNullable<UpdateCasePayload["holder"]> = {
    firstName: state.holder.firstName.trim(),
    lastName: state.holder.lastName.trim(),
    documentType: state.holder.documentType,
    birthDate: state.holder.birthDate || null,
    email: state.holder.email.trim() || null,
    phone: state.holder.phone.trim() || null,
  };

  if (state.holder.documentNumber.trim() && !state.holder.documentNumber.includes("*")) {
    holder.documentNumber = state.holder.documentNumber.trim();
  }

  return {
    holderType: state.thirdParty.actingAsThirdParty ? "third_party" : "self",
    holder,
    actingAsThirdParty: Boolean(state.thirdParty.actingAsThirdParty),
    thirdPartyRelationship: state.thirdParty.relationship || null,
    thirdPartyAuthorizationConfirmed: state.thirdParty.authorizationConfirmed,
    caseTypeRequested: state.caseType || undefined,
    pensionFundOrEntity: state.pensionFundOrEntity.trim() || null,
    situationType: state.situationType || undefined,
    situationDescription: state.situationDescription.trim() || null,
  };
}

export function CaseEditPage({ caseId }: { caseId: string }) {
  const { data: laboraCase, isLoading, error, refetch } = useCaseDetail(caseId);
  const { update, isLoading: isSaving, error: saveError, setError } = useUpdateCase(caseId);
  const [state, setState] = useState<EditState | null>(null);
  const [errors, setErrors] = useState<EditErrors>(emptyErrors);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (laboraCase) {
      setState(createStateFromCase(laboraCase));
    }
  }, [laboraCase]);

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (error || !laboraCase) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error || "No encontramos este expediente."}
        <button type="button" onClick={refetch} className="mt-4 block font-semibold">
          Reintentar
        </button>
      </div>
    );
  }

  if (!state) {
    return <SkeletonCard />;
  }

  const isLocked =
    laboraCase.canEdit === false ||
    ["closed", "archived", "paid_unlocked"].includes(laboraCase.status);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");
    setError(null);

    if (!state || isLocked) {
      return;
    }

    const nextErrors = validate(state);

    if (containsErrors(nextErrors)) {
      setErrors({
        ...nextErrors,
        submit: "Revisa los campos marcados antes de guardar.",
      });
      return;
    }

    try {
      await update(toPayload(state));
      setErrors(emptyErrors());
      setSuccess("Expediente actualizado correctamente.");
      await refetch();
    } catch {
      setErrors({ ...nextErrors, submit: "No pudimos guardar los cambios." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-20 md:pb-0">
      <Link
        href={`/app/cases/${laboraCase.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al expediente
      </Link>

      <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
              Editar expediente
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
              {laboraCase.caseNumber}
            </h1>
            <p className="mt-1 text-sm text-labora-gray">
              {getHolderFullName(laboraCase.holder)}
            </p>
          </div>
          <CaseStatusBadge status={laboraCase.status} />
        </div>
      </header>

      {isLocked ? (
        <InlineAlert tone="warning">
          Este expediente no puede modificarse en este momento. Si necesitas un
          ajuste, contacta a soporte.
        </InlineAlert>
      ) : null}

      {success ? (
        <InlineAlert tone="success">
          <span aria-live="polite">{success}</span>
        </InlineAlert>
      ) : null}

      {(errors.submit || saveError) ? (
        <InlineAlert>{errors.submit || saveError}</InlineAlert>
      ) : null}

      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Titular
        </h2>
        <div className="mt-5">
          <HolderForm
            value={state.holder}
            errors={errors.holder}
            onChange={(holder) => setState({ ...state, holder })}
            disabled={isLocked || isSaving}
            documentNumberRequired={false}
            documentNumberPlaceholder={laboraCase.holder.documentNumberMasked}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Actuacion
        </h2>
        <div className="mt-5">
          <ThirdPartyStep
            value={state.thirdParty}
            errors={errors.thirdParty}
            onChange={(thirdParty) => setState({ ...state, thirdParty })}
            disabled={isLocked || isSaving}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Tipo de analisis
        </h2>
        <div className="mt-5">
          <CaseTypeSelector
            value={state.caseType}
            error={errors.caseType}
            onChange={(caseType) => setState({ ...state, caseType })}
            disabled={isLocked || isSaving}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Situacion actual
        </h2>
        <div className="mt-5 space-y-5">
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Entidad o fondo pensional
            <input
              value={state.pensionFundOrEntity}
              onChange={(event) =>
                setState({ ...state, pensionFundOrEntity: event.target.value })
              }
              disabled={isLocked || isSaving}
              className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15 disabled:bg-labora-ivory"
            />
          </label>
          <SituationTypeSelector
            value={state.situationType}
            description={state.situationDescription}
            error={errors.situationType}
            onChange={(situationType) => setState({ ...state, situationType })}
            onDescriptionChange={(situationDescription) =>
              setState({ ...state, situationDescription })
            }
            disabled={isLocked || isSaving}
          />
        </div>
      </section>

      <div className="hidden justify-end gap-3 md:flex">
        <Link
          href={`/app/cases/${laboraCase.id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isLocked || isSaving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white hover:bg-labora-deep disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-labora-ui bg-white/95 p-4 shadow-panel backdrop-blur md:hidden">
        <button
          type="submit"
          disabled={isLocked || isSaving}
          className="min-h-11 w-full rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

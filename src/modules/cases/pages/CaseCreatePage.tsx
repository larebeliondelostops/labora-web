"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";

import { ApiError } from "@/lib/api";
import { getCaseErrorMessage } from "@/src/modules/cases/api/cases.api";
import type {
  CaseTypeRequested,
  CreateCasePayload,
  SituationType,
} from "@/src/modules/cases/api/cases.types";
import { CaseTypeSelector } from "@/src/modules/cases/components/CaseTypeSelector";
import { CaseWizardReview } from "@/src/modules/cases/components/CaseWizardReview";
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
import { useCreateCase } from "@/src/modules/cases/hooks/useCreateCase";
import { cn } from "@/lib/utils";

export interface CaseWizardState {
  holder: HolderFormValue;
  thirdParty: ThirdPartyValue;
  caseType: CaseTypeRequested | "";
  pensionFundOrEntity: string;
  situationType: SituationType | "";
  situationDescription: string;
}

type WizardErrors = {
  holder: HolderFormErrors;
  thirdParty: ThirdPartyErrors;
  caseType?: string;
  situationType?: string;
  submit?: string;
};

const initialState: CaseWizardState = {
  holder: {
    firstName: "",
    lastName: "",
    documentType: "CC",
    documentNumber: "",
    birthDate: "",
    email: "",
    phone: "",
  },
  thirdParty: {
    actingAsThirdParty: null,
    relationship: "",
    authorizationConfirmed: false,
  },
  caseType: "",
  pensionFundOrEntity: "",
  situationType: "",
  situationDescription: "",
};

const steps = [
  {
    title: "Titular del caso",
    description:
      "Estos datos identifican a la persona sobre la que se realizara el analisis.",
  },
  {
    title: "Actuacion",
    description: "Indica si actuas por ti o por otra persona.",
  },
  {
    title: "Tipo de analisis",
    description: "Elige la opcion que mejor describa lo que quieres revisar.",
  },
  {
    title: "Situacion actual",
    description: "Cuentanos donde esta hoy el caso para orientar el expediente.",
  },
  {
    title: "Revision",
    description: "Confirma la informacion antes de crear el expediente.",
  },
];

function emptyErrors(): WizardErrors {
  return {
    holder: {},
    thirdParty: {},
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

  if (!holder.documentType) {
    errors.documentType = "Selecciona el tipo de documento.";
  }

  if (!holder.documentNumber.trim()) {
    errors.documentNumber = "Ingresa el numero de documento.";
  }

  if (holder.birthDate) {
    const birthDate = new Date(`${holder.birthDate}T00:00:00`);
    const today = new Date();

    if (birthDate > today) {
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

function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}

function validateStep(step: number, state: CaseWizardState): WizardErrors {
  const errors = emptyErrors();

  if (step === 0) {
    errors.holder = validateHolder(state.holder);
  }

  if (step === 1) {
    errors.thirdParty = validateThirdParty(state.thirdParty);
  }

  if (step === 2 && !state.caseType) {
    errors.caseType = "Selecciona un tipo de analisis.";
  }

  if (step === 3 && !state.situationType) {
    errors.situationType = "Selecciona una situacion para orientar el expediente.";
  }

  return errors;
}

function validateAll(state: CaseWizardState): WizardErrors {
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

function containsErrors(errors: WizardErrors) {
  return (
    hasErrors(errors.holder) ||
    hasErrors(errors.thirdParty) ||
    Boolean(errors.caseType) ||
    Boolean(errors.situationType) ||
    Boolean(errors.submit)
  );
}

function toPayload(state: CaseWizardState): CreateCasePayload {
  if (!state.caseType || !state.situationType || state.thirdParty.actingAsThirdParty === null) {
    throw new Error("Formulario incompleto.");
  }

  return {
    holderType: state.thirdParty.actingAsThirdParty ? "third_party" : "self",
    holder: {
      firstName: state.holder.firstName.trim(),
      lastName: state.holder.lastName.trim(),
      documentType: state.holder.documentType,
      documentNumber: state.holder.documentNumber.trim(),
      birthDate: state.holder.birthDate || null,
      email: state.holder.email.trim() || null,
      phone: state.holder.phone.trim() || null,
    },
    actingAsThirdParty: state.thirdParty.actingAsThirdParty,
    thirdPartyRelationship: state.thirdParty.relationship || null,
    thirdPartyAuthorizationConfirmed: state.thirdParty.authorizationConfirmed,
    caseTypeRequested: state.caseType,
    pensionFundOrEntity: state.pensionFundOrEntity.trim() || null,
    situationType: state.situationType,
    situationDescription: state.situationDescription.trim() || null,
  };
}

export function CaseCreatePage() {
  const router = useRouter();
  const [state, setState] = useState<CaseWizardState>(initialState);
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<WizardErrors>(emptyErrors);
  const [consentRequired, setConsentRequired] = useState(false);
  const { create, isLoading } = useCreateCase();

  function goNext() {
    const nextErrors = validateStep(activeStep, state);
    setErrors(nextErrors);

    if (!containsErrors(nextErrors)) {
      setActiveStep((step) => Math.min(step + 1, steps.length - 1));
    }
  }

  function goBack() {
    setErrors(emptyErrors());
    setActiveStep((step) => Math.max(step - 1, 0));
  }

  async function submitWizard(submit: boolean) {
    const nextErrors = validateAll(state);
    setConsentRequired(false);

    if (containsErrors(nextErrors)) {
      setErrors({
        ...nextErrors,
        submit: "Revisa los campos marcados antes de crear el expediente.",
      });
      return;
    }

    try {
      const created = await create(toPayload(state), { submit });
      router.push(`/app/cases/${created.id}`);
    } catch (requestError) {
      setConsentRequired(
        requestError instanceof ApiError && requestError.code === "CONSENT_REQUIRED",
      );
      setErrors({
        ...nextErrors,
        submit: getCaseErrorMessage(requestError),
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitWizard(true);
  }

  return (
    <form onSubmit={handleSubmit} className="pb-24 md:pb-0">
      <Link
        href="/app/cases"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a mis expedientes
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
            Nuevo expediente
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
            Crea tu expediente digital
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-labora-gray">
            Organizaremos la informacion basica de tu caso para guiar el analisis
            laboral o pensional.
          </p>

          <ol className="mt-6 grid gap-2 sm:grid-cols-5">
            {steps.map((step, index) => {
              const isActive = activeStep === index;
              const isComplete = activeStep > index;

              return (
                <li key={step.title}>
                  <button
                    type="button"
                    onClick={() => {
                      if (index <= activeStep) {
                        setActiveStep(index);
                      }
                    }}
                    className={cn(
                      "flex w-full min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition",
                      isActive || isComplete
                        ? "border-labora-green bg-labora-ivory text-labora-deep"
                        : "border-labora-ui bg-white text-labora-gray",
                    )}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs">
                      {isComplete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                    </span>
                    <span className="min-w-0 truncate">{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-8">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-labora-charcoal">
                {steps[activeStep].title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-labora-gray">
                {steps[activeStep].description}
              </p>
            </div>

            <div className="mt-6">
              {activeStep === 0 ? (
                <div className="space-y-5">
                  <div className="rounded-xl border border-labora-ui bg-labora-ivory p-4 text-sm leading-6 text-labora-gray">
                    Trataremos esta informacion como sensible.
                  </div>
                  <HolderForm
                    value={state.holder}
                    errors={errors.holder}
                    onChange={(holder) => setState({ ...state, holder })}
                  />
                </div>
              ) : null}

              {activeStep === 1 ? (
                <ThirdPartyStep
                  value={state.thirdParty}
                  errors={errors.thirdParty}
                  onChange={(thirdParty) => setState({ ...state, thirdParty })}
                />
              ) : null}

              {activeStep === 2 ? (
                <CaseTypeSelector
                  value={state.caseType}
                  error={errors.caseType}
                  onChange={(caseType) => setState({ ...state, caseType })}
                />
              ) : null}

              {activeStep === 3 ? (
                <div className="space-y-5">
                  <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
                    Entidad o fondo pensional
                    <input
                      value={state.pensionFundOrEntity}
                      onChange={(event) =>
                        setState({ ...state, pensionFundOrEntity: event.target.value })
                      }
                      className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
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
                  />
                </div>
              ) : null}

              {activeStep === 4 ? <CaseWizardReview state={state} /> : null}
            </div>

            {errors.submit ? (
              <div
                className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
                aria-live="assertive"
              >
                <p>{errors.submit}</p>
                {consentRequired ? (
                  <Link
                    href="/app/consents"
                    className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
                  >
                    Ir a autorizaciones
                  </Link>
                ) : null}
              </div>
            ) : null}

            <div className="mt-8 hidden items-center justify-between gap-3 md:flex">
              <button
                type="button"
                onClick={goBack}
                disabled={activeStep === 0 || isLoading}
                className="min-h-11 rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <div className="flex gap-3">
                {activeStep === steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => void submitWizard(false)}
                    disabled={isLoading}
                    className="min-h-11 rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory disabled:opacity-50"
                  >
                    Guardar como borrador
                  </button>
                ) : null}
                {activeStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep disabled:opacity-60"
                  >
                    {isLoading ? "Creando..." : "Crear expediente"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-labora-ui bg-labora-ivory p-5 shadow-panel xl:sticky xl:top-6 xl:self-start">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-labora-green">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-semibold text-labora-charcoal">
            Informacion sensible
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            La informacion de tu expediente puede incluir datos personales, laborales,
            pensionales y salariales. La trataremos como informacion sensible.
          </p>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-labora-ui bg-white/95 p-4 shadow-panel backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={activeStep === 0 || isLoading}
            className="min-h-11 flex-1 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep disabled:opacity-50"
          >
            Anterior
          </button>
          {activeStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="min-h-11 flex-1 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white"
            >
              Continuar
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-11 flex-1 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isLoading ? "Creando..." : "Crear expediente"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

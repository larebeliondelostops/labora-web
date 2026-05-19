"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FormErrorSummary, InlineAlert } from "@/components/auth/FormFeedback";
import { TextInput, SelectInput } from "@/components/auth/FormField";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { ApiError } from "@/lib/api";
import { buildRegisterOtpPath, profileCompletionPath } from "@/lib/auth-flow";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiFieldErrors,
} from "@/lib/auth-errors";
import {
  cleanDocumentNumber,
  getNextAuthPath,
} from "@/lib/auth-validation";
import { getMe, updateMe } from "@/services/user.service";
import type { CurrentUser } from "@/types/user";

const documentTypes = [
  { value: "", label: "Selecciona" },
  { value: "CC", label: "Cedula de ciudadania" },
  { value: "CE", label: "Cedula de extranjeria" },
  { value: "TI", label: "Tarjeta de identidad" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "NIT", label: "NIT" },
  { value: "OTHER", label: "Otro" },
];

interface RegisterFormState {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
}

const initialState: RegisterFormState = {
  firstName: "",
  lastName: "",
  documentType: "",
  documentNumber: "",
  phone: "",
};

function valueOrEmpty(value?: string | null): string {
  return value?.trim() || "";
}

function getRegisterClientErrors(
  form: RegisterFormState,
): Record<string, string> {
  const nextErrors: Record<string, string> = {};

  if (form.firstName.trim().length < 2) {
    nextErrors.firstName = "Ingresa al menos 2 caracteres.";
  }

  if (form.lastName.trim().length < 2) {
    nextErrors.lastName = "Ingresa al menos 2 caracteres.";
  }

  if (!form.documentType) {
    nextErrors.documentType = "Selecciona el tipo de documento.";
  }

  if (cleanDocumentNumber(form.documentNumber).length < 4) {
    nextErrors.documentNumber = "Ingresa un documento valido.";
  }

  return nextErrors;
}

function getNameFallback(user: CurrentUser): Pick<RegisterFormState, "firstName" | "lastName"> {
  const firstName = valueOrEmpty(user.firstName);
  const lastName = valueOrEmpty(user.lastName);

  if (firstName || lastName) {
    return { firstName, lastName };
  }

  const parts = valueOrEmpty(user.fullName).split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { firstName: parts[0] || "", lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function getInitialState(user: CurrentUser): RegisterFormState {
  const name = getNameFallback(user);

  return {
    ...name,
    documentType: valueOrEmpty(user.documentType),
    documentNumber: valueOrEmpty(user.documentNumber),
    phone: valueOrEmpty(user.phone),
  };
}

function hasCompletedRegistration(user: CurrentUser): boolean {
  if (user.registrationCompleted !== undefined) {
    return user.registrationCompleted;
  }

  const state = getInitialState(user);

  return (
    state.firstName.trim().length >= 2 &&
    state.lastName.trim().length >= 2 &&
    Boolean(state.documentType) &&
    cleanDocumentNumber(state.documentNumber).length >= 4
  );
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isProfileStep = searchParams.get("step") === "datos";
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [form, setForm] = useState<RegisterFormState>(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setIsCheckingSession(true);
    getMe()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        setCurrentUser(user);
        setForm(getInitialState(user));

        if (user.nextStep === "verify_otp") {
          router.replace(buildRegisterOtpPath(user.email));
          return;
        }

        if (user.nextStep === "dashboard") {
          router.replace("/app/dashboard");
          return;
        }

        if (
          user.nextStep === "complete_profile" ||
          user.nextStep === "profile" ||
          !hasCompletedRegistration(user)
        ) {
          if (!isProfileStep) {
            router.replace(profileCompletionPath);
            return;
          }

          setIsCheckingSession(false);
          return;
        }

        if (user.nextStep) {
          router.replace(getNextAuthPath(user.nextStep, user.email));
          return;
        }

        if (!isProfileStep && !hasCompletedRegistration(user)) {
          router.replace(profileCompletionPath);
          return;
        }

        setIsCheckingSession(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setCurrentUser(null);
        setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isProfileStep, router]);

  const errors = useMemo(() => {
    const nextErrors = getRegisterClientErrors(form);

    return { ...nextErrors, ...fieldErrors };
  }, [fieldErrors, form]);

  const showError = (field: keyof RegisterFormState) =>
    touched[field] ? errors[field] : undefined;

  const setValue = (field: keyof RegisterFormState, value: string) => {
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumber: true,
    });
    setSubmitError(null);

    if (!currentUser) {
      setSubmitError("Primero conecta tu cuenta de Google para completar el registro.");
      return;
    }

    const clientErrors = getRegisterClientErrors(form);
    setFieldErrors({});

    if (Object.values(clientErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateMe({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        documentType: form.documentType,
        documentNumber: cleanDocumentNumber(form.documentNumber),
        phone: form.phone.trim() || undefined,
      });

      const refreshedUser = await getMe();
      setCurrentUser(refreshedUser);
      setForm(getInitialState(refreshedUser));

      if (refreshedUser.nextStep === "complete_profile" || refreshedUser.nextStep === "profile") {
        setSubmitError("Aun faltan datos requeridos para completar el registro.");
        return;
      }

      router.push(getNextAuthPath(refreshedUser.nextStep || "dashboard", refreshedUser.email));
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "No pudimos guardar tus datos. Intentalo nuevamente.",
      );
      const nextFieldErrors = getApiFieldErrors(error);
      const code = getApiErrorCode(error);
      const isDocumentConflict =
        code === "DOCUMENT_ALREADY_EXISTS" ||
        (error instanceof ApiError && error.status === 409);

      if (isDocumentConflict && !nextFieldErrors.documentNumber) {
        nextFieldErrors.documentNumber =
          message || "Ya existe una cuenta asociada a este documento.";
      }

      setFieldErrors(nextFieldErrors);
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="grid gap-4">
        <div className="h-11 animate-pulse rounded-lg bg-labora-ui" />
        <div className="h-20 animate-pulse rounded-lg bg-labora-ivory" />
        <div className="h-11 animate-pulse rounded-lg bg-labora-ui" />
      </div>
    );
  }

  if (!isProfileStep) {
    return (
      <div className="grid gap-5">
        <InlineAlert tone="info">
          Selecciona tu cuenta de Google. Si ese correo ya existe en Labora,
          entraremos directo a tu cuenta.
        </InlineAlert>

        <GoogleLoginButton
          redirectTo="/app/dashboard"
          label="Registrarme con Google"
        />

        <p className="text-center text-sm text-labora-gray">
          Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-labora-deep underline"
          >
            Inicia sesion
          </Link>
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="grid gap-5">
        <InlineAlert tone="warning">
          Para completar tus datos primero debes conectar tu cuenta de Google.
        </InlineAlert>
        <GoogleLoginButton
          redirectTo="/app/dashboard"
          label="Continuar con Google"
        />
        <Link href="/login" className="text-center text-sm font-semibold text-labora-deep underline">
          Ya tengo cuenta
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <InlineAlert tone="success">
        Cuenta Google conectada: {currentUser.email}. No necesitas crear contrasena.
      </InlineAlert>
      <FormErrorSummary message={submitError} />

      <TextInput
        label="Correo electronico"
        name="email"
        type="email"
        value={currentUser.email}
        disabled
        helpText="Este correo ya quedo asociado por Google."
        onChange={() => undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Nombres"
          name="firstName"
          value={form.firstName}
          disabled={isSubmitting}
          error={showError("firstName")}
          onBlur={() => setTouched((value) => ({ ...value, firstName: true }))}
          onChange={(event) => setValue("firstName", event.target.value)}
        />
        <TextInput
          label="Apellidos"
          name="lastName"
          value={form.lastName}
          disabled={isSubmitting}
          error={showError("lastName")}
          onBlur={() => setTouched((value) => ({ ...value, lastName: true }))}
          onChange={(event) => setValue("lastName", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
        <SelectInput
          label="Tipo de documento"
          name="documentType"
          value={form.documentType}
          disabled={isSubmitting}
          options={documentTypes}
          error={showError("documentType")}
          onBlur={() => setTouched((value) => ({ ...value, documentType: true }))}
          onChange={(event) => setValue("documentType", event.target.value)}
        />
        <TextInput
          label="Numero de documento"
          name="documentNumber"
          value={form.documentNumber}
          disabled={isSubmitting}
          helpText="Usaremos este dato para asociar tus expedientes correctamente."
          error={showError("documentNumber")}
          onBlur={() => setTouched((value) => ({ ...value, documentNumber: true }))}
          onChange={(event) => setValue("documentNumber", event.target.value)}
        />
      </div>

      <TextInput
        label="Celular"
        name="phone"
        type="tel"
        value={form.phone}
        disabled={isSubmitting}
        helpText="Opcional. Formato recomendado: +57 300 111 2233."
        onChange={(event) => setValue("phone", event.target.value)}
      />

      <LoadingButton type="submit" isLoading={isSubmitting}>
        Finalizar registro
      </LoadingButton>
    </form>
  );
}

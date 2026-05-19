"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FormErrorSummary, InlineAlert } from "@/components/auth/FormFeedback";
import { TextInput, SelectInput } from "@/components/auth/FormField";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { ApiError } from "@/lib/api";
import {
  getApiErrorCode,
  getApiErrorDetails,
  getApiErrorMessage,
  getApiFieldErrors,
} from "@/lib/auth-errors";
import {
  cleanDocumentNumber,
  getNextAuthPath,
  getSafeNextAuthPath,
  isValidEmail,
  normalizeEmail,
  withEmailQuery,
} from "@/lib/auth-validation";
import { register } from "@/services/auth.service";
import { getMe, updateMe } from "@/services/user.service";
import type { CurrentUser } from "@/types/user";

const profileCompletionPath = "/registro?step=datos";

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
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
}

const initialState: RegisterFormState = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  documentType: "",
  documentNumber: "",
  phone: "",
};

interface AuthRedirectAction {
  href: string;
  label: string;
}

function valueOrEmpty(value?: string | null): string {
  return value?.trim() || "";
}

function buildRegisterOtpPath(email?: string): string {
  const params = new URLSearchParams({
    purpose: "register",
    next: profileCompletionPath,
    auto: "1",
  });

  if (email) {
    params.set("recipient", normalizeEmail(email));
  }

  return `/verificar-otp?${params.toString()}`;
}

function getBackendRedirectPath(error: unknown, fallback: string): string {
  const redirectTo = getApiErrorDetails(error).find((detail) => detail.redirectTo)?.redirectTo;

  return getSafeNextAuthPath(redirectTo) || fallback;
}

function getRegisterClientErrors(
  form: RegisterFormState,
  requireCredentials: boolean,
): Record<string, string> {
  const nextErrors: Record<string, string> = {};

  if (requireCredentials) {
    if (!isValidEmail(form.email)) {
      nextErrors.email = "Ingresa un correo valido.";
    }

    if (!form.password) {
      nextErrors.password = "Ingresa una contrasena.";
    }
  }

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
    email: valueOrEmpty(user.email),
    password: "",
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
  const emailFromQuery = normalizeEmail(
    searchParams.get("email") || searchParams.get("recipient") || "",
  );
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [form, setForm] = useState<RegisterFormState>(() => ({
    ...initialState,
    email: emailFromQuery,
  }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authAction, setAuthAction] = useState<AuthRedirectAction | null>(null);
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

  useEffect(() => {
    if (currentUser || !emailFromQuery) {
      return;
    }

    setForm((value) => ({ ...value, email: value.email || emailFromQuery }));
  }, [currentUser, emailFromQuery]);

  const errors = useMemo(() => {
    const nextErrors = getRegisterClientErrors(form, !currentUser);

    return { ...nextErrors, ...fieldErrors };
  }, [currentUser, fieldErrors, form]);

  const showError = (field: keyof RegisterFormState) =>
    touched[field] ? errors[field] : undefined;

  const setValue = (field: keyof RegisterFormState, value: string) => {
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setAuthAction(null);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumber: true,
      email: true,
      password: true,
    });
    setSubmitError(null);
    setAuthAction(null);

    if (!currentUser) {
      if (isProfileStep) {
        setSubmitError("Primero conecta tu cuenta de Google para completar el registro.");
        return;
      }

      const clientErrors = getRegisterClientErrors(form, true);
      setFieldErrors({});

      if (Object.values(clientErrors).some(Boolean)) {
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await register({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          documentType: form.documentType,
          documentNumber: cleanDocumentNumber(form.documentNumber),
          email: normalizeEmail(form.email),
          phone: form.phone.trim() || undefined,
          password: form.password,
        });

        const nextStep = response.nextStep || "verify_otp";
        const recipient = response.recipient || form.email;

        router.push(
          nextStep === "verify_otp"
            ? buildRegisterOtpPath(recipient)
            : getNextAuthPath(nextStep, recipient),
        );
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          "No pudimos crear tu cuenta. Intentalo nuevamente.",
        );
        const nextFieldErrors = getApiFieldErrors(error);
        const code = getApiErrorCode(error);

        if (code === "EMAIL_ALREADY_EXISTS" || code === "DOCUMENT_ALREADY_EXISTS") {
          const redirectPath = getBackendRedirectPath(error, "/auth/login");

          setAuthAction({
            label: "Iniciar sesion",
            href: withEmailQuery(redirectPath, form.email),
          });

          if (code === "EMAIL_ALREADY_EXISTS" && !nextFieldErrors.email) {
            nextFieldErrors.email = message;
          }

          if (code === "DOCUMENT_ALREADY_EXISTS" && !nextFieldErrors.documentNumber) {
            nextFieldErrors.documentNumber = message;
          }
        }

        setFieldErrors(nextFieldErrors);
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const clientErrors = getRegisterClientErrors(form, false);
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
      <form onSubmit={handleSubmit} className="grid gap-5">
        <InlineAlert tone="info">
          Crea tu cuenta con tus datos. El backend validara si el correo o el
          documento ya existen antes de continuar.
        </InlineAlert>

        <FormErrorSummary message={submitError} />
        {authAction ? (
          <Link
            href={authAction.href}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep underline hover:bg-labora-ivory"
          >
            {authAction.label}
          </Link>
        ) : null}

        <TextInput
          label="Correo electronico"
          name="email"
          type="email"
          value={form.email}
          disabled={isSubmitting}
          error={showError("email")}
          onBlur={() => setTouched((value) => ({ ...value, email: true }))}
          onChange={(event) => setValue("email", event.target.value)}
        />

        <PasswordInput
          label="Contrasena"
          name="password"
          value={form.password}
          disabled={isSubmitting}
          error={showError("password")}
          onBlur={() => setTouched((value) => ({ ...value, password: true }))}
          onChange={(event) => setValue("password", event.target.value)}
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
          Crear cuenta
        </LoadingButton>

        <div className="grid gap-3 border-t border-labora-ui pt-5">
          <GoogleLoginButton
            redirectTo={buildRegisterOtpPath()}
            label="Registrarme con Google"
          />
        </div>

        <p className="text-center text-sm text-labora-gray">
          Ya tienes cuenta?{" "}
          <Link
            href={withEmailQuery("/auth/login", form.email)}
            className="font-semibold text-labora-deep underline"
          >
            Inicia sesion
          </Link>
        </p>
      </form>
    );
  }

  if (!currentUser) {
    return (
      <div className="grid gap-5">
        <InlineAlert tone="warning">
          Para completar tus datos primero debes conectar tu cuenta de Google.
        </InlineAlert>
        <GoogleLoginButton
          redirectTo={buildRegisterOtpPath()}
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

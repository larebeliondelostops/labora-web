"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { FormErrorSummary } from "@/components/auth/FormFeedback";
import { TextInput, SelectInput } from "@/components/auth/FormField";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/auth-errors";
import {
  cleanDocumentNumber,
  isStrongPassword,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth-validation";
import { register } from "@/services/auth.service";
import { getMe } from "@/services/user.service";

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
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const initialState: RegisterFormState = {
  firstName: "",
  lastName: "",
  documentType: "",
  documentNumber: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        if (!user.isVerified) {
          router.replace(`/verificar-otp?recipient=${encodeURIComponent(user.email)}&purpose=register`);
          return;
        }

        router.replace("/consentimientos");
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [router]);

  const errors = useMemo(() => {
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

    if (!isValidEmail(form.email)) {
      nextErrors.email = "Ingresa un correo valido.";
    }

    if (!isStrongPassword(form.password)) {
      nextErrors.password = "La contrasena debe cumplir las reglas minimas.";
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Las contrasenas no coinciden.";
    }

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
      email: true,
      password: true,
      confirmPassword: true,
    });
    setSubmitError(null);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const email = normalizeEmail(form.email);
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        documentType: form.documentType,
        documentNumber: cleanDocumentNumber(form.documentNumber),
        email,
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      router.push(`/verificar-otp?recipient=${encodeURIComponent(email)}&purpose=register`);
    } catch (error) {
      setFieldErrors(getApiFieldErrors(error));
      setSubmitError(
        getApiErrorMessage(error, "No pudimos crear tu cuenta. Intentalo nuevamente."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <FormErrorSummary message={submitError} />

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
        label="Correo electronico"
        name="email"
        type="email"
        value={form.email}
        disabled={isSubmitting}
        error={showError("email")}
        onBlur={() => setTouched((value) => ({ ...value, email: true }))}
        onChange={(event) => setValue("email", event.target.value.toLowerCase())}
      />

      <TextInput
        label="Celular"
        name="phone"
        type="tel"
        value={form.phone}
        disabled={isSubmitting}
        helpText="Formato recomendado: +57 300 111 2233."
        onChange={(event) => setValue("phone", event.target.value)}
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

      <PasswordInput
        label="Confirmar contrasena"
        name="confirmPassword"
        value={form.confirmPassword}
        disabled={isSubmitting}
        error={showError("confirmPassword")}
        onBlur={() => setTouched((value) => ({ ...value, confirmPassword: true }))}
        onChange={(event) => setValue("confirmPassword", event.target.value)}
      />

      <PasswordStrengthMeter
        password={form.password}
        confirmPassword={form.confirmPassword}
      />

      <LoadingButton type="submit" isLoading={isSubmitting}>
        Crear cuenta
      </LoadingButton>

      <p className="text-center text-sm text-labora-gray">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-labora-deep underline">
          Inicia sesion
        </Link>
      </p>
    </form>
  );
}

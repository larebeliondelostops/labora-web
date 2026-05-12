"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { FormErrorSummary, InlineAlert } from "@/components/auth/FormFeedback";
import { TextInput } from "@/components/auth/FormField";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { useAuth } from "@/components/auth/AuthContext";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/auth-errors";
import { updateMe } from "@/services/user.service";

export function ProfileForm() {
  const { user, setUser, refresh } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const firstNameError =
    firstName.trim().length < 2 ? "Ingresa al menos 2 caracteres." : fieldErrors.firstName;
  const lastNameError =
    lastName.trim().length < 2 ? "Ingresa al menos 2 caracteres." : fieldErrors.lastName;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ firstName: true, lastName: true });
    setSubmitError(null);
    setSaved(false);

    if (firstNameError || lastNameError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedUser = await updateMe({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      setUser(updatedUser);
      setSaved(true);
      await refresh();
    } catch (error) {
      setFieldErrors(getApiFieldErrors(error));
      setSubmitError(
        getApiErrorMessage(error, "No pudimos guardar los cambios. Intentalo nuevamente."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
              Cuenta
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
              Perfil y privacidad
            </h1>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Manten actualizados tus datos de contacto y revisa la seguridad de tu cuenta.
            </p>
          </div>
          <Link
            href="/app/perfil/seguridad"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Ver seguridad
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Datos personales
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-5">
          {saved ? <InlineAlert tone="success">Guardamos tus cambios.</InlineAlert> : null}
          <FormErrorSummary message={submitError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Nombres"
              value={firstName}
              disabled={isSubmitting}
              error={touched.firstName ? firstNameError : undefined}
              onBlur={() => setTouched((value) => ({ ...value, firstName: true }))}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <TextInput
              label="Apellidos"
              value={lastName}
              disabled={isSubmitting}
              error={touched.lastName ? lastNameError : undefined}
              onBlur={() => setTouched((value) => ({ ...value, lastName: true }))}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>

          <TextInput
            label="Celular"
            type="tel"
            value={phone}
            disabled={isSubmitting}
            helpText="Opcional. Formato recomendado: +57 300 111 2233."
            onChange={(event) => setPhone(event.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Correo electronico"
              value={user?.email || ""}
              disabled
              helpText="El cambio de correo requiere verificacion futura."
              onChange={() => undefined}
            />
            <TextInput
              label="Documento"
              value={`${user?.documentType || "Documento"} ${user?.documentNumber || ""}`.trim()}
              disabled
              helpText="No editable en este MVP."
              onChange={() => undefined}
            />
          </div>

          <div className="rounded-lg border border-labora-ui bg-labora-ivory p-4 text-sm text-labora-gray">
            Estado:{" "}
            <span className="font-semibold text-labora-deep">
              {user?.isVerified ? "Verificado" : "Pendiente de verificacion"}
            </span>
          </div>

          <LoadingButton type="submit" isLoading={isSubmitting} className="sm:w-auto">
            Guardar cambios
          </LoadingButton>
        </form>
      </section>
    </div>
  );
}

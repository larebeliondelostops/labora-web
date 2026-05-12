"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClipboardEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { FormErrorSummary, InlineAlert } from "@/components/auth/FormFeedback";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  getNextAuthPath,
  getSafeNextAuthPath,
  isValidEmail,
  maskEmail,
  normalizeEmail,
} from "@/lib/auth-validation";
import { resendOtp, verifyOtp } from "@/services/auth.service";
import { getMe } from "@/services/user.service";
import type { OtpPurpose } from "@/types/auth";

export function OtpVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientFromQuery = normalizeEmail(searchParams.get("recipient") || "");
  const [sessionRecipient, setSessionRecipient] = useState("");
  const recipient = sessionRecipient || recipientFromQuery;
  const purpose = (searchParams.get("purpose") || "register") as OtpPurpose;
  const nextPath = getSafeNextAuthPath(searchParams.get("next"));
  const shouldAutoSend = searchParams.get("auto") === "1";
  const [code, setCode] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isResolvingRecipient, setIsResolvingRecipient] = useState(
    !isValidEmail(recipientFromQuery),
  );
  const [isBlocked, setIsBlocked] = useState(false);

  const normalizedCode = useMemo(() => code.replace(/\D/g, "").slice(0, 6), [code]);
  const hasValidEmailRecipient = isValidEmail(recipient);
  const canSubmit =
    hasValidEmailRecipient && normalizedCode.length === 6 && !isBlocked && !isResolvingRecipient;

  useEffect(() => {
    let isMounted = true;

    if (isValidEmail(recipientFromQuery)) {
      setSessionRecipient("");
      setIsResolvingRecipient(false);
      return () => {
        isMounted = false;
      };
    }

    setIsResolvingRecipient(true);
    getMe()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        setSessionRecipient(normalizeEmail(user.email));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setSessionRecipient("");
      })
      .finally(() => {
        if (isMounted) {
          setIsResolvingRecipient(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [recipientFromQuery]);

  useEffect(() => {
    if (
      !shouldAutoSend ||
      purpose !== "register" ||
      !hasValidEmailRecipient ||
      isResolvingRecipient
    ) {
      return;
    }

    const storageKey = `labora:otp:auto:${purpose}:${recipient}`;

    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");
    setIsResending(true);
    setSubmitError(null);
    setStatusMessage("Estamos enviando el codigo de verificacion a tu correo.");

    resendOtp({ recipient, purpose })
      .then(() => {
        setStatusMessage("Enviamos el codigo. Revisa tambien spam o promociones.");
      })
      .catch((error) => {
        window.sessionStorage.removeItem(storageKey);
        setSubmitError(
          getApiErrorMessage(error, "No pudimos enviar el codigo. Intentalo nuevamente."),
        );
      })
      .finally(() => {
        setIsResending(false);
      });
  }, [hasValidEmailRecipient, isResolvingRecipient, purpose, recipient, shouldAutoSend]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setStatusMessage(null);

    if (!hasValidEmailRecipient) {
      setSubmitError("No encontramos un correo valido para enviar el codigo.");
      return;
    }

    if (!canSubmit) {
      setSubmitError("Ingresa el codigo de 6 digitos.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyOtp({
        recipient,
        purpose,
        code: normalizedCode,
      });

      const responseNextPath =
        response && "nextStep" in response ? getNextAuthPath(response.nextStep) : undefined;
      const registerFallbackPath = "/registro?step=datos";

      router.push(
        nextPath ||
          (purpose === "register"
            ? registerFallbackPath
            : responseNextPath || "/consentimientos"),
      );
    } catch (error) {
      const message = getApiErrorMessage(error, "No pudimos verificar el codigo.");
      setSubmitError(message);

      if (message.includes("Superaste")) {
        setIsBlocked(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!hasValidEmailRecipient) {
      setSubmitError("No encontramos un correo valido para enviar el codigo.");
      return;
    }

    setIsResending(true);
    setSubmitError(null);

    try {
      await resendOtp({ recipient, purpose });
      setCode("");
      setIsBlocked(false);
      setStatusMessage("Enviamos un nuevo codigo. Revisa tambien spam o promociones.");
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "No pudimos reenviar el codigo. Intentalo luego."),
      );
    } finally {
      setIsResending(false);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pasted) {
      event.preventDefault();
      setCode(pasted);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {isResolvingRecipient ? (
        <InlineAlert tone="info">Validando tu sesion de Google para leer el correo.</InlineAlert>
      ) : !hasValidEmailRecipient ? (
        <InlineAlert tone="warning">
          Falta el correo de destino. Vuelve a registro o login para solicitar un nuevo codigo.
        </InlineAlert>
      ) : (
        <InlineAlert tone="info">Enviamos un codigo al correo {maskEmail(recipient)}.</InlineAlert>
      )}

      {statusMessage ? <InlineAlert tone="success">{statusMessage}</InlineAlert> : null}
      <FormErrorSummary message={submitError} />

      <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
        Codigo de verificacion
        <input
          value={normalizedCode}
          disabled={isSubmitting || isBlocked}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete="one-time-code"
          onPaste={handlePaste}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-14 rounded-lg border border-labora-ui bg-white px-4 text-center font-heading text-2xl font-semibold tracking-[0.35em] text-labora-charcoal outline-none transition focus:border-labora-green focus:ring-2 focus:ring-labora-mint disabled:bg-labora-ivory disabled:text-labora-gray"
          aria-label="Codigo OTP de seis digitos"
        />
        <span className="text-xs font-normal text-labora-gray">
          Puedes pegar el codigo completo. Usa solo numeros.
        </span>
      </label>

      <LoadingButton type="submit" disabled={!canSubmit} isLoading={isSubmitting}>
        Verificar cuenta
      </LoadingButton>

      <button
        type="button"
        disabled={isResending}
        onClick={handleResend}
        className="text-sm font-semibold text-labora-deep underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isResending ? "Reenviando..." : "Reenviar codigo al correo"}
      </button>

      <p className="text-center text-sm text-labora-gray">
        Necesitas cambiar el correo?{" "}
        <Link href="/registro" className="font-semibold text-labora-deep underline">
          Volver a registro
        </Link>
      </p>
    </form>
  );
}

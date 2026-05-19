"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { InlineAlert } from "@/components/auth/FormFeedback";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { ApiError } from "@/lib/api";
import {
  getNextAuthPath,
  normalizeEmail,
} from "@/lib/auth-validation";
import { getMe } from "@/services/user.service";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = normalizeEmail(
    searchParams.get("email") || searchParams.get("recipient") || "",
  );
  const redirectTo = searchParams.get("redirect_to") || searchParams.get("next") || "/app/dashboard";
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        router.replace(getNextAuthPath(user.nextStep, user.email));
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiError && error.status !== 401) {
          setSessionError("No pudimos revisar tu sesion. Puedes intentar ingresar con Google.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="grid gap-5">
      {isCheckingSession ? (
        <InlineAlert tone="info">Revisando si ya tienes una sesion activa.</InlineAlert>
      ) : null}
      {sessionError ? <InlineAlert tone="warning">{sessionError}</InlineAlert> : null}

      <InlineAlert tone="info">
        Ingresa con Google. Labora validara tu cuenta, rol y estado antes de
        continuar.
      </InlineAlert>

      <div className="grid gap-3">
        <GoogleLoginButton
          redirectTo={redirectTo}
          label="Ingresar con Google"
          className="min-h-12 bg-labora-green text-white hover:bg-labora-deep"
        />
      </div>

      <p className="text-center text-sm text-labora-gray">
        Aun no tienes cuenta?{" "}
        <Link
          href={emailFromQuery ? `/registro?email=${encodeURIComponent(emailFromQuery)}` : "/registro"}
          className="font-semibold text-labora-deep underline"
        >
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { InlineAlert } from "@/components/auth/FormFeedback";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { ApiError } from "@/lib/api";
import { getNextAuthPath } from "@/lib/auth-validation";
import { getMe } from "@/services/user.service";

export function LoginForm() {
  const router = useRouter();
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
          setSessionError("No pudimos revisar tu sesion. Puedes intentar entrar con Google.");
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
        Usa tu cuenta de Google para entrar a Labora. El acceso se valida desde
        Google y la sesion queda protegida por el backend.
      </InlineAlert>

      <GoogleLoginButton redirectTo="/app/dashboard" label="Ingresar con Google" />

      <p className="text-center text-sm text-labora-gray">
        Aun no tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-labora-deep underline">
          Crear cuenta con Google
        </Link>
      </p>
    </div>
  );
}

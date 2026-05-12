"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { InlineAlert } from "@/components/auth/FormFeedback";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { getMe } from "@/services/user.service";

export function LoginForm() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        if (!user.isVerified) {
          router.replace(
            `/verificar-otp?recipient=${encodeURIComponent(user.email)}&purpose=register`,
          );
          return;
        }

        router.replace("/app/dashboard");
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="grid gap-5">
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

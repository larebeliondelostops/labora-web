import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Ingresa a Labora con Google.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Ingresa a tu cuenta"
      subtitle="Usa tu cuenta de Google para acceder a tus expedientes."
      sideTitle="Continua tu flujo con claridad"
      sideDescription="Validaremos tu sesion y permisos antes de continuar."
    >
      <Suspense fallback={<p className="text-sm text-labora-gray">Cargando login...</p>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}

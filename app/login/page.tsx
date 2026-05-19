import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Ingresa a Labora con tu correo y contrasena.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Ingresa a tu cuenta"
      subtitle="Usa tu correo y contrasena para acceder a tus expedientes."
      sideTitle="Continua tu flujo con claridad"
      sideDescription="Si tu cuenta requiere verificacion, te llevaremos al codigo OTP antes de continuar."
    >
      <Suspense fallback={<p className="text-sm text-labora-gray">Cargando login...</p>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}

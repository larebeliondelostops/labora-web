import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Ingresa a Labora con tu cuenta de Google.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Ingresa a tu cuenta"
      subtitle="Continua con tu cuenta de Google para acceder a tus expedientes."
      sideTitle="Continua tu flujo con claridad"
      sideDescription="Labora usa Google como acceso principal. Si tu cuenta requiere verificacion, te llevaremos al codigo OTP antes de continuar."
    >
      <LoginForm />
    </AuthLayout>
  );
}

import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Ingresa a Labora para continuar tu expediente o iniciar un nuevo analisis.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Ingresa a tu cuenta"
      subtitle="Continua con Google o usa tus credenciales si tu cuenta las tiene habilitadas."
      sideTitle="Continua tu flujo con claridad"
      sideDescription="Las cuentas nuevas usan Google como acceso principal. Si tu cuenta requiere verificacion, te llevaremos al codigo OTP antes de continuar."
    >
      <LoginForm />
    </AuthLayout>
  );
}

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
      subtitle="Continua con tu expediente o inicia un nuevo analisis."
      sideTitle="Continua tu flujo con claridad"
      sideDescription="Ingresa con correo y contrasena. Si tu cuenta requiere verificacion, te llevaremos al codigo OTP antes de continuar."
    >
      <LoginForm />
    </AuthLayout>
  );
}

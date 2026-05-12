import type { Metadata } from "next";
import { Suspense } from "react";

import { CenteredAuthLayout } from "@/components/auth/AuthLayout";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";

export const metadata: Metadata = {
  title: "Verificar cuenta",
  description: "Verifica tu cuenta con el codigo OTP enviado por Labora.",
};

export default function VerificarOtpPage() {
  return (
    <CenteredAuthLayout
      title="Verifica tu cuenta"
      subtitle="Enviamos un codigo de seguridad a tu correo. Escribelo para continuar."
    >
      <Suspense fallback={<p className="text-sm text-labora-gray">Cargando...</p>}>
        <OtpVerificationForm />
      </Suspense>
    </CenteredAuthLayout>
  );
}

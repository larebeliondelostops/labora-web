import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crea tu cuenta en Labora para iniciar tu expediente digital.",
};

export default function RegistroPage() {
  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Registra tus datos, verifica el codigo enviado al correo y continua tu expediente."
    >
      <Suspense fallback={<p className="text-sm text-labora-gray">Cargando registro...</p>}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}

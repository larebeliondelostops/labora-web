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
      title="Crea tu cuenta con Google"
      subtitle="Primero conecta Google, luego verifica el codigo enviado al correo y completa tus datos."
    >
      <Suspense fallback={<p className="text-sm text-labora-gray">Cargando registro...</p>}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}

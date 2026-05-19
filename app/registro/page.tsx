import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crea o ingresa a tu cuenta de Labora con Google.",
};

export default function RegistroPage() {
  return (
    <AuthLayout
      title="Crea tu cuenta con Google"
      subtitle="Selecciona tu correo de Google. Si ya existe en Labora, entraremos directo a tu cuenta."
    >
      <Suspense fallback={<p className="text-sm text-labora-gray">Cargando registro...</p>}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}

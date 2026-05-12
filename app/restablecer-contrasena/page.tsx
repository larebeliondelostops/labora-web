import type { Metadata } from "next";
import { Suspense } from "react";

import { CenteredAuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Restablecer contrasena",
  description: "Crea una nueva contrasena para tu cuenta de Labora.",
};

export default function RestablecerContrasenaPage() {
  return (
    <CenteredAuthLayout
      title="Crea una nueva contrasena"
      subtitle="Usa una contrasena fuerte para proteger tu cuenta."
    >
      <Suspense fallback={<p className="text-sm text-labora-gray">Cargando...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </CenteredAuthLayout>
  );
}

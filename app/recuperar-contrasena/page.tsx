import type { Metadata } from "next";

import { CenteredAuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar contrasena",
  description: "Solicita instrucciones para crear una nueva contrasena en Labora.",
};

export default function RecuperarContrasenaPage() {
  return (
    <CenteredAuthLayout
      title="Recupera tu contrasena"
      subtitle="Te enviaremos instrucciones para crear una nueva contrasena."
    >
      <ForgotPasswordForm />
    </CenteredAuthLayout>
  );
}

import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crea tu cuenta en Labora para iniciar tu expediente digital.",
};

export default function RegistroPage() {
  return (
    <AuthLayout
      title="Crea tu cuenta en Labora"
      subtitle="Empieza tu expediente digital con una cuenta segura."
    >
      <RegisterForm />
    </AuthLayout>
  );
}

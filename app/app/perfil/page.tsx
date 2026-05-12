import type { Metadata } from "next";

import { AppAccountLayout } from "@/components/auth/AppAccountLayout";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Perfil",
  description: "Administra tus datos basicos de cuenta en Labora.",
};

export default function PerfilPage() {
  return (
    <AuthProvider>
      <AppAccountLayout>
        <ProtectedRoute>
          <ProfileForm />
        </ProtectedRoute>
      </AppAccountLayout>
    </AuthProvider>
  );
}

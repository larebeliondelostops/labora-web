import type { Metadata } from "next";

import { AppAccountLayout } from "@/components/auth/AppAccountLayout";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SecuritySettingsPage } from "@/components/auth/SecuritySettingsPage";

export const metadata: Metadata = {
  title: "Seguridad de cuenta",
  description: "Revisa sesiones activas y seguridad de cuenta en Labora.",
};

export default function SeguridadPage() {
  return (
    <AuthProvider>
      <AppAccountLayout>
        <ProtectedRoute>
          <SecuritySettingsPage />
        </ProtectedRoute>
      </AppAccountLayout>
    </AuthProvider>
  );
}

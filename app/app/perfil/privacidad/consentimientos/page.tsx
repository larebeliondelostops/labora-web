import type { Metadata } from "next";

import { AppAccountLayout } from "@/components/auth/AppAccountLayout";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ConsentHistoryPage } from "@/components/consents/ConsentHistoryPage";

export const metadata: Metadata = {
  title: "Historial de consentimientos",
  description: "Consulta las autorizaciones aceptadas en Labora.",
};

export default function PerfilPrivacidadConsentimientosPage() {
  return (
    <AuthProvider>
      <AppAccountLayout>
        <ProtectedRoute>
          <ConsentHistoryPage />
        </ProtectedRoute>
      </AppAccountLayout>
    </AuthProvider>
  );
}

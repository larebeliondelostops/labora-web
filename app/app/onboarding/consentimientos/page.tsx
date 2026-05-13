import type { Metadata } from "next";

import { AppAccountLayout } from "@/components/auth/AppAccountLayout";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ConsentPage } from "@/components/consents/ConsentPage";

export const metadata: Metadata = {
  title: "Consentimientos",
  description: "Acepta las autorizaciones necesarias para continuar tu expediente en Labora.",
};

export default function OnboardingConsentimientosPage() {
  return (
    <AuthProvider>
      <AppAccountLayout>
        <ProtectedRoute>
          <ConsentPage mode="onboarding" nextUrl="/cases/new" />
        </ProtectedRoute>
      </AppAccountLayout>
    </AuthProvider>
  );
}

import type { Metadata } from "next";

import { AppAccountLayout } from "@/components/auth/AppAccountLayout";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ConsentPage } from "@/components/consents/ConsentPage";

export const metadata: Metadata = {
  title: "Autorizaciones",
  description: "Acepta las autorizaciones necesarias para crear tu expediente.",
};

export default function AppConsentsPage() {
  return (
    <AuthProvider>
      <AppAccountLayout>
        <ProtectedRoute>
          <ConsentPage mode="onboarding" nextUrl="/app/cases/new" />
        </ProtectedRoute>
      </AppAccountLayout>
    </AuthProvider>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";

import { AppAccountLayout } from "@/components/auth/AppAccountLayout";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SkeletonCard } from "@/components/auth/FormFeedback";
import { ConsentSuccessPage } from "@/components/consents/ConsentSuccessPage";

export const metadata: Metadata = {
  title: "Consentimientos registrados",
  description: "Confirmacion de autorizaciones registradas en Labora.",
};

export default function ConsentimientosExitoPage() {
  return (
    <AuthProvider>
      <AppAccountLayout>
        <ProtectedRoute>
          <Suspense fallback={<SkeletonCard />}>
            <ConsentSuccessPage />
          </Suspense>
        </ProtectedRoute>
      </AppAccountLayout>
    </AuthProvider>
  );
}

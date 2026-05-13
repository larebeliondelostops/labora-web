import type { ReactNode } from "react";

import { AppAccountLayout } from "@/components/auth/AppAccountLayout";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CasesConsentGuard } from "@/src/modules/cases/components/CasesConsentGuard";

export function CasesAppFrame({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppAccountLayout>
        <ProtectedRoute>
          <CasesConsentGuard>{children}</CasesConsentGuard>
        </ProtectedRoute>
      </AppAccountLayout>
    </AuthProvider>
  );
}

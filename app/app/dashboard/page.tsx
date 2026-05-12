import type { Metadata } from "next";
import Link from "next/link";

import { AppAccountLayout } from "@/components/auth/AppAccountLayout";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Dashboard de cuenta",
  description: "Entrada privada de Labora despues de iniciar sesion.",
};

export default function AppDashboardPage() {
  return (
    <AuthProvider>
      <AppAccountLayout>
        <ProtectedRoute>
          <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
              Labora
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
              Continua tu flujo
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-labora-gray">
              Desde aqui puedes revisar tu perfil, confirmar seguridad o continuar hacia
              consentimientos y expediente.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/consentimientos"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white hover:bg-labora-deep"
              >
                Continuar a consentimientos
              </Link>
              <Link
                href="/app/perfil"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
              >
                Ver perfil
              </Link>
            </div>
          </section>
        </ProtectedRoute>
      </AppAccountLayout>
    </AuthProvider>
  );
}

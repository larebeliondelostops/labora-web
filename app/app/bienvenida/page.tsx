import type { Metadata } from "next";
import Link from "next/link";

import { AppAccountLayout } from "@/components/auth/AppAccountLayout";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Bienvenida",
  description: "Primer paso despues de verificar tu cuenta en Labora.",
};

export default function BienvenidaPage() {
  return (
    <AuthProvider>
      <AppAccountLayout>
        <ProtectedRoute>
          <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
              Bienvenida
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
              Tu cuenta ya esta lista
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-labora-gray">
              El siguiente paso es revisar y aceptar los consentimientos antes de crear un
              expediente.
            </p>
            <Link
              href="/consentimientos"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white hover:bg-labora-deep"
            >
              Ir a consentimientos
            </Link>
          </section>
        </ProtectedRoute>
      </AppAccountLayout>
    </AuthProvider>
  );
}

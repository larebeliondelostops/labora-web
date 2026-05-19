import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  sideTitle?: string;
  sideDescription?: string;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  sideTitle = "Tu expediente empieza con una cuenta segura",
  sideDescription = "Labora separa el contacto publico del flujo privado de datos sensibles. Despues del registro podras aceptar consentimientos y crear tu expediente.",
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-labora-ivory px-5 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-[calc(100vw-2.5rem)] max-w-6xl min-w-0 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="box-border w-full max-w-full min-w-0 rounded-2xl border border-labora-ui bg-white p-6 shadow-panel lg:p-8">
          <Logo />
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
            Cuenta Labora
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-labora-charcoal sm:text-4xl">
            {sideTitle}
          </h1>
          <p className="mt-4 text-sm leading-6 text-labora-gray">{sideDescription}</p>
          <div className="mt-6 grid gap-3 text-sm text-labora-gray">
            <div className="rounded-lg bg-labora-ivory p-4">
              No subas documentos en estas pantallas de cuenta.
            </div>
            <div className="rounded-lg bg-labora-ivory p-4">
              Usamos cookies HttpOnly cuando el backend crea la sesion.
            </div>
            <div className="rounded-lg bg-labora-ivory p-4">
              El siguiente paso natural es aceptar consentimientos.
            </div>
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex text-sm font-semibold text-labora-deep underline"
          >
            Volver al inicio
          </Link>
        </section>

        <section className="box-border w-full max-w-full min-w-0 rounded-2xl border border-labora-ui bg-white p-6 shadow-panel lg:p-8">
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-semibold text-labora-charcoal">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">{subtitle}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

export function CenteredAuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-labora-ivory px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-[calc(100vw-2.5rem)] max-w-md min-w-0 flex-col justify-center">
        <div className="mb-6">
          <Logo />
        </div>
        <section className="box-border w-full max-w-full min-w-0 rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
          <h1 className="font-heading text-2xl font-semibold text-labora-charcoal">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-labora-gray">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}

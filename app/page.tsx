import Link from "next/link";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Card } from "@/components/ui/card";

const highlights = [
  "Reconstruccion de historia laboral",
  "Deteccion temprana de inconsistencias",
  "Informe tecnico listo para revisar",
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="rounded-full bg-labora-mint/40 px-4 py-2 text-sm text-labora-deep">
              Legal-tech clara, humana y profesional
            </span>
            <h1 className="mt-6 max-w-3xl font-heading text-5xl font-semibold tracking-tight text-labora-charcoal">
              Analiza tu historia laboral con una ruta guiada y entendible.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-labora-gray">
              Labora organiza documentos, estructura hallazgos y te ayuda a entender
              si hay inconsistencias pensionales o laborales sin abrumarte.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/auth/register"
                className="rounded-full bg-labora-green px-6 py-3 font-medium text-white"
              >
                Iniciar analisis
              </Link>
              <Link
                href="/cases/new"
                className="rounded-full border border-labora-ui bg-white px-6 py-3 font-medium text-labora-deep"
              >
                Ver flujo MVP
              </Link>
            </div>
          </div>
          <Card className="bg-gradient-to-br from-white to-labora-ivory">
            <div className="text-sm uppercase tracking-[0.3em] text-labora-gray">
              Como funciona
            </div>
            <div className="mt-4 space-y-4">
              {highlights.map((item, index) => (
                <div key={item} className="rounded-2xl bg-white p-4">
                  <div className="text-sm text-labora-gray">Paso 0{index + 1}</div>
                  <div className="mt-1 font-medium text-labora-charcoal">{item}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            "Documentos compatibles: historia laboral, cedula, certificaciones y resoluciones.",
            "Precio de referencia visible antes del pago para evitar sorpresas.",
            "El resultado asistido por tecnologia puede requerir revision profesional.",
          ].map((text) => (
            <Card key={text} className="text-sm text-labora-gray">
              {text}
            </Card>
          ))}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

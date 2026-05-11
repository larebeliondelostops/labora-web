import type { Metadata } from "next";

import { LockKeyhole, ShieldCheck, UserCheck } from "lucide-react";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { FinalCTA, PageIntro } from "@/components/public/ConversionBlocks";
import { AITransparencyBanner, SecurityChecklist } from "@/components/public/NoticeBlocks";
import { PageContainer, Section, SectionHeader } from "@/components/public/Page";
import { trustItems } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Privacidad y confianza",
  description:
    "Conoce como Labora separa el contacto publico del tratamiento de datos sensibles dentro del expediente seguro.",
};

const principles = [
  {
    title: "Datos minimos en publico",
    description:
      "La landing solo solicita datos de contacto. No pedimos historia laboral, salarios ni soportes en formularios publicos.",
    icon: ShieldCheck,
  },
  {
    title: "Consentimiento antes de tratar datos sensibles",
    description:
      "La carga documental y el analisis se realizan dentro del expediente, despues de aceptar las autorizaciones.",
    icon: LockKeyhole,
  },
  {
    title: "Revision humana cuando aplique",
    description:
      "La IA asistida acelera organizacion y lectura, pero no reemplaza una revision juridica profesional.",
    icon: UserCheck,
  },
];

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <main>
        <PageIntro
          eyebrow="Confianza"
          title="Tus datos sensibles no empiezan en la landing"
          description="El contacto publico es deliberadamente simple. El expediente seguro es el lugar para documentos, autorizaciones y analisis."
          image="/showcase/landing-overview.jpeg"
        />

        <PageContainer>
          <Section>
            <SectionHeader
              eyebrow="Principios"
              title="Privacidad clara antes de convertir"
              description="Labora separa la conversion publica del flujo privado de expediente para reducir riesgos y expectativas incorrectas."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {principles.map((principle) => (
                <article
                  key={principle.title}
                  className="rounded-lg border border-labora-ui bg-white p-5"
                >
                  <principle.icon className="h-6 w-6 text-labora-green" aria-hidden="true" />
                  <h2 className="mt-4 font-heading text-lg font-semibold text-labora-charcoal">
                    {principle.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-labora-gray">
                    {principle.description}
                  </p>
                </article>
              ))}
            </div>
          </Section>

          <Section className="border-t border-labora-ui">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <SectionHeader
                eyebrow="Seguridad"
                title="Checklist de confianza"
                description="Estos puntos deben mantenerse tambien en produccion y en el backend."
              />
              <SecurityChecklist items={trustItems} />
            </div>
          </Section>

          <Section className="border-t border-labora-ui">
            <AITransparencyBanner />
          </Section>
        </PageContainer>

        <FinalCTA title="Crea un expediente para revisar tu caso concreto" />
      </main>
      <PublicFooter />
    </div>
  );
}

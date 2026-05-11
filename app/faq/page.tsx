import type { Metadata } from "next";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { CtaLink } from "@/components/public/Buttons";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { PageContainer, Section, SectionHeader } from "@/components/public/Page";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Resuelve dudas sobre servicio, documentos, IA, privacidad, precio y proceso de Labora.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <main>
        <PageContainer className="py-14">
          <SectionHeader
            eyebrow="FAQ"
            title="Preguntas frecuentes"
            description="Filtra por tema o busca una duda especifica. Si no encuentras respuesta, puedes escribirnos sin enviar datos sensibles."
          />
          <div className="mt-8">
            <FaqAccordion />
          </div>
        </PageContainer>

        <Section className="bg-labora-deep text-white">
          <PageContainer className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="font-heading text-3xl font-semibold">Necesitas mas claridad?</h2>
              <p className="mt-2 text-sm leading-6 text-white/78">
                Dejanos tus datos de contacto. No adjuntes documentos en la landing publica.
              </p>
            </div>
            <CtaLink href="/contacto" variant="secondary" eventLabel="faq_contacto">
              Contactar
            </CtaLink>
          </PageContainer>
        </Section>
      </main>
      <PublicFooter />
    </div>
  );
}

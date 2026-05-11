import type { Metadata } from "next";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { CtaLink } from "@/components/public/Buttons";
import { FinalCTA, ScopeList } from "@/components/public/ConversionBlocks";
import { LegalNotice } from "@/components/public/NoticeBlocks";
import { PageContainer, Section, SectionHeader } from "@/components/public/Page";
import { pricingIncluded, pricingNotIncluded } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Precios y alcance",
  description:
    "Conoce que incluye Labora y por que el pago ocurre despues del preanalisis y la vista previa bloqueada.",
};

export default function PreciosPage() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <main>
        <section className="border-b border-labora-ui bg-white">
          <PageContainer className="py-14">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <SectionHeader
                eyebrow="Alcance comercial"
                title="Inicia sin pagar de inmediato"
                description="Puedes crear un caso y recibir una orientacion preliminar. El pago ocurre despues del preanalisis y de una vista previa bloqueada."
              />
              <article className="rounded-lg border border-labora-ui bg-labora-ivory p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
                  Pago al final
                </p>
                <p className="mt-4 font-heading text-3xl font-semibold text-labora-charcoal">
                  El analisis completo se desbloquea cuando decides avanzar.
                </p>
                <p className="mt-4 text-sm leading-6 text-labora-gray">
                  Labora no promete resultado favorable, demanda automatica ni asesoria
                  personalizada desde la landing publica.
                </p>
                <div className="mt-6">
                  <CtaLink href="/iniciar" eventLabel="pricing_iniciar">
                    Iniciar analisis
                  </CtaLink>
                </div>
              </article>
            </div>
          </PageContainer>
        </section>

        <PageContainer>
          <Section>
            <div className="grid gap-4 lg:grid-cols-2">
              <ScopeList title="Incluye" items={pricingIncluded} />
              <ScopeList title="No incluye" items={pricingNotIncluded} />
            </div>
          </Section>

          <Section className="border-t border-labora-ui">
            <LegalNotice />
          </Section>
        </PageContainer>

        <FinalCTA title="Revisa primero, paga despues de la vista previa" />
      </main>
      <PublicFooter />
    </div>
  );
}

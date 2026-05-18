import type { Metadata } from "next";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { CtaLink } from "@/components/public/Buttons";
import { FinalCTA, ScopeList } from "@/components/public/ConversionBlocks";
import { LegalNotice } from "@/components/public/NoticeBlocks";
import { PageContainer, Section, SectionHeader } from "@/components/public/Page";
import { landingCopy, pricingIncluded, pricingNotIncluded } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Precios y alcance",
  description:
    "Conoce qué incluye Labora y cómo verás el valor del servicio antes de pagar.",
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
                eyebrow="Precio"
                title={landingCopy.price.title}
                description={landingCopy.price.description}
              />
              <article className="rounded-lg border border-labora-ui bg-labora-ivory p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
                  Sin sorpresas
                </p>
                <p className="mt-4 font-heading text-3xl font-semibold text-labora-charcoal">
                  Decides avanzar cuando entiendas el valor y el alcance.
                </p>
                <p className="mt-4 text-sm leading-6 text-labora-gray">
                  Labora no promete resultado favorable, demanda automática ni asesoría
                  personalizada desde la landing pública.
                </p>
                <div className="mt-6">
                  <CtaLink href="/iniciar" eventLabel="pricing_iniciar">
                    {landingCopy.hero.primaryCta}
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

        <FinalCTA title="Revisa primero y decide con tranquilidad" />
      </main>
      <PublicFooter />
    </div>
  );
}

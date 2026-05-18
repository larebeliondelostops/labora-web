import type { Metadata } from "next";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import {
  FinalCTA,
  PageIntro,
} from "@/components/public/ConversionBlocks";
import {
  HomeDynamicSections,
  HomeHero,
  HomeProcessPreview,
  HomeServicePreview,
} from "@/components/public/HomePublicContent";
import {
  AITransparencyBanner,
  HumanReviewCallout,
  LegalNotice,
  SecurityChecklist,
} from "@/components/public/NoticeBlocks";
import { PageContainer, Section, SectionHeader } from "@/components/public/Page";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { landingCopy, trustItems } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Revisión de historia laboral clara y sencilla",
  description:
    "Revisa tu historia laboral, entiende posibles errores y avanza con información clara antes de pagar.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <main>
        <HomeHero />

        <PageContainer>
          <Section>
            <SectionHeader
              eyebrow="Claridad"
              title="Antes de empezar, todo claro"
              description="Sabes qué documentos puedes usar, cómo se presenta el precio y cuándo puede ser recomendable una revisión profesional."
            />
            <div className="mt-8">
              <HomeDynamicSections />
            </div>
          </Section>

          <Section id="como-funciona" className="scroll-mt-24 border-t border-labora-ui">
            <SectionHeader
              eyebrow="Paso a paso"
              title={landingCopy.howItWorks.title}
              description={landingCopy.howItWorks.description}
            />
            <div className="mt-8">
              <HomeProcessPreview />
            </div>
          </Section>

          <Section className="border-t border-labora-ui">
            <SectionHeader
              eyebrow="Casos de uso"
              title="Pensado para revisiones laborales y pensionales"
              description="No prometemos un resultado favorable. Te damos una ruta clara para revisar información y decidir el siguiente paso."
            />
            <div className="mt-8">
              <HomeServicePreview />
            </div>
          </Section>
        </PageContainer>

        <PageIntro
          eyebrow="Acompañamiento"
          title="Tu información en orden antes de tomar decisiones"
          description="Dentro de tu expediente puedes cargar documentos, seguir el avance y revisar resultados con una estructura clara."
          image="/showcase/analysis-results.jpeg"
        />

        <PageContainer>
          <Section>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <SectionHeader
                eyebrow="Confianza"
                title="Privacidad y trazabilidad desde el primer contacto"
                description="No subas documentos ni información sensible en formularios públicos. La carga documental se realiza dentro del expediente seguro."
              />
              <SecurityChecklist items={trustItems} />
            </div>
          </Section>

          <Section className="border-t border-labora-ui">
            <div className="grid gap-4 lg:grid-cols-3">
              <LegalNotice />
              <AITransparencyBanner />
              <HumanReviewCallout />
            </div>
          </Section>

          <Section className="border-t border-labora-ui">
            <SectionHeader
              eyebrow="FAQ"
              title="Preguntas frecuentes"
              description="Respuestas rápidas antes de crear tu expediente."
            />
            <div className="mt-8">
              <FaqAccordion compact />
            </div>
          </Section>
        </PageContainer>

        <FinalCTA />
      </main>
      <PublicFooter />
    </div>
  );
}

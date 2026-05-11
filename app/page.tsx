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
import { trustItems } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Analisis de historia laboral y pensional",
  description:
    "Revisa tu historia laboral, identifica posibles inconsistencias y accede a un analisis tecnico-juridico asistido.",
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
              eyebrow="Beneficios"
              title="Menos incertidumbre antes de avanzar"
              description="Labora combina flujo guiado, organizacion documental y advertencias claras sobre el alcance del analisis."
            />
            <div className="mt-8">
              <HomeDynamicSections />
            </div>
          </Section>

          <Section className="border-t border-labora-ui">
            <SectionHeader
              eyebrow="Como funciona"
              title="Del registro al informe, con pago al final"
              description="Primero entiendes el proceso y recibes una orientacion preliminar. El analisis completo se desbloquea despues de la vista previa."
            />
            <div className="mt-8">
              <HomeProcessPreview />
            </div>
          </Section>

          <Section className="border-t border-labora-ui">
            <SectionHeader
              eyebrow="Casos de uso"
              title="Pensado para expedientes laborales y pensionales"
              description="No prometemos un resultado favorable. Te damos una ruta clara para revisar informacion y decidir el siguiente paso."
            />
            <div className="mt-8">
              <HomeServicePreview />
            </div>
          </Section>
        </PageContainer>

        <PageIntro
          eyebrow="Producto"
          title="Una experiencia responsive para revisar, validar y avanzar"
          description="La interfaz esta pensada para escritorio y movil: carga de documentos, seguimiento de progreso, resultados e informes se organizan dentro del expediente."
          image="/showcase/analysis-results.jpeg"
        />

        <PageContainer>
          <Section>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <SectionHeader
                eyebrow="Confianza"
                title="Privacidad y trazabilidad desde el primer contacto"
                description="No subas documentos ni informacion sensible en formularios publicos. La carga documental se realiza dentro del expediente seguro."
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
              description="Respuestas rapidas antes de crear tu expediente."
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

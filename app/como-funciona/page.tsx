import type { Metadata } from "next";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { FinalCTA, PageIntro, ProcessTimeline } from "@/components/public/ConversionBlocks";
import { AITransparencyBanner, HumanReviewCallout } from "@/components/public/NoticeBlocks";
import { PageContainer, Section, SectionHeader } from "@/components/public/Page";
import { landingCopy, processSteps } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description:
    "Conoce cómo Labora ordena tu historia laboral, revisa posibles errores y entrega un informe fácil de revisar.",
};

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <main>
        <PageIntro
          eyebrow="Proceso"
          title={landingCopy.howItWorks.title}
          description={landingCopy.howItWorks.description}
          image="/showcase/documents-ocr.jpeg"
        />

        <PageContainer>
          <Section>
            <SectionHeader
              eyebrow="Pasos"
              title="Revisión en tres pasos"
              description="La pantalla pública explica el proceso sin pedir documentos sensibles antes del consentimiento."
            />
            <div className="mt-8">
              <ProcessTimeline steps={processSteps} />
            </div>
          </Section>

          <Section className="border-t border-labora-ui">
            <div className="grid gap-4 lg:grid-cols-2">
              <AITransparencyBanner />
              <HumanReviewCallout />
            </div>
          </Section>
        </PageContainer>

        <FinalCTA
          title="Abre tu expediente cuando entiendas el recorrido"
          description="El botón principal te lleva a crear cuenta o continuar tu expediente."
        />
      </main>
      <PublicFooter />
    </div>
  );
}

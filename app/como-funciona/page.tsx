import type { Metadata } from "next";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { FinalCTA, PageIntro, ProcessTimeline } from "@/components/public/ConversionBlocks";
import { AITransparencyBanner, HumanReviewCallout } from "@/components/public/NoticeBlocks";
import { PageContainer, Section, SectionHeader } from "@/components/public/Page";
import { processSteps } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Como funciona",
  description:
    "Conoce el flujo de Labora: registro, consentimiento, expediente, documentos, preanalisis, pago al final e informe.",
};

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <main>
        <PageIntro
          eyebrow="Proceso"
          title="Un recorrido guiado, sin checkout directo desde la landing"
          description="Labora sigue un flujo con pago al final: primero creas expediente, cargas documentos en privado y recibes una orientacion preliminar."
          image="/showcase/documents-ocr.jpeg"
        />

        <PageContainer>
          <Section>
            <SectionHeader
              eyebrow="Pasos"
              title="Del registro a la entrega final"
              description="Cada etapa protege el alcance del servicio y evita pedir informacion sensible antes del consentimiento."
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
          title="Abre tu expediente solo cuando entiendas el recorrido"
          description="El CTA principal te lleva a crear cuenta o continuar el expediente, no a pagar de inmediato."
        />
      </main>
      <PublicFooter />
    </div>
  );
}

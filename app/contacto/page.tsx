import type { Metadata } from "next";

import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { LeadForm } from "@/components/public/LeadForm";
import { AITransparencyBanner } from "@/components/public/NoticeBlocks";
import { PageContainer, Section, SectionHeader } from "@/components/public/Page";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta a Labora sin enviar documentos ni informacion sensible desde el formulario publico.",
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <main>
        <PageContainer className="py-14">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="space-y-5">
              <SectionHeader
                eyebrow="Contacto"
                title="Cuentanos como podemos orientarte"
                description="Este formulario es solo para contacto comercial. No incluyas documentos, historia laboral, salarios ni informacion sensible."
              />
              <AITransparencyBanner />
            </div>
            <LeadForm />
          </div>
        </PageContainer>

        <Section className="border-t border-labora-ui">
          <PageContainer>
            <p className="max-w-3xl text-sm leading-6 text-labora-gray">
              Para revisar tu caso concreto debes crear un expediente y aceptar las
              autorizaciones correspondientes. La carga documental se realiza dentro del
              expediente seguro.
            </p>
          </PageContainer>
        </Section>
      </main>
      <PublicFooter />
    </div>
  );
}

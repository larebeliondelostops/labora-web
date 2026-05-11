"use client";

import { useEffect, useState } from "react";

import { CtaLink } from "@/components/public/Buttons";
import { BenefitGrid, ProcessTimeline, ServiceCards } from "@/components/public/ConversionBlocks";
import { LoadingSkeleton } from "@/components/public/StateBlocks";
import { getPublicHome, trackPublicEvent, type PublicHomeContent } from "@/lib/public-api";
import { benefits, primaryCta, processSteps, secondaryCta, serviceCards } from "@/lib/public-content";

const fallbackHome: Required<PublicHomeContent> = {
  hero: {
    eyebrow: "Legal-tech clara, humana y profesional",
    title: "Revisa tu historia laboral y entiende si puede haber errores pensionales",
    subtitle:
      "Labora te guia para cargar tus documentos, recibir una orientacion preliminar y acceder a un analisis tecnico-juridico cuando estes listo.",
  },
  benefits: benefits.map(({ title, description }) => ({ title, description })),
  legalNotice:
    "Labora usa herramientas de IA asistida y reglas verificables. La informacion inicial no reemplaza una revision juridica profesional ni constituye asesoria personalizada sin expediente.",
};

export function useHomeContent({ trackView = false }: { trackView?: boolean } = {}) {
  const [content, setContent] = useState<Required<PublicHomeContent>>(fallbackHome);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (trackView) {
      trackPublicEvent("landing_publica.viewed", { page: "home" });
    }

    getPublicHome()
      .then((remoteContent) => {
        if (!isMounted) {
          return;
        }

        setContent({
          hero: {
            ...fallbackHome.hero,
            ...remoteContent.hero,
          },
          benefits: remoteContent.benefits?.length
            ? remoteContent.benefits
            : fallbackHome.benefits,
          legalNotice: remoteContent.legalNotice || fallbackHome.legalNotice,
        });
      })
      .catch(() => {
        trackPublicEvent("landing_publica.failed", {
          page: "home",
          reason: "public_home_fetch",
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [trackView]);

  return { content, isLoading };
}

export function HomeDynamicSections() {
  const { content, isLoading } = useHomeContent();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const benefitItems = content.benefits.map((item, index) => ({
    ...item,
    icon: benefits[index]?.icon || benefits[0].icon,
  }));

  return <BenefitGrid items={benefitItems} />;
}

export function HomeHero() {
  const { content, isLoading } = useHomeContent({ trackView: true });

  return (
    <section
      className="relative flex min-h-[78svh] items-center overflow-hidden border-b border-labora-ui bg-labora-charcoal"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(246,247,242,0.95) 0%, rgba(246,247,242,0.86) 38%, rgba(246,247,242,0.34) 68%, rgba(246,247,242,0.1) 100%), url('/showcase/landing-overview.jpeg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
            {content.hero.eyebrow}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-normal text-labora-charcoal sm:text-5xl lg:text-6xl">
            {content.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-labora-gray sm:text-lg">
            {content.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink href={primaryCta.href} className="w-full sm:w-auto" eventLabel="hero_iniciar">
              {primaryCta.label}
            </CtaLink>
            <CtaLink
              href={secondaryCta.href}
              variant="secondary"
              className="w-full sm:w-auto"
              eventLabel="hero_como_funciona"
            >
              {secondaryCta.label}
            </CtaLink>
          </div>
          <p className="mt-6 rounded-lg border border-labora-ui bg-white/82 p-4 text-xs leading-5 text-labora-gray backdrop-blur">
            {isLoading ? "Cargando contenido publico. " : ""}
            {content.legalNotice}
          </p>
        </div>
      </div>
    </section>
  );
}

export function HomeProcessPreview() {
  return <ProcessTimeline steps={processSteps.slice(0, 5)} compact />;
}

export function HomeServicePreview() {
  return <ServiceCards items={serviceCards} />;
}

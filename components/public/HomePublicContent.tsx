"use client";

import { useEffect } from "react";

import { CtaLink } from "@/components/public/Buttons";
import { BenefitGrid, ProcessTimeline, ServiceCards } from "@/components/public/ConversionBlocks";
import { trackPublicEvent, type PublicHomeContent } from "@/lib/public-api";
import {
  benefits,
  landingCopy,
  primaryCta,
  processSteps,
  secondaryCta,
  serviceCards,
} from "@/lib/public-content";

const homeContent: Required<PublicHomeContent> = {
  hero: {
    eyebrow: landingCopy.hero.eyebrow,
    title: landingCopy.hero.title,
    subtitle: landingCopy.hero.subtitle,
  },
  benefits: benefits.map(({ title, description }) => ({ title, description })),
  legalNotice: landingCopy.importantNotice.description,
};

export function useHomeContent({ trackView = false }: { trackView?: boolean } = {}) {
  useEffect(() => {
    if (trackView) {
      trackPublicEvent("landing_publica.viewed", { page: "home" });
    }
  }, [trackView]);

  return { content: homeContent, isLoading: false };
}

export function HomeDynamicSections() {
  const { content } = useHomeContent();

  const benefitItems = content.benefits.map((item, index) => ({
    ...item,
    icon: benefits[index]?.icon || benefits[0].icon,
  }));

  return <BenefitGrid items={benefitItems} />;
}

export function HomeHero() {
  const { content } = useHomeContent({ trackView: true });

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
          <div className="mt-5 max-w-xl space-y-3 text-sm leading-6 text-labora-charcoal sm:text-base">
            {landingCopy.serviceDescription.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaLink
              href={primaryCta.href}
              className="w-full sm:w-auto"
              eventLabel="landing_cta_primary_clicked"
            >
              {primaryCta.label}
            </CtaLink>
            <CtaLink
              href={secondaryCta.href}
              variant="secondary"
              className="w-full sm:w-auto"
              eventLabel="landing_how_it_works_clicked"
            >
              {secondaryCta.label}
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeProcessPreview() {
  return <ProcessTimeline steps={processSteps} compact />;
}

export function HomeServicePreview() {
  return <ServiceCards items={serviceCards} />;
}

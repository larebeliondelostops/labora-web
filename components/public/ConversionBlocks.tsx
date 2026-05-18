import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

import { CtaLink } from "@/components/public/Buttons";
import { SectionHeader } from "@/components/public/Page";
import { primaryCta, secondaryCta } from "@/lib/public-content";
import { cn } from "@/lib/utils";

interface CardItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function BenefitGrid({ items }: { items: CardItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <article key={item.title} className="rounded-lg border border-labora-ui bg-white p-5">
          <item.icon className="h-6 w-6 text-labora-green" aria-hidden="true" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-labora-charcoal">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-labora-gray">{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export function ServiceCards({ items }: { items: CardItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article key={item.title} className="rounded-lg border border-labora-ui bg-white p-5">
          <item.icon className="h-6 w-6 text-labora-deep" aria-hidden="true" />
          <h3 className="mt-4 font-heading text-base font-semibold text-labora-charcoal">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-labora-gray">{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export function ProcessTimeline({
  steps,
  compact = false,
}: {
  steps: CardItem[];
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-4", compact ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-3")}>
      {steps.map((step, index) => (
        <article key={step.title} className="rounded-lg border border-labora-ui bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-labora-ivory text-sm font-semibold text-labora-deep">
              {index + 1}
            </span>
            <step.icon className="h-5 w-5 text-labora-green" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-labora-charcoal">
            {step.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-labora-gray">{step.description}</p>
        </article>
      ))}
    </div>
  );
}

export function FinalCTA({
  title = "Empieza con una revisión clara antes de pagar",
  description = "Crea tu cuenta, acepta los consentimientos y abre tu expediente cuando estés listo.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="bg-labora-deep py-14 text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="font-heading text-3xl font-semibold tracking-normal">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <CtaLink href={primaryCta.href} eventLabel="landing_cta_primary_clicked">
            {primaryCta.label}
          </CtaLink>
          <CtaLink
            href={secondaryCta.href}
            variant="secondary"
            eventLabel="landing_how_it_works_clicked"
          >
            {secondaryCta.label}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

export function ScopeList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-lg border border-labora-ui bg-white p-6">
      <h3 className="font-heading text-xl font-semibold text-labora-charcoal">{title}</h3>
      <ul className="mt-5 grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-labora-gray">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-labora-green" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  image,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
}) {
  return (
    <section className="border-b border-labora-ui bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />
        {image ? (
          <img
            src={image}
            alt=""
            className="aspect-[16/9] w-full rounded-lg border border-labora-ui object-cover shadow-panel"
            loading="lazy"
          />
        ) : null}
      </div>
    </section>
  );
}

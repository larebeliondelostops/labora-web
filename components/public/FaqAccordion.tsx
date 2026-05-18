"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/public/StateBlocks";
import { getPublicFaqs, trackPublicEvent, type PublicFaq } from "@/lib/public-api";
import { faqCategories, faqItems } from "@/lib/public-content";
import { cn } from "@/lib/utils";

export function FaqAccordion({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<PublicFaq[]>(faqItems);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [query, setQuery] = useState("");
  const [openQuestion, setOpenQuestion] = useState<string | null>(faqItems[0]?.question || null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getPublicFaqs(compact ? "todos" : activeCategory)
      .then((remoteItems) => {
        if (isMounted && remoteItems.length) {
          setItems(remoteItems);
          setHasError(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory, compact]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => compact || activeCategory === "todos" || item.category === activeCategory)
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        return `${item.question} ${item.answer}`.toLowerCase().includes(normalizedQuery);
      })
      .slice(0, compact ? 4 : undefined);
  }, [activeCategory, compact, items, query]);

  return (
    <div className="space-y-5">
      {!compact ? (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
            {faqCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  trackPublicEvent("landing_publica.cta_clicked", {
                    label: "faq_category",
                    category,
                  });
                }}
                className={cn(
                  "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-semibold transition",
                  activeCategory === category
                    ? "border-labora-green bg-labora-green text-white"
                    : "border-labora-ui bg-white text-labora-gray hover:bg-labora-ivory",
                )}
              >
                {category}
              </button>
            ))}
          </div>
          <label className="relative block">
            <span className="sr-only">Buscar pregunta</span>
            <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-labora-gray" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por tema, documento o IA"
              className="h-11 w-full rounded-lg border border-labora-ui bg-white pl-10 pr-4 text-sm outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-mint"
            />
          </label>
        </div>
      ) : null}

      {hasError ? (
        <ErrorState message="No pudimos cargar las preguntas desde el backend. Te mostramos respuestas base mientras tanto." />
      ) : null}

      {isLoading ? <LoadingSkeleton /> : null}

      {!isLoading && filteredItems.length === 0 ? (
        <EmptyState message="No encontramos preguntas con ese filtro. Prueba otra búsqueda o escríbenos." />
      ) : null}

      <div className="grid gap-3">
        {filteredItems.map((item) => {
          const isOpen = openQuestion === item.question;

          return (
            <article key={item.question} className="rounded-lg border border-labora-ui bg-white">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpenQuestion(isOpen ? null : item.question)}
              >
                <span className="font-heading text-base font-semibold text-labora-charcoal">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn("h-5 w-5 flex-none text-labora-gray transition", isOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
              {isOpen ? (
                <p className="border-t border-labora-ui px-5 py-4 text-sm leading-6 text-labora-gray">
                  {item.answer}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

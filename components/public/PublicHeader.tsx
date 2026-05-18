"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { CtaLink } from "@/components/public/Buttons";
import { landingCopy } from "@/lib/public-content";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/precios", label: "Precios" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/faq", label: "FAQ" },
  { href: "/contacto", label: "Contacto" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-labora-ui bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Logo />
          <p className="hidden max-w-56 text-xs leading-5 text-labora-gray xl:block">
            {landingCopy.header.support}
          </p>
        </div>

        <nav className="hidden items-center gap-1 text-sm text-labora-gray lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 transition hover:bg-labora-ivory hover:text-labora-deep",
                pathname === item.href && "bg-labora-ivory text-labora-deep",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="text-sm font-semibold text-labora-deep">
            {landingCopy.header.loginCta}
          </Link>
          <CtaLink href="/iniciar" eventLabel="header_iniciar">
            {landingCopy.header.primaryCta}
          </CtaLink>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui bg-white text-labora-deep lg:hidden"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-labora-ui bg-white px-5 py-4 lg:hidden">
          <nav className="grid gap-2 text-sm text-labora-gray">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-3 hover:bg-labora-ivory"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-3 font-semibold text-labora-deep hover:bg-labora-ivory"
            >
              {landingCopy.header.loginCta}
            </Link>
            <CtaLink
              href="/iniciar"
              className="mt-2 w-full"
              eventLabel="mobile_header_iniciar"
            >
              {landingCopy.header.primaryCta}
            </CtaLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

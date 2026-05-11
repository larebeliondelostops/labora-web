"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { CtaLink } from "@/components/public/Buttons";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/como-funciona", label: "Como funciona" },
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
        <Logo />

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
          <Link href="/auth/login" className="text-sm font-semibold text-labora-deep">
            Ingresar
          </Link>
          <CtaLink href="/iniciar" eventLabel="header_iniciar">
            Iniciar
          </CtaLink>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui bg-white text-labora-deep lg:hidden"
          aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
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
              href="/auth/login"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-3 font-semibold text-labora-deep hover:bg-labora-ivory"
            >
              Ingresar
            </Link>
            <CtaLink
              href="/iniciar"
              className="mt-2 w-full"
              eventLabel="mobile_header_iniciar"
            >
              Iniciar analisis
            </CtaLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

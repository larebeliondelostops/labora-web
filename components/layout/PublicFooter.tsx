import Link from "next/link";

import { Logo } from "@/components/brand/Logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-labora-ui bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <Logo href="/" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-labora-gray">
            Analisis asistido por tecnologia. Algunos resultados pueden requerir
            revision profesional.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-labora-charcoal">Producto</h2>
          <nav className="mt-3 grid gap-2 text-sm text-labora-gray">
            <Link href="/como-funciona">Como funciona</Link>
            <Link href="/precios">Precios</Link>
            <Link href="/faq">FAQ</Link>
          </nav>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-labora-charcoal">Confianza</h2>
          <nav className="mt-3 grid gap-2 text-sm text-labora-gray">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/contacto">Contacto</Link>
            <Link href="/auth/login">Ingresar</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-labora-ui px-5 py-4 text-center text-xs text-labora-gray">
        Labora no reemplaza una revision juridica profesional personalizada sin expediente.
      </div>
    </footer>
  );
}

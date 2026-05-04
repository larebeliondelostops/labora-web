import Link from "next/link";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-labora-ui/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-heading text-xl font-semibold text-labora-deep">
          Labora
        </Link>
        <nav className="flex items-center gap-4 text-sm text-labora-gray">
          <Link href="/auth/login">Ingresar</Link>
          <Link
            href="/auth/register"
            className="rounded-full bg-labora-green px-4 py-2 text-white"
          >
            Comenzar
          </Link>
        </nav>
      </div>
    </header>
  );
}

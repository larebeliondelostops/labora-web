import Link from "next/link";

import { Card } from "@/components/ui/card";

export default function CasesPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">Mis casos</h1>
        <Link href="/cases/new" className="rounded-full bg-labora-green px-5 py-3 text-white">
          Nuevo caso
        </Link>
      </div>
      <Card className="text-labora-gray">Listado inicial del MVP listo para conectar con API.</Card>
    </main>
  );
}

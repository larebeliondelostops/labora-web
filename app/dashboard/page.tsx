import Link from "next/link";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AppSidebar />
        <div className="space-y-6">
          <AppHeader />
          <Card>
            <h1 className="font-heading text-2xl font-semibold text-labora-deep">Bienvenida</h1>
            <p className="mt-2 text-labora-gray">
              Todavia no tienes casos. Crea tu primer analisis de historia laboral.
            </p>
            <Link
              href="/cases/new"
              className="mt-6 inline-flex rounded-full bg-labora-green px-5 py-3 text-white"
            >
              Crear nuevo caso
            </Link>
          </Card>
        </div>
      </div>
    </main>
  );
}

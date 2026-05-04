import { Card } from "@/components/ui/card";

export default function ProgressPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Card>
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">
          Progreso del analisis
        </h1>
        <p className="mt-2 text-labora-gray">
          Barra de progreso y etapas del proceso listas para datos reales.
        </p>
      </Card>
    </main>
  );
}

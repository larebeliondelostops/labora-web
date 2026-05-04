import { Card } from "@/components/ui/card";

export default function ResultsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Card>
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">
          Resultado ejecutivo
        </h1>
        <p className="mt-2 text-labora-gray">
          Vista pensada para mostrar viabilidad, inconsistencias y siguiente accion recomendada.
        </p>
      </Card>
    </main>
  );
}

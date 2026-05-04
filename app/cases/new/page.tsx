import { Card } from "@/components/ui/card";

export default function NewCasePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Card>
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">Crear expediente</h1>
        <p className="mt-2 text-labora-gray">
          Formulario base para titular, fondo, tipo de situacion y servicio solicitado.
        </p>
      </Card>
    </main>
  );
}

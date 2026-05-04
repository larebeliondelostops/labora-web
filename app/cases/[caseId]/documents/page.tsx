import { Card } from "@/components/ui/card";

export default function DocumentsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Card>
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">Documentos</h1>
        <p className="mt-2 text-labora-gray">
          Pantalla de carga documental con estados y advertencias preparada para integrar upload.
        </p>
      </Card>
    </main>
  );
}

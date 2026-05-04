import { Card } from "@/components/ui/card";

export default function AdminCasesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Card>
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">
          Expedientes administrativos
        </h1>
        <p className="mt-2 text-labora-gray">
          Tabla base del backoffice preparada para filtros y revision.
        </p>
      </Card>
    </main>
  );
}

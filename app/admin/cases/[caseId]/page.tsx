import { Card } from "@/components/ui/card";

export default async function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Card>
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">
          Revision interna {caseId}
        </h1>
        <p className="mt-2 text-labora-gray">
          Espacio reservado para OCR, datos extraidos y decisiones del revisor.
        </p>
      </Card>
    </main>
  );
}

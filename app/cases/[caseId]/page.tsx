import Link from "next/link";

import { Card } from "@/components/ui/card";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const links = [
    ["payment", "Pago"],
    ["documents", "Documentos"],
    ["questionnaire", "Cuestionario"],
    ["progress", "Progreso"],
    ["results", "Resultado"],
    ["report", "Informe"],
    ["legal-actions", "Acciones juridicas"],
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Card>
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">
          Caso {caseId}
        </h1>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {links.map(([segment, label]) => (
            <Link
              key={segment}
              href={`/cases/${caseId}/${segment}`}
              className="rounded-2xl bg-labora-ivory p-4 text-labora-charcoal"
            >
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </main>
  );
}

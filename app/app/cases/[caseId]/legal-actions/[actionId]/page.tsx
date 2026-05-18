import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { LegalActionDetailPage } from "@/src/modules/legal-actions/pages/LegalActionDetailPage";

export const metadata: Metadata = {
  title: "Accion juridica",
  description: "Detalle de accion juridica y borradores asociados.",
};

export default async function AppCaseLegalActionDetailRoute({
  params,
}: {
  params: Promise<{ caseId: string; actionId: string }>;
}) {
  const { caseId, actionId } = await params;

  return (
    <CasesAppFrame>
      <LegalActionDetailPage caseId={caseId} actionId={actionId} />
    </CasesAppFrame>
  );
}

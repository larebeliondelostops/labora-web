import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { ExtractionPage } from "@/src/modules/extraction/pages/ExtractionPage";

export const metadata: Metadata = {
  title: "Extraccion y validacion",
  description: "Revision de datos extraidos del expediente laboral y pensional.",
};

export default async function AppCaseExtractionRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <ExtractionPage caseId={caseId} />
    </CasesAppFrame>
  );
}

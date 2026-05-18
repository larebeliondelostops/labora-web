import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { ReportsHomePage } from "@/src/modules/reports/pages/ReportsHomePage";

export const metadata: Metadata = {
  title: "Informes",
  description: "Informes y exportaciones del expediente.",
};

export default async function AppCaseReportsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <ReportsHomePage caseId={caseId} />
    </CasesAppFrame>
  );
}

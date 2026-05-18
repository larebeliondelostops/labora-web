import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { ReportVersionsPage } from "@/src/modules/reports/pages/ReportVersionsPage";

export const metadata: Metadata = {
  title: "Versiones del informe",
  description: "Historial de versiones del informe del expediente.",
};

export default async function AppCaseReportVersionsRoute({
  params,
}: {
  params: Promise<{ caseId: string; reportId: string }>;
}) {
  const { caseId, reportId } = await params;

  return (
    <CasesAppFrame>
      <ReportVersionsPage caseId={caseId} reportId={reportId} />
    </CasesAppFrame>
  );
}

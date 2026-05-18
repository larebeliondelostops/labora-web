import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { ReportDetailPage } from "@/src/modules/reports/pages/ReportDetailPage";

export const metadata: Metadata = {
  title: "Exportar informe",
  description: "Exportacion PDF o Word del informe.",
};

export default async function AppCaseReportExportRoute({
  params,
}: {
  params: Promise<{ caseId: string; reportId: string }>;
}) {
  const { caseId, reportId } = await params;

  return (
    <CasesAppFrame>
      <ReportDetailPage caseId={caseId} reportId={reportId} startExportOpen />
    </CasesAppFrame>
  );
}

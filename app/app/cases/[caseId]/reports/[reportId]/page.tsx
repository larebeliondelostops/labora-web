import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { ReportDetailPage } from "@/src/modules/reports/pages/ReportDetailPage";

export const metadata: Metadata = {
  title: "Detalle del informe",
  description: "Informe navegable por secciones con trazabilidad y exportaciones.",
};

export default async function AppCaseReportDetailRoute({
  params,
}: {
  params: Promise<{ caseId: string; reportId: string }>;
}) {
  const { caseId, reportId } = await params;

  return (
    <CasesAppFrame>
      <ReportDetailPage caseId={caseId} reportId={reportId} />
    </CasesAppFrame>
  );
}

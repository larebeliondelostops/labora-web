import type { Metadata } from "next";

import { AdminReportReviewPage } from "@/src/modules/reports/pages/AdminReportReviewPage";

export const metadata: Metadata = {
  title: "Revision de informe",
  description: "Revision interna de informes con baja confianza o soporte pendiente.",
};

export default async function AdminReportReviewRoute({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  return <AdminReportReviewPage reportId={reportId} />;
}

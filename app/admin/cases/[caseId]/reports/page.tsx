import type { Metadata } from "next";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ReportsHomePage } from "@/src/modules/reports/pages/ReportsHomePage";

export const metadata: Metadata = {
  title: "Informes del expediente",
  description: "Vista administrativa de informes por expediente.",
};

export default async function AdminCaseReportsRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <ReportsHomePage caseId={caseId} />
      </div>
    </main>
  );
}

import type { Metadata } from "next";

import { AdminCasesPage } from "@/src/modules/admin/pages/AdminCasesPage";

export const metadata: Metadata = {
  title: "Mis asignaciones",
  description: "Cola de trabajo asignada al usuario administrativo.",
};

export default function AdminTasksRoute() {
  return <AdminCasesPage initialFilters={{ assignment: "mine", page: 1, pageSize: 20 }} />;
}

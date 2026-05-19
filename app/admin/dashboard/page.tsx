import type { Metadata } from "next";

import { AdminDashboardPage } from "@/src/modules/admin/pages/AdminDashboardPage";

export const metadata: Metadata = {
  title: "Dashboard administrativo",
  description: "Panel operativo interno de Labora.",
};

export default function AdminDashboardRoute() {
  return <AdminDashboardPage />;
}

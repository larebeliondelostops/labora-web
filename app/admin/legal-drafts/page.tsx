import type { Metadata } from "next";

import { AdminLegalDraftsPage } from "@/src/modules/legal-actions/pages/AdminLegalDraftsPage";

export const metadata: Metadata = {
  title: "Borradores juridicos",
  description: "Backoffice de borradores juridicos generados por Labora.",
};

export default function AdminLegalDraftsRoute() {
  return <AdminLegalDraftsPage />;
}

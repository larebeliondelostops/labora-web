import type { Metadata } from "next";

import { AdminDocumentPrecheckPage } from "@/src/modules/document-precheck/pages/AdminDocumentPrecheckPage";

export const metadata: Metadata = {
  title: "Revision documental",
  description: "Cola administrativa de IA documental preliminar.",
};

export default function AdminDocumentPrecheckRoute() {
  return <AdminDocumentPrecheckPage />;
}

import type { Metadata } from "next";

import { AdminDocumentPrecheckDetailPage } from "@/src/modules/document-precheck/pages/AdminDocumentPrecheckPage";

export const metadata: Metadata = {
  title: "Detalle revision documental",
  description: "Detalle administrativo de revision documental preliminar.",
};

export default async function AdminDocumentPrecheckDetailRoute({
  params,
}: {
  params: Promise<{ precheckId: string }>;
}) {
  const { precheckId } = await params;

  return <AdminDocumentPrecheckDetailPage precheckId={precheckId} />;
}

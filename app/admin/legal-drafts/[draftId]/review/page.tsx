import type { Metadata } from "next";

import { AdminDraftReviewPage } from "@/src/modules/legal-actions/pages/AdminDraftReviewPage";

export const metadata: Metadata = {
  title: "Revision de borrador",
  description: "Revision profesional de un borrador juridico.",
};

export default async function AdminLegalDraftReviewRoute({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;

  return <AdminDraftReviewPage draftId={draftId} />;
}

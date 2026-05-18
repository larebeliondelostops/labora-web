import type { Metadata } from "next";

import { ProfessionalReviewDetailPage } from "@/src/modules/professional-review/pages/ProfessionalReviewDetailPage";

export const metadata: Metadata = {
  title: "Detalle de revision profesional",
  description: "Detalle operativo de revision profesional.",
};

export default async function BackofficeProfessionalReviewDetailRoute({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;

  return <ProfessionalReviewDetailPage reviewId={reviewId} />;
}

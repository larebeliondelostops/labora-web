import { ProfessionalReviewDetailPage } from "@/src/modules/professional-review/pages/ProfessionalReviewDetailPage";

export default async function BackofficeProfessionalReviewApprovalRoute({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;

  return <ProfessionalReviewDetailPage reviewId={reviewId} initialTab="approval" />;
}

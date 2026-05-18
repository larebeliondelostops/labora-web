import { redirect } from "next/navigation";

export default async function AdminProfessionalReviewAliasRoute({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;

  redirect(`/backoffice/professional-reviews/${reviewId}`);
}

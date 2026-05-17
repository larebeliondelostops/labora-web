import { redirect } from "next/navigation";

export default async function AppCasePaymentCheckoutAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/checkout`);
}

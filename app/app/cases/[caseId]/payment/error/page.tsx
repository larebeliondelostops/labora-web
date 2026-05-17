import { redirect } from "next/navigation";

export default async function AppCasePaymentErrorAliasRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  redirect(`/app/cases/${caseId}/checkout`);
}

import { redirect } from "next/navigation";

export default async function AppCasePaymentReceiptAliasRoute({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { caseId } = await params;
  const { orderId } = await searchParams;
  const query = orderId ? `?orderId=${encodeURIComponent(orderId)}` : "";

  redirect(`/app/cases/${caseId}/checkout/receipt${query}`);
}

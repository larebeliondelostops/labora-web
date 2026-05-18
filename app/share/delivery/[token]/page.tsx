import type { Metadata } from "next";

import { SharedDeliveryPage } from "@/src/modules/delivery/pages/SharedDeliveryPage";

export const metadata: Metadata = {
  title: "Expediente compartido",
  description: "Vista de documentos compartidos mediante enlace temporal.",
};

export default async function SharedDeliveryRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <SharedDeliveryPage token={token} />;
}

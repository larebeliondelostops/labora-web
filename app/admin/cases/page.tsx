import type { Metadata } from "next";

import { AdminCasesPage } from "@/src/modules/admin/pages/AdminCasesPage";

export const metadata: Metadata = {
  title: "Cola de expedientes",
  description: "Cola administrativa de expedientes Labora.",
};

export default async function AdminCasesRoute({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const getParam = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return (
    <AdminCasesPage
      initialFilters={{
        query: getParam("query") || getParam("q"),
        adminStatus: getParam("adminStatus"),
        stage: getParam("stage"),
        priority: getParam("priority"),
        paymentStatus: getParam("paymentStatus"),
        documentStatus: getParam("documentStatus"),
      }}
    />
  );
}

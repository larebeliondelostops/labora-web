import { redirect } from "next/navigation";

export default function AdminDocumentPrecheckRoute() {
  redirect("/admin/cases/case-1001/documents");
}

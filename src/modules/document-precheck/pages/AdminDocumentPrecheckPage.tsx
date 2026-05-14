"use client";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import {
  AdminPrecheckDetail,
  AdminPrecheckQueue,
} from "@/src/modules/document-precheck/components/document-precheck-components";

export function AdminDocumentPrecheckPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <AdminPrecheckQueue />
      </div>
    </main>
  );
}

export function AdminDocumentPrecheckDetailPage({
  precheckId,
}: {
  precheckId: string;
}) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <AdminPrecheckDetail precheckId={precheckId} />
      </div>
    </main>
  );
}

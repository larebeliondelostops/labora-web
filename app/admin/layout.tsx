import type { ReactNode } from "react";

import { AdminFrame } from "@/src/modules/admin/components/AdminLayout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}

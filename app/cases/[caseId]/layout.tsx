import type { ReactNode } from "react";

export function generateStaticParams() {
  return [{ caseId: "demo" }];
}

export default function CaseLayout({ children }: { children: ReactNode }) {
  return children;
}

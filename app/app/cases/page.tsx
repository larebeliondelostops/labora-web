import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CasesListPage } from "@/src/modules/cases/pages/CasesListPage";

export const metadata: Metadata = {
  title: "Mis expedientes",
  description: "Consulta y continua tus expedientes digitales en Labora.",
};

export default function AppCasesPage() {
  return (
    <CasesAppFrame>
      <CasesListPage />
    </CasesAppFrame>
  );
}

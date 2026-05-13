import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseCreatePage } from "@/src/modules/cases/pages/CaseCreatePage";

export const metadata: Metadata = {
  title: "Crear expediente",
  description: "Crea un expediente digital laboral o pensional en Labora.",
};

export default function AppCaseCreateRoute() {
  return (
    <CasesAppFrame>
      <CaseCreatePage />
    </CasesAppFrame>
  );
}

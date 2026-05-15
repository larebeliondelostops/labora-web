import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { CaseQuestionnairePage } from "@/src/modules/questionnaire/pages/CaseQuestionnairePage";

export const metadata: Metadata = {
  title: "Cuestionario guiado",
  description: "Preguntas guiadas para completar el perfil preliminar del caso.",
};

export default async function AppCaseQuestionnaireRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <CasesAppFrame>
      <CaseQuestionnairePage caseId={caseId} />
    </CasesAppFrame>
  );
}

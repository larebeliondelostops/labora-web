import type { Metadata } from "next";

import { CasesAppFrame } from "@/src/modules/cases/pages/CasesAppFrame";
import { DraftEditorPage } from "@/src/modules/legal-actions/pages/DraftEditorPage";

export const metadata: Metadata = {
  title: "Editor de escrito",
  description: "Editor del borrador juridico por secciones.",
};

export default async function AppCaseDraftEditorRoute({
  params,
}: {
  params: Promise<{ caseId: string; draftId: string }>;
}) {
  const { caseId, draftId } = await params;

  return (
    <CasesAppFrame>
      <DraftEditorPage caseId={caseId} draftId={draftId} />
    </CasesAppFrame>
  );
}

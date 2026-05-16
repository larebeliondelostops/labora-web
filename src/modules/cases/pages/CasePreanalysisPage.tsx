"use client";

import { PreAnalysisPage } from "@/src/modules/preanalysis/pages/PreAnalysisPage";

export function CasePreanalysisPage({ caseId }: { caseId: string }) {
  return <PreAnalysisPage caseId={caseId} />;
}

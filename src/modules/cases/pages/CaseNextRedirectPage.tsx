"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SkeletonCard } from "@/components/auth/FormFeedback";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getNextActionHref } from "@/src/modules/cases/utils/caseActions";

export function CaseNextRedirectPage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { data: laboraCase, isLoading, error } = useCaseDetail(caseId);

  useEffect(() => {
    if (laboraCase) {
      router.replace(getNextActionHref(laboraCase.nextBestAction, laboraCase.id));
    }
  }, [laboraCase, router]);

  useEffect(() => {
    if (error) {
      router.replace(`/app/cases/${caseId}`);
    }
  }, [caseId, error, router]);

  return (
    <div aria-live="polite">
      {isLoading || !error ? <SkeletonCard /> : null}
    </div>
  );
}

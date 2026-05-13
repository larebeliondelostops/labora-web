"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SkeletonCard } from "@/components/auth/FormFeedback";

export function CaseModuleRedirectPage({
  destination,
}: {
  destination: string;
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(destination);
  }, [destination, router]);

  return <SkeletonCard />;
}

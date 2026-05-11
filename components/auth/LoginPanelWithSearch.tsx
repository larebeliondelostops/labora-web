"use client";

import { useSearchParams } from "next/navigation";

import { LoginPanel } from "@/components/auth/LoginPanel";

export function LoginPanelWithSearch() {
  const searchParams = useSearchParams();

  return <LoginPanel error={searchParams.get("error")} />;
}

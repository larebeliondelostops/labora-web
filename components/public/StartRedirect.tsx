"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getNextAuthPath } from "@/lib/auth-validation";
import { getCurrentUser } from "@/lib/auth";

export function StartRedirect() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          router.replace(getNextAuthPath(user.nextStep, user.email));
        }
      })
      .catch(() => {
        if (isMounted) {
          router.replace("/registro");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-labora-ivory px-5 py-16">
      <div className="mx-auto max-w-md rounded-lg border border-labora-ui bg-white p-6 text-center shadow-panel">
        <p className="font-heading text-xl font-semibold text-labora-charcoal">
          Preparando tu inicio...
        </p>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          Te llevaremos al lugar correcto para crear tu expediente.
        </p>
      </div>
    </main>
  );
}

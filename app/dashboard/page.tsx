"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Card } from "@/components/ui/card";
import { getNextAuthPath } from "@/lib/auth-validation";
import { getCurrentUser } from "@/lib/auth";
import type { CurrentUser } from "@/types/user";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          if (currentUser.nextStep && currentUser.nextStep !== "dashboard") {
            router.replace(getNextAuthPath(currentUser.nextStep, currentUser.email));
            return;
          }

          setUser(currentUser);
        }
      })
      .catch(() => {
        if (isMounted) {
          router.replace("/login");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-labora-ui/70 bg-white/90 p-6 text-labora-gray shadow-panel">
          {loading ? "Cargando..." : "Redirigiendo..."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AppSidebar />
        <div className="space-y-6">
          <AppHeader />
          <Card>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-labora-green">
                  {user.email}
                </p>
                <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-deep">
                  Bienvenida{user.firstName ? `, ${user.firstName}` : ""}
                </h1>
                <p className="mt-2 text-labora-gray">
                  Ya puedes crear tu primer expediente de analisis laboral o pensional.
                </p>
                <Link
                  href="/cases/new"
                  className="mt-6 inline-flex rounded-full bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
                >
                  Crear nuevo caso
                </Link>
              </div>

              <LogoutButton />
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

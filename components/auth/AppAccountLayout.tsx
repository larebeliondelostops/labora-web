"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FolderOpen, LayoutDashboard, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/cases", label: "Expedientes", icon: FolderOpen },
  { href: "/app/perfil", label: "Perfil", icon: UserRound },
  { href: "/app/perfil/seguridad", label: "Seguridad", icon: LockKeyhole },
  { href: "/app/onboarding/consentimientos", label: "Consentimientos", icon: ShieldCheck },
];

export function AppAccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-labora-ivory px-5 py-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <Logo />
          <nav className="mt-8 grid gap-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-labora-gray transition hover:bg-labora-ivory hover:text-labora-deep",
                  pathname === item.href && "bg-labora-ivory text-labora-deep",
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8">
            <LogoutButton />
          </div>
        </aside>

        <section>{children}</section>
      </div>
    </main>
  );
}

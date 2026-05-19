"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  ClipboardList,
  FileCheck2,
  FileText,
  FolderKanban,
  Gavel,
  History,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingSkeleton, Panel } from "@/src/modules/admin/components/admin-ui";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user";

type AdminNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
  roles?: UserRole[];
};

const adminRoles: UserRole[] = ["admin", "reviewer", "legal_reviewer", "support"];

const navItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <BarChart3 className="h-4 w-4" />, badge: 5 },
  { label: "Cola de expedientes", href: "/admin/cases", icon: <FolderKanban className="h-4 w-4" />, badge: 17 },
  { label: "Mis asignaciones", href: "/admin/tasks", icon: <ClipboardList className="h-4 w-4" />, badge: 8 },
  { label: "Revision documental", href: "/admin/cases/case-1001/documents", icon: <FileCheck2 className="h-4 w-4" />, badge: 8 },
  { label: "Revision juridica", href: "/admin/cases/case-1001/legal-analysis", icon: <Gavel className="h-4 w-4" />, badge: 5 },
  { label: "Calculos", href: "/admin/cases/case-1001/calculations", icon: <Calculator className="h-4 w-4" />, badge: 4 },
  { label: "Informes", href: "/admin/cases/case-1001/reports", icon: <FileText className="h-4 w-4" />, badge: 6 },
  { label: "Escritos", href: "/admin/cases/case-1001/legal-drafts", icon: <FileText className="h-4 w-4" />, badge: 3 },
  { label: "Alertas IA", href: "/admin/dashboard#alertas", icon: <AlertTriangle className="h-4 w-4" />, badge: 12 },
  { label: "Auditoria", href: "/admin/cases/case-1001/audit", icon: <History className="h-4 w-4" /> },
  { label: "Configuracion", href: "/admin/settings", icon: <Settings className="h-4 w-4" />, roles: ["admin"] },
];

const routeLabels: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  cases: "Expedientes",
  overview: "Resumen",
  documents: "Documentos",
  extraction: "Extraccion",
  "legal-analysis": "Analisis juridico",
  calculations: "Calculos",
  reports: "Informes",
  "legal-drafts": "Escritos",
  audit: "Auditoria",
  tasks: "Mis asignaciones",
  settings: "Configuracion",
};

function userRoles(userRolesValue?: UserRole[], role?: UserRole) {
  const roles = userRolesValue?.length ? userRolesValue : role ? [role] : [];
  return roles;
}

function canUseRoute(pathname: string, roles: UserRole[]) {
  if (!roles.some((role) => adminRoles.includes(role))) {
    return false;
  }

  if (pathname.startsWith("/admin/settings")) {
    return roles.includes("admin");
  }

  if (pathname.includes("/legal-analysis") || pathname.includes("/legal-drafts") || pathname.includes("/reports")) {
    return roles.some((role) => ["admin", "legal_reviewer", "reviewer"].includes(role));
  }

  if (pathname.includes("/documents") || pathname.includes("/extraction")) {
    return roles.some((role) => ["admin", "reviewer", "support"].includes(role));
  }

  return true;
}

export function AdminFrame({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminFrameInner>{children}</AdminFrameInner>
      </ProtectedRoute>
    </AuthProvider>
  );
}

function AdminFrameInner({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminPermissionBoundary>
      <div className="min-h-screen bg-labora-ivory/70">
        <AdminTopbar onOpenMenu={() => setMobileOpen(true)} />
        <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
          <div className="hidden lg:block">
            <AdminSidebar />
          </div>
          <AdminContentShell>{children}</AdminContentShell>
        </div>
        <AdminMobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </AdminPermissionBoundary>
  );
}

export function AdminPermissionBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, user } = useAuth();
  const roles = userRoles(user?.roles, user?.role);

  if (status === "unknown") {
    return <LoadingSkeleton rows={2} />;
  }

  if (!canUseRoute(pathname, roles)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
        <Panel>
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-700">403</p>
              <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
                No tienes permisos para esta zona.
              </h1>
              <p className="mt-2 text-sm leading-6 text-labora-gray">
                Tu cuenta esta autenticada, pero no tiene el rol administrativo requerido para esta ruta.
              </p>
              <Link
                href="/app/dashboard"
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-labora-green px-4 text-sm font-semibold text-white hover:bg-labora-deep"
              >
                Volver a mi cuenta
              </Link>
            </div>
          </div>
        </Panel>
      </main>
    );
  }

  return <>{children}</>;
}

export function AdminContentShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-w-0 pb-24 lg:pb-8">
      <AdminBreadcrumbs />
      <div className="mt-4">{children}</div>
    </main>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const roles = userRoles(user?.roles, user?.role);

  return (
    <aside className="sticky top-20 rounded-lg border border-labora-ui bg-white p-4 shadow-panel">
      <div className="flex items-center gap-3 border-b border-labora-ui pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-labora-green text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-labora-deep">Labora Admin</p>
          <p className="text-xs text-labora-gray">Operacion interna</p>
        </div>
      </div>
      <nav className="mt-4 grid gap-1">
        {navItems
          .filter((item) => !item.roles || item.roles.some((role) => roles.includes(role)))
          .map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-labora-green text-white"
                    : "text-labora-gray hover:bg-labora-ivory hover:text-labora-deep",
                )}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      active ? "bg-white/20 text-white" : "bg-labora-ivory text-labora-deep",
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}

function AdminMobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Cerrar menu"
        onClick={onClose}
        className="absolute inset-0 bg-labora-charcoal/35"
      />
      <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white p-4 shadow-panel">
        <div className="flex items-center justify-between">
          <p className="font-heading text-lg font-semibold text-labora-deep">Menu admin</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui text-labora-gray"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4">
          <AdminSidebar />
        </div>
      </div>
    </div>
  );
}

export function AdminTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-labora-ui bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 lg:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui text-labora-deep lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <GlobalCaseSearch />
        <UserRoleMenu />
      </div>
    </header>
  );
}

export function GlobalCaseSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/admin/cases?query=${encodeURIComponent(trimmed)}` : "/admin/cases");
  }

  return (
    <form onSubmit={handleSubmit} className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-labora-gray" aria-hidden="true" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar caso, titular, documento o correo"
        className="min-h-10 w-full rounded-lg border border-labora-ui bg-labora-ivory py-2 pl-9 pr-3 text-sm outline-none focus:border-labora-green focus:bg-white focus:ring-2 focus:ring-labora-green/15"
      />
    </form>
  );
}

export function UserRoleMenu() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Admin";
  const role = user?.role || "admin";

  async function handleLogout() {
    setIsLoading(true);

    try {
      await logout();
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 rounded-lg border border-labora-ui bg-white px-3 py-2 md:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-labora-ivory text-labora-green">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-labora-charcoal">{displayName}</p>
          <p className="text-xs text-labora-gray">{role}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-labora-ui text-labora-gray transition hover:bg-labora-ivory hover:text-labora-deep disabled:opacity-60"
        title="Cerrar sesion"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = useMemo(
    () =>
      parts.map((part, index) => {
        const href = `/${parts.slice(0, index + 1).join("/")}`;
        const isCaseId = part.startsWith("case-") || part.startsWith("LAB-");
        return {
          href,
          label: isCaseId ? part : routeLabels[part] || part,
        };
      }),
    [parts],
  );

  return (
    <nav aria-label="Breadcrumbs" className="flex flex-wrap items-center gap-2 text-xs text-labora-gray">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-2">
          {index > 0 ? <span>/</span> : null}
          <Link
            href={crumb.href}
            className={cn(
              "font-semibold hover:text-labora-deep",
              index === crumbs.length - 1 ? "text-labora-deep" : "text-labora-gray",
            )}
          >
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

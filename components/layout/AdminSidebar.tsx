import Link from "next/link";

export function AdminSidebar() {
  return (
    <aside className="rounded-3xl border border-labora-ui/70 bg-white/80 p-5">
      <div className="mb-4 font-heading text-lg font-semibold text-labora-deep">Backoffice</div>
      <nav className="space-y-3 text-sm text-labora-gray">
        <Link href="/admin" className="block rounded-2xl px-3 py-2 hover:bg-labora-ivory">
          Resumen
        </Link>
        <Link href="/admin/cases" className="block rounded-2xl px-3 py-2 hover:bg-labora-ivory">
          Expedientes
        </Link>
        <Link href="/admin/document-precheck" className="block rounded-2xl px-3 py-2 hover:bg-labora-ivory">
          Revision documental
        </Link>
        <Link href="/admin/legal-drafts" className="block rounded-2xl px-3 py-2 hover:bg-labora-ivory">
          Borradores juridicos
        </Link>
        <Link href="/backoffice/professional-reviews" className="block rounded-2xl px-3 py-2 hover:bg-labora-ivory">
          Revision profesional
        </Link>
      </nav>
    </aside>
  );
}

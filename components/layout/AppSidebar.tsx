import Link from "next/link";

const items = [
  ["/dashboard", "Dashboard"],
  ["/cases", "Casos"],
  ["/app/onboarding/consentimientos", "Consentimientos"],
];

export function AppSidebar() {
  return (
    <aside className="rounded-3xl border border-labora-ui/70 bg-white/80 p-5">
      <div className="mb-4 font-heading text-lg font-semibold text-labora-deep">Tu espacio</div>
      <nav className="space-y-3 text-sm text-labora-gray">
        {items.map(([href, label]) => (
          <Link key={href} href={href} className="block rounded-2xl px-3 py-2 hover:bg-labora-ivory">
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <Card>
          <h1 className="font-heading text-3xl font-semibold text-labora-deep">Backoffice</h1>
          <p className="mt-2 text-labora-gray">
            Resumen inicial de casos nuevos, pagos pendientes y revisiones.
          </p>
        </Card>
      </div>
    </main>
  );
}

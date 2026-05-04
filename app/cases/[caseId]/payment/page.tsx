import { Card } from "@/components/ui/card";

export default function PaymentPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Card>
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">Pago</h1>
        <p className="mt-2 text-labora-gray">
          Estado mock del pago con control de avance para el MVP.
        </p>
      </Card>
    </main>
  );
}

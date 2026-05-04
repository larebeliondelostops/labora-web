import { Card } from "@/components/ui/card";

const consents = [
  "Terminos y condiciones",
  "Tratamiento de datos personales",
  "Datos sensibles",
  "Medios electronicos",
  "Alcance del servicio",
];

export default function ConsentsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Card>
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">Consentimientos</h1>
        <div className="mt-6 space-y-3">
          {consents.map((item) => (
            <div key={item} className="rounded-2xl bg-labora-ivory p-4 text-sm text-labora-charcoal">
              {item}
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}

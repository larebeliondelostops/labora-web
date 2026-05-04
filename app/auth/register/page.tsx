import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
      <Card className="w-full">
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">Crear cuenta</h1>
        <p className="mt-2 text-sm text-labora-gray">
          Registro base del MVP con validaciones pensado para integrarse luego al backend.
        </p>
      </Card>
    </main>
  );
}

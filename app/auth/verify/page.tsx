import { Card } from "@/components/ui/card";

export default function VerifyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">Verificacion</h1>
        <p className="mt-2 text-sm text-labora-gray">
          Pantalla reservada para OTP o confirmacion basica.
        </p>
      </Card>
    </main>
  );
}

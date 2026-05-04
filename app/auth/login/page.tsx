import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6">
      <Card className="w-full">
        <h1 className="font-heading text-3xl font-semibold text-labora-deep">Ingresar</h1>
        <p className="mt-2 text-sm text-labora-gray">
          Accede a tus casos y continua el proceso de analisis.
        </p>
      </Card>
    </main>
  );
}

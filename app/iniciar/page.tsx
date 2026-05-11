import type { Metadata } from "next";

import { StartRedirect } from "@/components/public/StartRedirect";

export const metadata: Metadata = {
  title: "Iniciar analisis",
  description: "Te redirigimos al inicio de cuenta o a la creacion de expediente.",
};

export default function IniciarPage() {
  return <StartRedirect />;
}

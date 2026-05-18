import type { Metadata } from "next";

import { StartRedirect } from "@/components/public/StartRedirect";

export const metadata: Metadata = {
  title: "Empezar mi revisión",
  description: "Te redirigimos al inicio de cuenta o a la creación de expediente.",
};

export default function IniciarPage() {
  return <StartRedirect />;
}

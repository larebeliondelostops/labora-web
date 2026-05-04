import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Labora",
  description: "Plataforma legal-tech para analisis de historia laboral.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

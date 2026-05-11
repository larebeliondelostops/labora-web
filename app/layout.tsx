import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Labora | Analisis de historia laboral y pensional",
    template: "%s | Labora",
  },
  description:
    "Revisa tu historia laboral, identifica posibles inconsistencias y accede a un analisis tecnico-juridico asistido.",
  openGraph: {
    title: "Labora | Analisis de historia laboral y pensional",
    description:
      "Revisa tu historia laboral, identifica posibles inconsistencias y accede a un analisis tecnico-juridico asistido.",
    url: appUrl,
    siteName: "Labora",
    locale: "es_CO",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo-mark.svg", sizes: "128x128", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
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

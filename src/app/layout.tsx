import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Seagate Mundial 2026",
  description:
    "El torneo de predicciones del Mundial FIFA 2026 de Seagate: predice los marcadores, gana puntos y compite en el ranking.",
  applicationName: "Seagate Mundial 2026",
  manifest: undefined,
};

export const viewport: Viewport = {
  themeColor: "#00563F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Polla Mundial 2026",
  description:
    "Predice los marcadores del Mundial FIFA 2026, gana puntos y compite en el ranking global.",
  applicationName: "Polla Mundial 2026",
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

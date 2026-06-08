import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { config } from "@/lib/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: config.app.name,
  description: config.app.description,
  applicationName: config.app.name,
  manifest: undefined,
};

export const viewport: Viewport = {
  themeColor: config.colorPrimary,
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

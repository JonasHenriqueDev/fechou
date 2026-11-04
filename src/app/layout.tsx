import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Fechou — Orçamentos online para MEI e autônomos", template: "%s · Fechou" },
  description:
    "Crie orçamentos profissionais em PDF, envie pelo WhatsApp, receba aprovação online com assinatura e cobre via Pix. 100% online, no celular ou no computador.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d5cf1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

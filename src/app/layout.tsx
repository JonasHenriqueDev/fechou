import type { Metadata, Viewport } from "next";
import { NavProgress } from "@/components/NavProgress";
import { themeScript } from "@/components/ThemeToggle";
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
    // O script de tema adiciona `dark` no <html> antes da hidratação.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <NavProgress />
        {children}
      </body>
    </html>
  );
}

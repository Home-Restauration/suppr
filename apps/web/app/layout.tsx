import type { Metadata, Viewport } from "next";
import "@suppr/tokens";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suppr — Curated culinary experiences",
  description: "Discover chefs cooking near you tonight.",
  manifest: "/manifest.json",
  themeColor: "#FDFCFA",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "var(--font-sans)", background: "var(--color-canvas)", color: "var(--color-text)" }}>
        {children}
      </body>
    </html>
  );
}

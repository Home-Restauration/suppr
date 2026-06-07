import "./marketing.css";
import { MarketingNav } from "./MarketingNav";
import { MarketingFooter } from "./MarketingFooter";
import { LenisProvider, ScrollProgressBar } from "./LenisProvider";
import { CustomCursor } from "./CustomCursor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suppr — Private dinners. Chef's tables. Real food as art.",
  description:
    "Our chefs are artists. Every dinner is a commission. Discover intimate chef's tables, supper clubs and private dinners near you.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500;1,9..144,700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <LenisProvider>
        <CustomCursor />
        <ScrollProgressBar />
        <div className="mk-grain mk-cursor-zone">
          <MarketingNav />
          <main>{children}</main>
          <MarketingFooter />
        </div>
      </LenisProvider>
    </>
  );
}

import "./marketing.css";
import { MarketingNav } from "./MarketingNav";
import { MarketingFooter } from "./MarketingFooter";
import { LenisProvider, ScrollProgressBar } from "./LenisProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suppr — Private dinners, supper clubs & chef's tables near you",
  description:
    "Discover intimate dinners, supper clubs, and chef's tables happening near you. Real home-chef experiences, booked in a tap.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Load Fraunces + Inter via Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <LenisProvider>
        <ScrollProgressBar />
        <MarketingNav />
        <div style={{ paddingTop: 64 }}>
          {children}
        </div>
        <MarketingFooter />
      </LenisProvider>
    </>
  );
}

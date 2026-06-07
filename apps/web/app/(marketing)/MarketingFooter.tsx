"use client";

import Link from "next/link";
import { useState } from "react";

const COLS = [
  { h: "For Guests", links: [{ l: "Find a table", href: "/feed" }, { l: "How it works", href: "/#how-it-works" }, { l: "Download app", href: "#" }] },
  { h: "For Chefs", links: [{ l: "Apply to host", href: "/apply" }, { l: "For chefs", href: "/for-chefs" }, { l: "Pricing", href: "/for-chefs#pricing" }] },
  { h: "Company", links: [{ l: "About", href: "#" }, { l: "Press", href: "#" }, { l: "Careers", href: "#" }] },
  { h: "Legal", links: [{ l: "Privacy", href: "/privacy" }, { l: "Terms", href: "/terms" }, { l: "Cookies", href: "#" }] },
];

function FLink({ l, href }: { l: string; href: string }) {
  const [h, setH] = useState(false);
  return (
    <Link href={href} style={{ fontSize: 14, color: h ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)", textDecoration: "none", lineHeight: 1.5, transition: "color 0.15s ease" }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {l}
    </Link>
  );
}

export function MarketingFooter() {
  return (
    <footer style={{ background: "var(--mk-studio)", padding: "64px 40px 40px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 52, flexWrap: "wrap", gap: 24 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "white", marginBottom: 8, letterSpacing: "-0.03em", fontWeight: 600 }}>
              Suppr<span style={{ color: "var(--mk-gold)" }}>.</span>
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>Food as art. A curated table for every city.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["IG", "X"].map((name) => (
              <a key={name} href="#" aria-label={name} style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "0.5px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.3)", textDecoration: "none",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                transition: "border-color 0.15s ease, color 0.15s ease",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
              >
                {name}
              </a>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "28px 24px", marginBottom: 52 }}>
          {COLS.map((col) => (
            <div key={col.h}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                {col.h}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((link) => <FLink key={link.l} {...link} />)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>© 2026 Suppr. All rights reserved.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>Food as art. Private dining, elevated.</p>
        </div>
      </div>
    </footer>
  );
}

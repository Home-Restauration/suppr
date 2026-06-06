import React from "react";
import Link from "next/link";

const COLUMNS = [
  {
    heading: "For Guests",
    links: [
      { label: "Find a table", href: "/feed" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Download app", href: "#" },
    ],
  },
  {
    heading: "For Chefs",
    links: [
      { label: "Apply to host", href: "/apply" },
      { label: "How it works", href: "/for-chefs" },
      { label: "Pricing", href: "/for-chefs#pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "Press", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "#" },
    ],
  },
];

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1.5" y="1.5" width="15" height="15" rx="4.5" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="9" cy="9" r="3.25" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="13" cy="5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l5.2 5.8L2 14h1.5l4-4.5L11.5 14H14l-5.4-6.1L14 2h-1.5l-3.7 4.2L4.5 2H2z" fill="currentColor" />
    </svg>
  );
}

export function MarketingFooter() {
  return (
    <footer style={{ background: "var(--color-text)", padding: "64px 32px 40px", marginTop: "auto" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48, flexWrap: "wrap", gap: 24 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", color: "var(--color-canvas)", marginBottom: 8, lineHeight: 1 }}>Suppr</p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: "var(--lh-sm)" }}>A curated table for every city.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ label: "Instagram", icon: <InstagramIcon /> }, { label: "X", icon: <XIcon /> }].map(({ label, icon }) => (
              <a key={label} href="#" aria-label={label} style={{
                width: 38, height: 38, borderRadius: "50%",
                border: "0.5px solid rgba(253,252,250,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--color-canvas)", textDecoration: "none",
                transition: "border-color 150ms ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(253,252,250,0.5)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(253,252,250,0.2)")}
              >{icon}</a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "32px 24px", marginBottom: 48 }}>
          {COLUMNS.map(col => (
            <div key={col.heading}>
              <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-canvas)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                {col.heading}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(link => (
                  <Link key={link.label} href={link.href} style={{
                    fontSize: "var(--text-sm)", color: "var(--color-text-muted)",
                    textDecoration: "none", lineHeight: "var(--lh-sm)",
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--color-canvas)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-muted)")}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div style={{ borderTop: "0.5px solid rgba(253,252,250,0.1)", paddingTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: "var(--lh-xs)" }}>
            © 2025 Suppr. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

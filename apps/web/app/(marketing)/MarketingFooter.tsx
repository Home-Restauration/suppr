"use client";

import Link from "next/link";
import { useState } from "react";

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

function FooterLink({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      style={{
        fontSize: 14,
        color: hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
        textDecoration: "none",
        lineHeight: 1.5,
        transition: "color 0.15s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </Link>
  );
}

export function MarketingFooter() {
  return (
    <footer style={{ background: "var(--mk-ink)", padding: "64px 32px 40px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Top row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 56,
          flexWrap: "wrap",
          gap: 24,
        }}>
          <div>
            <p style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              color: "var(--mk-bg)",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}>
              Suppr<span style={{ color: "var(--mk-accent)" }}>.</span>
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
              A curated table for every city.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["Instagram", "X (Twitter)"].map((name) => (
              <a
                key={name}
                href="#"
                aria-label={name}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: "0.5px solid rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.5)",
                  textDecoration: "none",
                  fontSize: 12,
                  transition: "border-color 0.15s ease",
                }}
              >
                {name === "Instagram" ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25">
                    <rect x="1" y="1" width="14" height="14" rx="4" />
                    <circle cx="8" cy="8" r="3" />
                    <circle cx="12" cy="4" r="0.75" fill="currentColor" stroke="none" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M1 1l4.5 6.5L1 13h1.3l3.5-4 3 4H12L7.3 6.3 11.5 1h-1.3L6.8 4.5 4 1H1z" />
                  </svg>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "32px 24px",
          marginBottom: 56,
        }}>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}>
                {col.heading}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {col.links.map((l) => <FooterLink key={l.label} {...l} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: "0.5px solid rgba(255,255,255,0.1)",
          paddingTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            © 2026 Suppr. All rights reserved.
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
            Private dining, elevated.
          </p>
        </div>
      </div>
    </footer>
  );
}

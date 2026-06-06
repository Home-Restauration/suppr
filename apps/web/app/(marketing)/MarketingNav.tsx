"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/for-chefs", label: "For chefs" },
  { href: "/#about", label: "About" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: scrolled ? "var(--color-canvas)" : "transparent",
        borderBottom: scrolled ? "0.5px solid var(--color-hairline)" : "none",
        transition: "background 250ms ease, border-color 250ms ease",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
      }}>
        {/* Logo */}
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "var(--color-accent)", textDecoration: "none", lineHeight: 1, fontWeight: 500 }}>
          Suppr
        </Link>

        {/* Desktop center links */}
        <div style={{ display: "flex", gap: 32, position: "absolute", left: "50%", transform: "translateX(-50%)" }} className="desktop-nav">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} style={{
              fontSize: "var(--text-sm)", color: "var(--color-text-2)", textDecoration: "none",
              transition: "color 150ms ease", lineHeight: "var(--lh-sm)",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-2)")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop right CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="desktop-nav">
          <Link href="/apply" style={{
            height: 36, padding: "0 16px", display: "inline-flex", alignItems: "center",
            border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)", color: "var(--color-text)", textDecoration: "none",
            transition: "border-color 150ms ease, background 150ms ease",
            background: "transparent",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-surface)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
          >
            Apply to host
          </Link>
          <Link href="/feed" style={{
            height: 36, padding: "0 16px", display: "inline-flex", alignItems: "center",
            background: "var(--color-text)", borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-canvas)",
            textDecoration: "none", transition: "opacity 150ms ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
          >
            Find a table
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(o => !o)}
          className="mobile-nav"
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 8, display: "flex", flexDirection: "column",
            gap: 5, alignItems: "flex-end",
          }}
        >
          <span style={{
            display: "block", height: 1.5, borderRadius: 1,
            background: "var(--color-text)", transition: "all 200ms ease",
            width: menuOpen ? 22 : 22,
            transform: menuOpen ? "translateY(6.5px) rotate(45deg)" : "none",
          }} />
          <span style={{
            display: "block", height: 1.5, borderRadius: 1,
            background: "var(--color-text)", width: 16,
            opacity: menuOpen ? 0 : 1, transition: "opacity 200ms ease",
          }} />
          <span style={{
            display: "block", height: 1.5, borderRadius: 1,
            background: "var(--color-text)", transition: "all 200ms ease",
            width: menuOpen ? 22 : 22,
            transform: menuOpen ? "translateY(-6.5px) rotate(-45deg)" : "none",
          }} />
        </button>
      </nav>

      {/* Mobile full-screen menu */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 99,
        background: "var(--color-canvas)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 32px",
        opacity: menuOpen ? 1 : 0,
        pointerEvents: menuOpen ? "all" : "none",
        transform: menuOpen ? "translateY(0)" : "translateY(-12px)",
        transition: "opacity 250ms ease-out, transform 250ms ease-out",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {NAV_LINKS.map((link, i) => (
            <Link key={link.href} href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", fontWeight: 500,
                color: "var(--color-text)", textDecoration: "none",
                lineHeight: "var(--lh-4xl)",
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 300ms ${i * 60}ms ease-out, transform 300ms ${i * 60}ms ease-out`,
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16, borderTop: "0.5px solid var(--color-hairline)" }}>
            <Link href="/apply" onClick={() => setMenuOpen(false)} style={{ fontSize: "var(--text-lg)", color: "var(--color-text-2)", textDecoration: "none" }}>Apply to host</Link>
            <Link href="/feed" onClick={() => setMenuOpen(false)} style={{ fontSize: "var(--text-lg)", color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>Find a table →</Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll } from "framer-motion";

export function MarketingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 60));
  }, [scrollY]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled ? "rgba(17,17,16,0.96)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          transition: "background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease",
        }}
      >
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 600,
              color: "white",
              letterSpacing: "-0.03em",
            }}>
              Suppr<span style={{ color: "var(--mk-gold)" }}>.</span>
            </span>
          </Link>

          <div className="mk-nav-links" style={{ display: "flex", gap: 36, alignItems: "center" }}>
            {[
              { label: "For guests", href: "/#tonight" },
              { label: "For chefs", href: "/for-chefs" },
              { label: "How it works", href: "/#how-it-works" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                style={{
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "-0.01em",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="mk-nav-ctas" style={{ display: "flex", gap: 10 }}>
            <Link
              href="/for-chefs"
              style={{
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(255,255,255,0.55)",
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                transition: "border-color 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.color = "rgba(255,255,255,0.55)";
              }}
            >
              Host a dinner
            </Link>
            <Link
              href="/feed"
              style={{
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--mk-studio)",
                background: "white",
                padding: "8px 18px",
                borderRadius: 999,
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--mk-gold)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "var(--mk-studio)";
              }}
            >
              Find a table
            </Link>
          </div>

          <button
            className="mk-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8, color: "white" }}
            aria-label={menuOpen ? "Close" : "Menu"}
          >
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen
                ? <><line x1="2" y1="2" x2="20" y2="14" /><line x1="20" y1="2" x2="2" y2="14" /></>
                : <><line x1="0" y1="2" x2="22" y2="2" /><line x1="0" y1="14" x2="22" y2="14" /></>}
            </svg>
          </button>
        </div>
      </motion.nav>

      {menuOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99,
          background: "var(--mk-studio)", paddingTop: 80,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ flex: 1, padding: "0 32px" }}>
            {[
              { label: "Find a table tonight", href: "/feed" },
              { label: "For chefs", href: "/for-chefs" },
              { label: "How it works", href: "/#how-it-works" },
              { label: "Apply to host", href: "/apply" },
            ].map(({ label, href }) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                style={{
                  display: "block", padding: "20px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600,
                  color: "white", textDecoration: "none", letterSpacing: "-0.02em",
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mk-nav-links, .mk-nav-ctas { display: none !important; }
          .mk-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}

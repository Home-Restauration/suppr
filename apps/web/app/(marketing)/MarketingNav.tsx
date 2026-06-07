"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "For chefs", href: "/for-chefs" },
  { label: "Pricing", href: "/for-chefs#pricing" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <motion.a
      href={href}
      initial="rest"
      whileHover="hover"
      style={{
        position: "relative",
        textDecoration: "none",
        color: "var(--mk-ink-2)",
        fontSize: 14,
        fontWeight: 500,
        paddingBottom: 2,
        letterSpacing: "-0.01em",
      }}
    >
      {label}
      <motion.span
        variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: -1,
          left: 0,
          right: 0,
          height: "0.5px",
          background: "var(--mk-ink)",
          transformOrigin: "left",
          display: "block",
        }}
      />
    </motion.a>
  );
}

export function MarketingNav() {
  const { scrollY } = useScroll();
  const boxShadow = useTransform(
    scrollY,
    [0, 40],
    ["0 1px 0 0 transparent", "0 1px 0 0 var(--mk-line), 0 2px 12px rgba(0,0,0,0.04)"]
  );
  const [menuOpen, setMenuOpen] = useState(false);

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
          background: "var(--mk-bg)",
          boxShadow,
        }}
      >
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}>
          {/* Wordmark */}
          <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--mk-ink)",
              letterSpacing: "-0.02em",
            }}>
              Suppr<span style={{ color: "var(--mk-accent)" }}>.</span>
            </span>
          </Link>

          {/* Desktop center links */}
          <div className="mk-nav-center" style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {NAV_LINKS.map((l) => <NavLink key={l.href} {...l} />)}
          </div>

          {/* Desktop right CTAs */}
          <div className="mk-nav-right" style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <Link
              href="/for-chefs"
              style={{
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--mk-ink-2)",
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid var(--mk-line)",
                transition: "border-color 0.15s ease, color 0.15s ease",
              }}
            >
              Host
            </Link>
            <Link
              href="/feed"
              style={{
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--mk-bg)",
                background: "var(--mk-ink)",
                padding: "8px 18px",
                borderRadius: 999,
                transition: "background 0.15s ease",
              }}
            >
              Find a table
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="mk-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              color: "var(--mk-ink)",
            }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen ? (
                <>
                  <line x1="5" y1="5" x2="17" y2="17" />
                  <line x1="17" y1="5" x2="5" y2="17" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7" x2="19" y2="7" />
                  <line x1="3" y1="15" x2="19" y2="15" />
                </>
              )}
            </svg>
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99,
          background: "var(--mk-bg)",
          paddingTop: 80, paddingBottom: 32,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ flex: 1, padding: "0 24px", display: "flex", flexDirection: "column", gap: 0 }}>
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "20px 0",
                  fontSize: 22,
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  color: "var(--mk-ink)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--mk-line)",
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
          <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              href="/for-chefs"
              onClick={() => setMenuOpen(false)}
              style={{
                textAlign: "center",
                padding: "14px",
                borderRadius: 999,
                border: "1px solid var(--mk-line)",
                color: "var(--mk-ink)",
                fontSize: 16,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Become a host
            </Link>
            <Link
              href="/feed"
              onClick={() => setMenuOpen(false)}
              style={{
                textAlign: "center",
                padding: "14px",
                borderRadius: 999,
                background: "var(--mk-ink)",
                color: "var(--mk-bg)",
                fontSize: 16,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Find a table tonight
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mk-nav-center, .mk-nav-right { display: none !important; }
          .mk-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { EventCard } from "@suppr/ui";

// ── Helpers ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null!);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function fadeUp(visible: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(40px)",
    transition: `opacity 400ms ${delay}ms ease-out, transform 400ms ${delay}ms ease-out`,
  };
}

// ── Photo Placeholder ──────────────────────────────────────────────────────────

function Photo({ label, style, children }: { label: string; style?: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <div style={{ position: "relative", background: "var(--color-surface-2)", overflow: "hidden", ...style }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, color-mix(in srgb, var(--color-accent-tint) 55%, transparent), color-mix(in srgb, var(--color-surface-2) 80%, transparent))",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        opacity: 0.6,
      }} />
      {children}
      <div style={{
        position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center",
        fontSize: "var(--text-xs)", color: "var(--color-text-muted)",
        fontFamily: "var(--font-sans)", lineHeight: "var(--lh-xs)",
        padding: "0 16px",
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Inline SVG icons ───────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="12" cy="12" r="7.5" stroke="var(--color-accent)" strokeWidth="1.5" />
      <path d="M18 18l5.5 5.5" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M4 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H9l-5 4V6z" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 2C9.6 2 6 5.6 6 10c0 7 8 16 8 16s8-9 8-16c0-4.4-3.6-8-8-8z" stroke="var(--color-accent)" strokeWidth="1.5" />
      <circle cx="14" cy="10" r="2.5" stroke="var(--color-accent)" strokeWidth="1.5" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="17" rx="2" stroke="var(--color-accent)" strokeWidth="1.3" />
      <path d="M2 10h20M8 2v4M16 2v4" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconDollar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.5" stroke="var(--color-accent)" strokeWidth="1.3" />
      <path d="M12 6v12M9 8.5c0-1.1.9-2 2-2h2a2 2 0 010 4H9a2 2 0 000 4h4a2 2 0 012 2" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2a6 6 0 016 6v4.5l1.5 2.5H4.5L6 12.5V8a6 6 0 016-6z" stroke="var(--color-accent)" strokeWidth="1.3" />
      <path d="M10 19a2 2 0 004 0" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.9 6.3L22 9.3l-5 5 1.2 7.2L12 18l-6.2 3.5L7 14.3 2 9.3l7.1-1L12 2z" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 17l5-6 4 4 5-8 4 6" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l8 3.5v5.5c0 4.5-3.3 8.5-8 10-4.7-1.5-8-5.5-8-10V5.5L12 2z" stroke="var(--color-accent)" strokeWidth="1.3" />
    </svg>
  );
}

// ── Section wrapper with scroll reveal ────────────────────────────────────────

function Section({ children, bg, id, style }: { children: React.ReactNode; bg?: string; id?: string; style?: React.CSSProperties }) {
  const [ref, visible] = useInView();
  return (
    <section id={id} ref={ref} style={{ background: bg ?? "var(--color-canvas)", padding: "96px 32px", ...style }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", ...fadeUp(visible) }}>
        {children}
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, lineHeight: "var(--lh-xs)" }}>
      {children}
    </p>
  );
}

function SectionHeadline({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 500, color: "var(--color-text)", lineHeight: "var(--lh-3xl)", ...style }}>
      {children}
    </h2>
  );
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const EVENTS = [
  { id: "1", title: "Lagos After Dark", chefName: "Chef Kiano", city: "Oakland", dateLabel: "Tonight 7:30pm", seatsLabel: "3 seats", priceCents: 9500 },
  { id: "2", title: "Spring Kaiseki", chefName: "Chef Maya Ito", city: "San Francisco", dateLabel: "Tonight 8:00pm", seatsLabel: "Waitlist", priceCents: 14000 },
  { id: "3", title: "Hand-rolled Pasta Night", chefName: "Leo Marchetti", city: "Berkeley", dateLabel: "Tonight 7:00pm", seatsLabel: "5 seats", priceCents: 7000 },
  { id: "4", title: "West African Tasting", chefName: "Amara Diallo", city: "Oakland", dateLabel: "Tomorrow", seatsLabel: "8 seats", priceCents: 8500 },
];

const CHEFS = [
  { name: "Kiano Okafor", city: "Oakland", cuisine: "West African", nextEvent: "Lagos After Dark", nextDate: "Sat", seats: "3 seats" },
  { name: "Maya Ito", city: "San Francisco", cuisine: "Japanese", nextEvent: "Spring Kaiseki", nextDate: "Sun", seats: "Waitlist" },
  { name: "Leo Marchetti", city: "Berkeley", cuisine: "Italian", nextEvent: "Pasta Night", nextDate: "Fri", seats: "5 seats" },
];

const ZERO_ADMIN = [
  { icon: <IconChat />, title: "Takes bookings by text and app", desc: "Guests book via WhatsApp, iMessage, or the feed — the AI handles it end to end." },
  { icon: <IconShield />, title: "Collects dietary info automatically", desc: "Every guest, every booking. Big 9 allergens plus dietary restrictions, flagged for your prep." },
  { icon: <IconBell />, title: "Sends reminders and address", desc: "Confirmation, reminders, and exact address — all sent automatically at the right moment." },
  { icon: <IconX />, title: "Handles cancellations within policy", desc: "Your cancellation rules, enforced automatically. Refunds issued without you lifting a finger." },
  { icon: <IconStar />, title: "Drafts your feed posts", desc: "After each event, the AI drafts a post from your photos. You approve with one tap." },
  { icon: <IconChart />, title: "Manages payout reporting", desc: "Every sale, tip, tax, and fee tracked as line items. CSV export for QuickBooks, always ready." },
];

// ── Hero ───────────────────────────────────────────────────────────────────────

function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  function fadeAt(delay: number): React.CSSProperties {
    return {
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 600ms ${delay}ms ease-out, transform 600ms ${delay}ms ease-out`,
    };
  }

  return (
    <section style={{
      height: "100svh", minHeight: 600, display: "grid",
      gridTemplateColumns: "55fr 45fr", position: "relative",
    }}>
      {/* Text side */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "80px 64px 80px 48px",
        background: "var(--color-canvas)", position: "relative", zIndex: 1,
      }}>
        <div style={{ maxWidth: 520 }}>
          <p style={{
            ...fadeAt(0),
            fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.12em",
            color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 20,
          }}>
            Now in Oakland · San Francisco · Los Angeles
          </p>

          <h1 style={{
            ...fadeAt(150),
            fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--color-text)",
            fontSize: "clamp(38px, 5vw, 68px)", lineHeight: 1.0, marginBottom: 24,
            whiteSpace: "pre-line",
          }}>
            {"The table you\ndidn't know\nexisted."}
          </h1>

          <p style={{
            ...fadeAt(300),
            fontSize: "var(--text-lg)", color: "var(--color-text-2)",
            lineHeight: "var(--lh-lg)", maxWidth: 480, marginBottom: 32,
          }}>
            Discover chefs cooking intimate dinners, tastings, and supper clubs near you tonight.
          </p>

          <div style={{ ...fadeAt(450), display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <Link href="/feed" style={{
              display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px",
              background: "var(--color-text)", borderRadius: "var(--radius-md)",
              fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-canvas)",
              textDecoration: "none", transition: "opacity 150ms ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            >
              Find a table near me
            </Link>
            <Link href="/apply" style={{
              display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px",
              border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)",
              fontSize: "var(--text-base)", color: "var(--color-text)", textDecoration: "none",
              transition: "border-color 150ms ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-text)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-hairline)"; }}
            >
              Apply to host →
            </Link>
          </div>

          <p style={{ ...fadeAt(600), fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Trusted by 200+ independent chefs
          </p>
        </div>
      </div>

      {/* Image side */}
      <Photo label="Chef Kiano · Lagos After Dark · Oakland" style={{ height: "100%" }}>
        <div style={{ position: "absolute", bottom: 40, left: 24, right: 24, ...fadeAt(300) }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(253,252,250,0.9)", borderRadius: "var(--radius-md)",
            padding: "12px 16px", backdropFilter: "blur(8px)",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-paid)", flexShrink: 0 }} />
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", fontWeight: 500 }}>
              3 seats left · Lagos After Dark · Tonight 7:30pm
            </p>
          </div>
        </div>
      </Photo>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        zIndex: 2,
        opacity: mounted ? 0.6 : 0,
        transition: "opacity 400ms 800ms ease",
      }}>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>Scroll</p>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "suppr-chevron-bounce 1.6s ease-in-out infinite" }}>
          <path d="M3 6l5 5 5-5" stroke="var(--color-text-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <style>{`
        @media (max-width: 768px) {
          section:first-of-type { grid-template-columns: 1fr !important; }
          section:first-of-type > div:first-child { padding: 80px 24px 40px !important; }
          section:first-of-type > div:last-child { display: none; }
        }
      `}</style>
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [appState, setAppState] = useState({ submitted: false, submitting: false });
  const [form, setForm] = useState({
    name: "", email: "", city: "", types: [] as string[], story: "", link: "",
  });

  function toggleType(t: string) {
    setForm(f => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter(x => x !== t) : [...f.types, t],
    }));
  }

  async function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    setAppState(s => ({ ...s, submitting: true }));
    await new Promise(r => setTimeout(r, 1200));
    setAppState({ submitted: true, submitting: false });
  }

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── TONIGHT NEAR YOU ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--color-canvas)", padding: "80px 0" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px" }}>
          <SectionLabel>Happening tonight</SectionLabel>
          <SectionHeadline style={{ marginBottom: 32 }}>A table is waiting.</SectionHeadline>
        </div>
        <div style={{
          display: "flex", gap: 16, overflowX: "auto", scrollSnapType: "x mandatory",
          padding: "4px 32px 24px",
          paddingRight: "max(32px, calc((100vw - 1120px) / 2 + 32px))",
        }} className="hide-scrollbar">
          {EVENTS.map(ev => (
            <div key={ev.id} style={{ scrollSnapAlign: "start" }}>
              <EventCard {...ev} href="/feed" />
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS — GUESTS ─────────────────────────────────────────── */}
      <Section bg="var(--color-surface)" id="how-it-works">
        <SectionLabel>For guests</SectionLabel>
        <SectionHeadline style={{ marginBottom: 48 }}>From curiosity to table in minutes.</SectionHeadline>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 40 }}>
          {[
            { num: "01", icon: <IconSearch />, title: "Discover", desc: "Browse chefs cooking near you tonight — supper clubs, chef dinners, tastings, and workshops." },
            { num: "02", icon: <IconChat />, title: "Book by text or app", desc: "Reserve a seat in seconds via the app or WhatsApp. Pay securely. No account required." },
            { num: "03", icon: <IconPin />, title: "Show up and eat", desc: "Your exact address arrives automatically before the event. Just show up." },
          ].map(step => (
            <div key={step.num} style={{ position: "relative" }}>
              <span style={{
                position: "absolute", top: -8, left: -4,
                fontFamily: "var(--font-display)", fontSize: "var(--text-5xl)",
                color: "var(--color-accent-tint)", lineHeight: 1, fontWeight: 500,
                pointerEvents: "none", userSelect: "none",
              }}>{step.num}</span>
              <div style={{ position: "relative", paddingTop: 24 }}>
                <div style={{ marginBottom: 16 }}>{step.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 500, color: "var(--color-text)", marginBottom: 10, lineHeight: "var(--lh-xl)" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", lineHeight: "var(--lh-base)" }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── HOW IT WORKS — CHEFS ──────────────────────────────────────────── */}
      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          {/* Left text */}
          <div>
            <SectionLabel>For chefs</SectionLabel>
            <SectionHeadline style={{ whiteSpace: "pre-line", marginBottom: 40 }}>
              {"Your kitchen. Your rules.\nWe handle the rest."}
            </SectionHeadline>

            <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
              <div style={{ position: "absolute", left: 9, top: 32, bottom: 32, width: "0.5px", background: "var(--color-hairline)" }} />
              {[
                { n: 1, title: "Apply and get approved", desc: "We curate so guests trust every table." },
                { n: 2, title: "Create your experience", desc: "Set your menu, date, price, and capacity." },
                { n: 3, title: "We handle everything else", desc: "Bookings, payments, dietary, comms — automatic." },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", gap: 20, padding: "20px 0" }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", background: "var(--color-accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 2, zIndex: 1,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>{s.n}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 500, color: "var(--color-text)", marginBottom: 4 }}>{s.title}</p>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: "var(--lh-sm)" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/apply" style={{ display: "inline-flex", alignItems: "center", marginTop: 24, fontSize: "var(--text-sm)", color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
            >
              Apply to host →
            </Link>
          </div>

          {/* Right — dashboard visual */}
          <div style={{
            background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-lg)", overflow: "hidden",
            boxShadow: "0 12px 40px rgba(52,48,42,0.08)",
          }}>
            {/* Dashboard header */}
            <div style={{ padding: "14px 20px", borderBottom: "0.5px solid var(--color-hairline)", background: "var(--color-canvas)" }}>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: 2 }}>Event day</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-text)", fontWeight: 500 }}>Lagos After Dark</p>
            </div>
            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--color-hairline)" }}>
              {[
                { label: "Covers", value: "13", color: "var(--color-text)" },
                { label: "Seats left", value: "3", color: "var(--color-accent)" },
                { label: "Allergies", value: "2", color: "var(--color-alert)" },
                { label: "Sales", value: "$1,235", color: "var(--color-paid)" },
              ].map(m => (
                <div key={m.label} style={{ background: "var(--color-canvas)", padding: "14px 16px" }}>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: 4 }}>{m.label}</p>
                  <p style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</p>
                </div>
              ))}
            </div>
            {/* Guest list */}
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--color-hairline)" }}>
              {["Amara B. · 2 guests · No allergies", "James K. · 1 guest · Shellfish", "Priya R. · 2 guests · Vegan"].map(g => (
                <div key={g} style={{ padding: "8px 0", borderBottom: "0.5px solid var(--color-hairline)", fontSize: "var(--text-xs)", color: "var(--color-text-2)" }}>
                  {g}
                </div>
              ))}
            </div>
            {/* AI rail */}
            <div style={{ padding: "12px 16px" }}>
              <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent)", marginBottom: 10 }}>AI host · today</p>
              {["Dietary sent to chef", "Address released to all guests", "Post-event recap drafted"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: "var(--text-xs)", color: "var(--color-text-2)" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="var(--color-paid)" strokeWidth="1" /><path d="M3.5 6l2 2 3-3" stroke="var(--color-paid)" strokeWidth="1" strokeLinecap="round" /></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── CHEF SHOWCASE ─────────────────────────────────────────────────── */}
      <Section bg="var(--color-surface)">
        <SectionLabel>The chefs</SectionLabel>
        <SectionHeadline style={{ marginBottom: 48 }}>Meet the people behind the table.</SectionHeadline>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
          {CHEFS.map(chef => (
            <div key={chef.name} style={{
              background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(52,48,42,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
            >
              <Photo label={`${chef.name} · ${chef.cuisine}`} style={{ aspectRatio: "1/1", width: "100%" }} />
              <div style={{ padding: "16px 18px" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 500, color: "var(--color-text)", marginBottom: 4 }}>{chef.name}</h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", marginBottom: 12 }}>{chef.city} · {chef.cuisine}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px",
                    background: "var(--color-accent-tint)", borderRadius: 999,
                    fontSize: 11, fontWeight: 600, color: "var(--color-accent-deep)",
                  }}>
                    {chef.nextEvent} · {chef.nextDate}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{chef.seats}</span>
                </div>
                <button style={{
                  height: 32, padding: "0 14px", background: "transparent",
                  border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-xs)", color: "var(--color-text-2)", cursor: "pointer",
                  transition: "border-color 150ms ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-text)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-hairline)")}
                >
                  Follow
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "right", marginTop: 24 }}>
          <Link href="/feed" style={{ fontSize: "var(--text-sm)", color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >
            See all chefs →
          </Link>
        </div>
      </Section>

      {/* ── AI CONCIERGE ──────────────────────────────────────────────────── */}
      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "45fr 55fr", gap: 80, alignItems: "center" }}>
          {/* Left text */}
          <div>
            <SectionLabel>The concierge</SectionLabel>
            <SectionHeadline style={{ whiteSpace: "pre-line", marginBottom: 20 }}>{"Book a table\nby text."}</SectionHeadline>
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", lineHeight: "var(--lh-base)", marginBottom: 28 }}>
              Text our concierge on WhatsApp or iMessage and we'll find you a table nearby, handle dietary needs for your whole party, and send a payment link — all in one thread. No app download required.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
              {[
                { label: "WhatsApp", icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="var(--color-paid)" strokeWidth="1.2" /><path d="M5 7c.5 1 1.5 2 2.5 2.5l1-1.5s.5.5 1 .5h.5c.5 0 .5-.5 0-1L9.5 7c-.5-.5-1 0-1.5.5C7 6.5 7 5.5 7.5 5l.5-.5C7.5 4 7 4 6.5 4.5l-.5.5" stroke="var(--color-paid)" strokeWidth="1" /></svg> },
                { label: "iMessage", icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h10a1 1 0 011 1v6a1 1 0 01-1 1H4L2 12V3a1 1 0 010-2z" stroke="var(--color-trust)" strokeWidth="1.1" /></svg> },
              ].map(b => (
                <div key={b.label} style={{
                  display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 14px",
                  background: "var(--color-surface-2)", borderRadius: 999,
                  fontSize: "var(--text-sm)", color: "var(--color-text-2)",
                }}>
                  {b.icon}{b.label}
                </div>
              ))}
            </div>
            <Link href="/concierge" style={{
              display: "inline-flex", alignItems: "center", height: 44, padding: "0 22px",
              background: "var(--color-text)", borderRadius: "var(--radius-md)",
              fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-canvas)", textDecoration: "none",
            }}>
              Text us now →
            </Link>
          </div>

          {/* Right — phone mockup */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              width: 300, borderRadius: 40, border: "3px solid var(--color-text)",
              background: "#1a1a1a", boxShadow: "0 32px 80px rgba(52,48,42,0.2)",
              overflow: "hidden", position: "relative",
            }}>
              {/* Status bar */}
              <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>9:41</span>
                <div style={{ width: 80, height: 28, borderRadius: 14, background: "#000", position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)" }} />
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="white"><rect x="0" y="6" width="2" height="4" rx="0.5" /><rect x="3" y="4" width="2" height="6" rx="0.5" /><rect x="6" y="2" width="2" height="8" rx="0.5" /><rect x="9" y="0" width="2" height="10" rx="0.5" /><rect x="12" y="0" width="2" height="10" rx="0.5" opacity="0.3" /></svg>
                </div>
              </div>

              {/* Chat header */}
              <div style={{ padding: "10px 16px 10px", background: "#222", borderBottom: "0.5px solid #333", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-accent-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--color-accent-deep)" }}>S</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Suppr concierge</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4CAF50" }} />
                    <p style={{ fontSize: 10, color: "#aaa" }}>online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: "12px 12px 8px", display: "flex", flexDirection: "column", gap: 8, minHeight: 340 }}>
                {/* Guest */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "#0a7cf7", borderRadius: "16px 16px 4px 16px", padding: "8px 12px", maxWidth: "70%" }}>
                    <p style={{ fontSize: 12, color: "#fff", lineHeight: 1.4 }}>any home dining near me tonight?</p>
                  </div>
                </div>

                {/* Bot */}
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-accent-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 9, color: "var(--color-accent-deep)", fontFamily: "var(--font-display)" }}>S</span>
                  </div>
                  <div style={{ background: "#2a2a2a", borderRadius: "16px 16px 16px 4px", padding: "8px 12px", maxWidth: "80%" }}>
                    <p style={{ fontSize: 12, color: "#ddd", lineHeight: 1.4, marginBottom: 8 }}>A few tables open near Oakland tonight 🍽️</p>
                    {/* Option cards */}
                    {[
                      { title: "Lagos After Dark · Chef Kiano", sub: "7:30pm · 6-course · 3 seats · $95" },
                      { title: "Pasta Night · Leo Marchetti", sub: "7:00pm · hand-rolled · 5 seats · $70" },
                    ].map(c => (
                      <div key={c.title} style={{ background: "#1a1a1a", borderRadius: 8, padding: "8px 10px", marginBottom: 6, border: "0.5px solid #3a3a3a" }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{c.title}</p>
                        <p style={{ fontSize: 10, color: "#aaa" }}>{c.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Guest */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "#0a7cf7", borderRadius: "16px 16px 4px 16px", padding: "8px 12px" }}>
                    <p style={{ fontSize: 12, color: "#fff", lineHeight: 1.4 }}>the Lagos one, for 2</p>
                  </div>
                </div>

                {/* Bot dietary */}
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-accent-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: "var(--color-accent-deep)", fontFamily: "var(--font-display)" }}>S</span>
                  </div>
                  <div style={{ background: "#2a2a2a", borderRadius: "16px 16px 16px 4px", padding: "8px 12px" }}>
                    <p style={{ fontSize: 12, color: "#ddd", lineHeight: 1.4 }}>Perfect. Any allergies for either guest?</p>
                  </div>
                </div>

                {/* Guest */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "#0a7cf7", borderRadius: "16px 16px 4px 16px", padding: "8px 12px" }}>
                    <p style={{ fontSize: 12, color: "#fff", lineHeight: 1.4 }}>one shellfish allergy</p>
                  </div>
                </div>

                {/* Bot pay card */}
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-accent-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: "var(--color-accent-deep)", fontFamily: "var(--font-display)" }}>S</span>
                  </div>
                  <div style={{ maxWidth: "80%" }}>
                    <div style={{ background: "#2a2a2a", borderRadius: "16px 16px 16px 4px", padding: "8px 12px", marginBottom: 6 }}>
                      <p style={{ fontSize: 12, color: "#ddd", lineHeight: 1.4 }}>Noted — Chef will swap that course. 2 seats = $232.20</p>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", border: "0.5px solid #eee" }}>
                      <p style={{ fontSize: 10, color: "#999", marginBottom: 3 }}>Pay & confirm</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 2 }}>$232.20</p>
                      <p style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>2 seats · shellfish swap noted</p>
                      <div style={{ height: 28, background: "var(--color-accent)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>suppr.co/pay/lad-7 →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div style={{ padding: "10px 12px 20px", background: "#1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 34, background: "#2a2a2a", borderRadius: 17, display: "flex", alignItems: "center", padding: "0 14px" }}>
                  <span style={{ fontSize: 12, color: "#666" }}>Message…</span>
                </div>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M8 3l3 3-3 3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── ZERO ADMIN (DARK) ─────────────────────────────────────────────── */}
      <section data-theme="dark" style={{ background: "var(--color-canvas)", padding: "96px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", color: "var(--color-text)", lineHeight: "var(--lh-5xl)", marginBottom: 16 }}>
            <span style={{ display: "block", fontSize: "var(--text-5xl)" }}>You cook.</span>
            <span style={{ display: "block", fontSize: "var(--text-5xl)" }}>We handle everything else.</span>
          </h2>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-2)", lineHeight: "var(--lh-lg)", maxWidth: 560, margin: "0 auto 64px" }}>
            Suppr's AI absorbs every operational task so chefs focus entirely on their craft.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 32, textAlign: "left", marginBottom: 56 }}>
            {ZERO_ADMIN.map(item => (
              <div key={item.title}>
                <div style={{ marginBottom: 14 }}>{item.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 500, color: "var(--color-text)", marginBottom: 8, lineHeight: "var(--lh-lg)" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: "var(--lh-sm)" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <Link href="/apply" style={{
            display: "inline-flex", alignItems: "center", height: 48, padding: "0 28px",
            background: "var(--color-canvas)", borderRadius: "var(--radius-md)",
            fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text)",
            textDecoration: "none", transition: "opacity 150ms ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
          >
            Apply to host →
          </Link>
        </div>
      </section>

      {/* ── CHEF APPLICATION ──────────────────────────────────────────────── */}
      <section style={{ background: "var(--color-surface)", padding: "96px 32px" }} id="apply">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <SectionLabel>Join Suppr</SectionLabel>
          <SectionHeadline style={{ marginBottom: 12 }}>Apply to host.</SectionHeadline>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", lineHeight: "var(--lh-base)", marginBottom: 40 }}>
            We review every application personally. If approved, you'll have your first event live within a week.
          </p>

          {appState.submitted ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              {/* Checkmark animation */}
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-paid-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: "suppr-fade-in 400ms ease-out" }}>
                  <path d="M6 14l6 6L22 8" stroke="var(--color-paid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 500, color: "var(--color-text)", marginBottom: 8 }}>Application received.</p>
              <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", marginBottom: 20 }}>We'll be in touch within 48 hours.</p>
              <a href="#" style={{ fontSize: "var(--text-sm)", color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>Follow us on Instagram for updates →</a>
            </div>
          ) : (
            <form onSubmit={handleApplySubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { label: "Full name *", key: "name", type: "text", placeholder: "Your name" },
                { label: "Email *", key: "email", type: "email", placeholder: "you@example.com" },
                { label: "City *", key: "city", type: "text", placeholder: "Oakland, CA" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type} required placeholder={f.placeholder}
                    value={(form as unknown as Record<string, string>)[f.key]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", height: 44, padding: "0 14px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", marginBottom: 10 }}>Type of experiences</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Supper clubs", "Chef dinners", "Private dining", "Cooking workshops", "Tastings", "Pop-ups"].map(t => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={form.types.includes(t)} onChange={() => toggleType(t)} style={{ accentColor: "var(--color-accent)", width: 14, height: 14 }} />
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>Tell us about your cooking and events *</label>
                <textarea required rows={5} value={form.story}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(p => ({ ...p, story: e.target.value }))}
                  placeholder="What do you cook, who do you cook for, and what makes your events special?"
                  style={{ width: "100%", padding: "12px 14px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>Instagram or website</label>
                <input type="url" placeholder="https://instagram.com/yourhandle"
                  value={form.link}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, link: e.target.value }))}
                  style={{ width: "100%", height: 44, padding: "0 14px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button type="submit" disabled={appState.submitting} style={{
                height: 48, background: "var(--color-text)", border: "none",
                borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", fontWeight: 600,
                color: "var(--color-canvas)", cursor: appState.submitting ? "wait" : "pointer",
                opacity: appState.submitting ? 0.7 : 1, transition: "opacity 150ms ease",
              }}>
                {appState.submitting ? "Submitting…" : "Apply to host"}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

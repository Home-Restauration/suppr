"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

function useInView(): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null!);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Section({ children, bg, id }: { children: React.ReactNode; bg?: string; id?: string }) {
  const [ref, visible] = useInView();
  return (
    <section id={id} ref={ref} style={{ background: bg ?? "var(--color-canvas)", padding: "96px 32px" }}>
      <div style={{
        maxWidth: 1120, margin: "0 auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 400ms ease-out, transform 400ms ease-out",
      }}>
        {children}
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{children}</p>;
}

function SectionHeadline({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 500, color: "var(--color-text)", lineHeight: "var(--lh-3xl)", ...style }}>{children}</h2>;
}

function Photo({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "relative", background: "var(--color-surface-2)", overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, color-mix(in srgb, var(--color-accent-tint) 55%, transparent), color-mix(in srgb, var(--color-surface-2) 80%, transparent))" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textAlign: "center", padding: "0 24px", lineHeight: "var(--lh-xs)" }}>{label}</p>
      </div>
    </div>
  );
}

const FEATURES = [
  { title: "Event builder", desc: "8-step wizard with AI autofill, templates, and drag-to-reorder menus. Publish in minutes." },
  { title: "Guest management", desc: "Full guest list with dietary summaries, contact details, and booking status at a glance." },
  { title: "Dietary collection", desc: "Big 9 allergens + restrictions collected per guest, every booking. Automatically." },
  { title: "Payment processing", desc: "Stripe Connect. Full line-item ledger. Payouts within 2 business days." },
  { title: "AI concierge", desc: "Takes bookings by text on WhatsApp and iMessage. Handles every guest end to end." },
  { title: "Feed and marketing", desc: "AI drafts posts from your event photos. One tap to publish. Your story, automated." },
  { title: "Financial reports", desc: "Date-range reports with sales, tips, taxes, fees. QuickBooks-ready CSV anytime." },
  { title: "Team permissions", desc: "Granular access for sous chefs, event coordinators, and front-of-house staff." },
];

const FAQS = [
  {
    q: "How does approval work?",
    a: "We review every application personally — usually within 2 business days. We look at your experience, the quality of your events, and your community. If approved, you'll receive an onboarding link to set up your profile and first event.",
  },
  {
    q: "When do I get paid?",
    a: "Payouts land in your connected bank account within 2 business days after each event. You can see every line item — subtotal, tip, tax, platform fee, processor fee — in your reports.",
  },
  {
    q: "Can I set my own cancellation policy?",
    a: "Yes. You set cancellation windows and refund percentages per event. Guests self-serve cancellations within your policy; anything outside your policy routes to you for approval.",
  },
  {
    q: "What does the AI actually do?",
    a: "On the Chef + AI tier, the AI takes bookings by text on WhatsApp and iMessage, collects dietary info per guest, drafts your event descriptions and feed posts, sends reminders and address releases on schedule, and handles guest inquiries — all without you touching your phone.",
  },
  {
    q: "Is there a minimum number of events?",
    a: "No. Cook when you want. Some chefs host weekly; others run one seasonal dinner a quarter. Suppr works around your schedule.",
  },
  {
    q: "What does the platform fee cover?",
    a: "The guest pays a booking fee on top of your ticket price. That covers payment processing, SMS and email confirmations, address release, and platform infrastructure. You keep 100% of your ticket price plus tips.",
  },
];

export default function ForChefsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroMounted, setHeroMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroMounted(true), 80); return () => clearTimeout(t); }, []);

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "70vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <Photo label="Chef at work — warm kitchen light, plating a course" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "relative", zIndex: 1, padding: "120px 48px 80px", maxWidth: 760 }}>
          <p style={{
            fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.12em",
            color: "var(--color-accent)", textTransform: "uppercase", marginBottom: 20,
            opacity: heroMounted ? 1 : 0, transition: "opacity 600ms ease",
          }}>
            For chefs
          </p>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--color-text)",
            fontSize: "clamp(32px, 4.5vw, 52px)", lineHeight: 1.05, marginBottom: 24,
            opacity: heroMounted ? 1 : 0, transform: heroMounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 600ms 100ms ease-out, transform 600ms 100ms ease-out",
          }}>
            Built for chefs who cook with intention.
          </h1>
          <p style={{
            fontSize: "var(--text-lg)", color: "var(--color-text-2)", lineHeight: "var(--lh-lg)", marginBottom: 36, maxWidth: 520,
            opacity: heroMounted ? 1 : 0, transition: "opacity 600ms 250ms ease",
          }}>
            Run your entire culinary experience business from one place. Events, guests, dietary, payments, comms — and an AI that handles the rest.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: heroMounted ? 1 : 0, transition: "opacity 600ms 400ms ease" }}>
            <Link href="/apply" style={{
              display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px",
              background: "var(--color-text)", borderRadius: "var(--radius-md)",
              fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-canvas)", textDecoration: "none",
            }}>
              Apply to host
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────────── */}
      <Section bg="var(--color-surface)">
        <SectionLabel>Platform features</SectionLabel>
        <SectionHeadline style={{ marginBottom: 48 }}>Everything you need. Nothing you don't.</SectionHeadline>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} style={{
              background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
              borderRadius: "var(--radius-lg)", padding: "20px 22px",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "var(--radius-sm)",
                background: "var(--color-accent-tint)", display: "flex", alignItems: "center",
                justifyContent: "center", marginBottom: 14,
              }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, color: "var(--color-accent-deep)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 500, color: "var(--color-text)", marginBottom: 8 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: "var(--lh-sm)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <Section id="pricing">
        <SectionLabel>Pricing</SectionLabel>
        <SectionHeadline style={{ marginBottom: 48 }}>Simple. Transparent. Chef-first.</SectionHeadline>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, maxWidth: 700 }}>
          {/* Basic */}
          <div style={{
            background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-lg)", padding: "32px 28px",
          }}>
            <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Basic</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", fontWeight: 500, color: "var(--color-text)", marginBottom: 4 }}>Free</p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: 28 }}>Platform takes a small booking fee</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {["Full event management", "Guest and dietary collection", "Payment processing", "SMS and email confirmations", "Team access"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="var(--color-paid)" strokeWidth="1" /><path d="M4.5 7l2 2 3-3" stroke="var(--color-paid)" strokeWidth="1.1" strokeLinecap="round" /></svg>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>{f}</span>
                </div>
              ))}
            </div>
            <Link href="/apply" style={{
              display: "flex", alignItems: "center", justifyContent: "center", height: 42,
              border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)",
              fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", textDecoration: "none",
            }}>
              Get started free →
            </Link>
          </div>

          {/* Chef + AI */}
          <div style={{
            background: "var(--color-text)", border: "0.5px solid var(--color-text)",
            borderRadius: "var(--radius-lg)", padding: "32px 28px", position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -12, right: 20,
              background: "var(--color-accent)", borderRadius: 99, padding: "4px 12px",
              fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.05em",
            }}>
              MOST POPULAR
            </div>
            <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Chef + AI</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", fontWeight: 500, color: "var(--color-canvas)" }}>$20</p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>/mo + usage</p>
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: 28 }}>Everything in Basic, plus:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[
                "AI takes bookings by text / WhatsApp",
                "Event autofill from templates",
                "Guest communication assistant",
                "Loyalty and re-engagement agent",
                "Private inquiry → quote automation",
                "Feed post drafting",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="var(--color-accent)" strokeWidth="1" /><path d="M4.5 7l2 2 3-3" stroke="var(--color-accent)" strokeWidth="1.1" strokeLinecap="round" /></svg>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>{f}</span>
                </div>
              ))}
            </div>
            <Link href="/apply" style={{
              display: "flex", alignItems: "center", justifyContent: "center", height: 42,
              background: "var(--color-accent)", borderRadius: "var(--radius-md)",
              fontSize: "var(--text-sm)", fontWeight: 600, color: "#fff", textDecoration: "none",
            }}>
              Apply to host →
            </Link>
          </div>
        </div>
      </Section>

      {/* ── HOW PAYOUTS WORK ──────────────────────────────────────────────── */}
      <Section bg="var(--color-surface)">
        <SectionLabel>Payouts</SectionLabel>
        <SectionHeadline style={{ marginBottom: 48 }}>Get paid. Fast.</SectionHeadline>
        <div style={{ display: "flex", gap: 0, maxWidth: 800, position: "relative" }}>
          <div style={{ position: "absolute", top: 20, left: "8%", right: "8%", height: "0.5px", background: "var(--color-hairline)" }} />
          {[
            { num: 1, title: "Guest pays", desc: "Secure checkout via Stripe. Full line-item breakdown before payment." },
            { num: 2, title: "Platform takes fee", desc: "A small booking fee is deducted. You keep 100% of your ticket price + tips." },
            { num: 3, title: "Chef receives payout", desc: "Funds arrive in your bank within 2 business days after the event." },
          ].map((s, i) => (
            <div key={s.num} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 16px" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: i === 2 ? "var(--color-paid-bg)" : "var(--color-surface-2)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
                border: "0.5px solid var(--color-hairline)", position: "relative", zIndex: 1,
              }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, color: i === 2 ? "var(--color-paid)" : "var(--color-text)" }}>{s.num}</span>
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 500, color: "var(--color-text)", marginBottom: 8 }}>{s.title}</p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: "var(--lh-sm)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <Section>
        <SectionLabel>From the chefs</SectionLabel>
        <SectionHeadline style={{ marginBottom: 48 }}>Heard at the table.</SectionHeadline>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { quote: "Suppr handles everything I used to spend 4 hours doing before each event. Now I just cook.", chef: "Chef Kiano Okafor", city: "Oakland" },
            { quote: "My guests love it. The booking experience is seamless, and I know every dietary restriction before they walk in the door.", chef: "Maya Ito", city: "San Francisco" },
          ].map(t => (
            <div key={t.chef} style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", padding: "28px 24px" }}>
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none" style={{ marginBottom: 16 }}>
                <path d="M0 18V10.4C0 7.6.6 5.3 1.8 3.4 3 1.5 4.8.4 7.2.4v2.4C5.6 2.8 4.5 3.7 3.8 5c-.7 1.3-1 2.8-.8 4.4H6V18H0zm12 0V10.4c0-2.8.6-5.1 1.8-7 1.2-1.9 3-3 5.4-3v2.4c-1.6 0-2.7.9-3.4 2.2-.7 1.3-1 2.8-.8 4.4H18V18h-6z" fill="var(--color-accent-tint)" />
              </svg>
              <Photo label={`Portrait · ${t.chef}`} style={{ width: 48, height: 48, borderRadius: "50%", marginBottom: 16 }} />
              <p style={{ fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: "var(--lh-base)", marginBottom: 16, fontStyle: "italic" }}>"{t.quote}"</p>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>{t.chef}</p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{t.city}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <Section bg="var(--color-surface)">
        <SectionLabel>Questions</SectionLabel>
        <SectionHeadline style={{ marginBottom: 40 }}>Things chefs ask.</SectionHeadline>
        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 0 }}>
          {FAQS.map((faq, i) => (
            <div key={faq.q} style={{ borderBottom: "0.5px solid var(--color-hairline)" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%", display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "20px 0", background: "none",
                  border: "none", cursor: "pointer", gap: 16, textAlign: "left",
                }}
              >
                <span style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--color-text)", lineHeight: "var(--lh-base)" }}>{faq.q}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transition: "transform 200ms ease", transform: openFaq === i ? "rotate(180deg)" : "none" }}>
                  <path d="M3 6l5 5 5-5" stroke="var(--color-text-muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div style={{
                overflow: "hidden", maxHeight: openFaq === i ? 200 : 0,
                transition: "max-height 250ms ease-out",
              }}>
                <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", lineHeight: "var(--lh-base)", paddingBottom: 20 }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{ background: "var(--color-canvas)", padding: "128px 32px", textAlign: "center" }}>
        <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>Ready?</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 500, color: "var(--color-text)", lineHeight: 1.05, marginBottom: 24, maxWidth: 640, margin: "0 auto 24px" }}>
          Ready to host your first experience?
        </h2>
        <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-2)", marginBottom: 40 }}>We review every application personally. No pitch deck required.</p>
        <Link href="/apply" style={{
          display: "inline-flex", alignItems: "center", height: 52, padding: "0 32px",
          background: "var(--color-text)", borderRadius: "var(--radius-md)",
          fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-canvas)", textDecoration: "none",
          transition: "opacity 150ms ease",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
        >
          Apply to host
        </Link>
      </section>
    </>
  );
}

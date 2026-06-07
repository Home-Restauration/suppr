"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { EASE_OUT_EXPO, EASE_OUT_SOFT } from "./motion-config";

/* ─── types ─── */

type EventSlot = {
  id: string;
  title: string;
  chef: string;
  city: string;
  date: string;
  price: number;
  seats: string;
  tilt: number;
};

/* ─── data ─── */

const SESSIONS: EventSlot[] = [
  { id: "1", title: "Kaiseki: A Dialogue with Seasons", chef: "Chef Hiroto N.", city: "San Francisco", date: "Tonight · 7 pm", price: 165, seats: "2 left", tilt: -2 },
  { id: "2", title: "Supper Club: Southern Roots", chef: "Chef Imani B.", city: "New Orleans", date: "Fri Jun 6 · 7:30 pm", price: 95, seats: "4 left", tilt: 2 },
  { id: "3", title: "Roman Trattoria for Eight", chef: "Chef Marco V.", city: "Brooklyn", date: "Sat Jun 7 · 8 pm", price: 115, seats: "Full table", tilt: -1.5 },
  { id: "4", title: "Garden Tasting Menu", chef: "Chef Aisha W.", city: "Chicago", date: "Sun Jun 8 · 6:30 pm", price: 140, seats: "3 left", tilt: 1.5 },
  { id: "5", title: "Masa Madre: A Fermentation Study", chef: "Chef Sofía R.", city: "Los Angeles", date: "Tonight · 8 pm", price: 125, seats: "6 left", tilt: -2.5 },
];

const TICKER = "PRIVATE DINNERS · CHEF'S TABLES · SUPPER CLUBS · HOME KITCHENS · FOOD AS ART · TONIGHT · CHEF-DRIVEN · INTIMATE · ";

const STATS = [
  { value: "48,000+", label: "Diners — and counting", gold: true },
  { value: "4.9 ★", label: "Average rating across all sessions" },
  { value: "1,200+", label: "Active chef-artists on the platform" },
  { value: "< 2 min", label: "Average time from browse to confirmed seat" },
];

const ZERO_ADMIN = [
  { n: "01", title: "AI-drafted menus", desc: "Describe your concept in a sentence. The AI writes copy, descriptions, and wine pairings." },
  { n: "02", title: "Instant booking pages", desc: "Your listing is live in minutes, with pricing, availability, and guest intake built in." },
  { n: "03", title: "Guest communications", desc: "Confirmations, allergy follow-ups, day-of reminders — all sent automatically, in your voice." },
  { n: "04", title: "Payment & tips", desc: "Stripe Checkout collects everything. You get paid the next morning, no chasing." },
  { n: "05", title: "Allergy intelligence", desc: "Every guest's restrictions are surfaced before service. No last-minute surprises." },
  { n: "06", title: "Event-day command", desc: "Cover count, flagged allergies, real-time revenue — one screen, full picture." },
];

/* ─── hooks ─── */

function usePRM(): boolean {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setV(mq.matches);
    const h = () => setV(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return v;
}

/* ─── shared ─── */

function WordReveal({ text, delay = 0, rm }: { text: string; delay?: number; rm: boolean }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
          <motion.span
            initial={{ y: rm ? 0 : "115%", opacity: rm ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO, delay: delay + i * 0.07 }}
            style={{ display: "inline-block", marginRight: "0.25em" }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </>
  );
}

function ScrollReveal({ children, delay = 0, rm }: { children: React.ReactNode; delay?: number; rm: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: rm ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.75, ease: EASE_OUT_SOFT, delay }}
    >
      {children}
    </motion.div>
  );
}

function LineReveal({ children, delay = 0, rm }: { children: React.ReactNode; delay?: number; rm: boolean }) {
  if (rm) {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay }}
        style={{ display: "block" }}
      >
        {children}
      </motion.span>
    );
  }
  return (
    <span style={{ display: "block", overflow: "hidden" }}>
      <motion.span
        initial={{ y: "115%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, margin: "-12%" }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay }}
        style={{ display: "block" }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ─── session card ─── */

function SessionCard({ slot, rm }: { slot: EventSlot; rm: boolean }) {
  const [hovered, setHovered] = useState(false);
  const isTonight = slot.date.includes("Tonight");

  return (
    <motion.div
      data-cursor="Reserve"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={rm ? {} : { rotate: hovered ? 0 : slot.tilt, y: hovered ? -8 : 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        flexShrink: 0,
        width: 260,
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--mk-surface)",
        border: "1px solid var(--mk-faint)",
        boxShadow: hovered ? "0 24px 60px rgba(0,0,0,0.13)" : "0 2px 12px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.25s ease",
        userSelect: "none",
      }}
    >
      <div style={{ height: 164, overflow: "hidden", position: "relative" }}>
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #EAE7DF 0%, #DAD6CC 100%)",
          transform: hovered ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.3s ease",
        }}>
          <span style={{ fontSize: 10, color: "#B5B0A8", letterSpacing: "0.12em", textTransform: "uppercase" }}>Photo</span>
        </div>
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: isTonight ? "var(--mk-gold)" : "rgba(17,17,16,0.7)",
          color: "white", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.06em", padding: "3px 9px",
          borderRadius: 999, textTransform: "uppercase",
        }}>
          {isTonight ? "Tonight" : "Upcoming"}
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <p style={{ fontSize: 11, color: "var(--mk-muted)", marginBottom: 6 }}>{slot.chef} · {slot.city}</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--mk-ink)", lineHeight: 1.3, letterSpacing: "-0.02em", marginBottom: 12 }}>
          {slot.title}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 12, color: "var(--mk-mid)" }}>{slot.date}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--mk-ink)", letterSpacing: "-0.02em" }}>${slot.price}</span>
        </div>
        <p style={{
          fontSize: 11, fontWeight: 600, marginTop: 8,
          color: slot.seats === "Full table" ? "var(--mk-muted)" : "var(--mk-gold)",
        }}>
          {slot.seats === "Full table" ? "Private booking available" : `${slot.seats} available`}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── 1. HERO ─── */

function HeroSection({ rm }: { rm: boolean }) {
  const { scrollYProgress } = useScroll();
  const ghostY = useTransform(scrollYProgress, [0, 0.4], rm ? [0, 0] : [0, 80]);

  return (
    <section style={{
      minHeight: "100dvh",
      background: "var(--mk-studio)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: "0 40px 72px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ghosted background word */}
      <motion.div aria-hidden style={{ y: ghostY, position: "absolute", top: "6%", left: "-2%", pointerEvents: "none" }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(160px, 28vw, 480px)",
          fontWeight: 700,
          fontStyle: "italic",
          color: "rgba(255,255,255,0.022)",
          lineHeight: 0.85,
          whiteSpace: "nowrap",
          userSelect: "none",
          letterSpacing: "-0.04em",
        }}>
          CHEF
        </span>
      </motion.div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ fontSize: 11, color: "var(--mk-gold)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 28, fontWeight: 700 }}
        >
          Private dinners · Supper clubs · Chef's tables
        </motion.p>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(48px, 9vw, 128px)",
          lineHeight: 0.94,
          color: "white",
          letterSpacing: "-0.035em",
          fontWeight: 600,
          marginBottom: 44,
          maxWidth: "16ch",
        }}>
          <WordReveal text="The chef's table" delay={0.35} rm={rm} />
          {" "}
          <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
            <motion.span
              initial={{ y: rm ? 0 : "115%", opacity: rm ? 0 : 1 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.85, ease: EASE_OUT_EXPO, delay: 0.84 }}
              style={{ display: "inline-block", color: "var(--mk-gold)", fontStyle: "italic" }}
            >
              comes to you.
            </motion.span>
          </span>
        </h1>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 48, flexWrap: "wrap" }}>
          <motion.p
            initial={{ opacity: 0, y: rm ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay: 1.05 }}
            style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, maxWidth: 400, letterSpacing: "-0.01em" }}
          >
            Real chefs. Real homes. Dinners that feel like being let into someone's world.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: rm ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay: 1.18 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <Link href="/feed" data-cursor="Explore" style={{
              display: "inline-block", borderRadius: 999, padding: "13px 28px",
              fontSize: 15, fontWeight: 600, textDecoration: "none",
              background: "white", color: "var(--mk-studio)", letterSpacing: "-0.01em",
              transition: "background 0.15s ease, color 0.15s ease",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mk-gold)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "var(--mk-studio)"; }}
            >
              Find tonight's table
            </Link>
            <Link href="/for-chefs" style={{
              display: "inline-block", borderRadius: 999, padding: "13px 28px",
              fontSize: 15, fontWeight: 500, textDecoration: "none",
              color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.16)",
              letterSpacing: "-0.01em", transition: "border-color 0.15s ease, color 0.15s ease",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
            >
              Become a host
            </Link>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          style={{ marginTop: 28, fontSize: 12, color: "rgba(255,255,255,0.22)", letterSpacing: "-0.01em" }}
        >
          ★ 4.9 · 48,000+ diners · no account needed
        </motion.p>
      </div>

      {/* Scroll pulse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
        style={{ position: "absolute", bottom: 36, right: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
      >
        <motion.div
          animate={rm ? {} : { scaleY: [1, 0.4, 1], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 1, height: 40, background: "rgba(255,255,255,0.25)", transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
}

/* ─── 2. TICKER ─── */

function Ticker() {
  const t = `${TICKER}${TICKER}`;
  return (
    <div style={{ background: "var(--mk-studio)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "12px 0", overflow: "hidden" }}>
      <div className="mk-ticker" style={{ whiteSpace: "nowrap", display: "inline-block" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(200,137,26,0.55)", textTransform: "uppercase" }}>
          {t}{t}
        </span>
      </div>
      <style>{`
        @keyframes mk-t { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .mk-ticker { animation: mk-t 24s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .mk-ticker { animation: none; } }
      `}</style>
    </div>
  );
}

/* ─── 3. TONIGHT ─── */

function TonightSection({ rm }: { rm: boolean }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    startX.current = e.clientX;
    startScroll.current = stripRef.current?.scrollLeft ?? 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current || !stripRef.current) return;
    stripRef.current.scrollLeft = startScroll.current - (e.clientX - startX.current);
  }
  function onPointerUp() { dragging.current = false; }

  return (
    <section id="tonight" style={{ background: "var(--mk-paper)", paddingTop: 88, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", paddingLeft: 40, paddingRight: 40, marginBottom: 40 }}>
        <ScrollReveal rm={rm}>
          <p style={{ fontSize: 11, color: "var(--mk-gold)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
            On the pass tonight
          </p>
        </ScrollReveal>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(28px, 4.5vw, 52px)",
          lineHeight: 1.05,
          color: "var(--mk-ink)",
          letterSpacing: "-0.03em",
          fontWeight: 600,
        }}>
          <LineReveal delay={0} rm={rm}>Every seat is a front-row view</LineReveal>
          <LineReveal delay={0.1} rm={rm}>
            <em style={{ fontStyle: "italic", color: "var(--mk-gold)" }}>into the chef's world.</em>
          </LineReveal>
        </div>
      </div>

      <div
        ref={stripRef}
        className="mk-strip"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          display: "flex", gap: 20,
          overflowX: "auto",
          paddingLeft: 40, paddingRight: 40, paddingBottom: 16,
          cursor: "grab",
        }}
      >
        {SESSIONS.map((s) => <SessionCard key={s.id} slot={s} rm={rm} />)}
      </div>

      <ScrollReveal delay={0.1} rm={rm}>
        <div style={{ padding: "20px 40px 0" }}>
          <Link href="/feed" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            textDecoration: "none", fontSize: 14, fontWeight: 600,
            color: "var(--mk-ink)", letterSpacing: "-0.01em",
            borderBottom: "1px solid var(--mk-ink)", paddingBottom: 2,
          }}>
            Browse all sessions →
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ─── 4. MANIFESTO ─── */

function ManifestoSection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-studio)", padding: "88px 40px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <blockquote style={{ margin: 0 }}>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 4.5vw, 56px)",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            fontWeight: 500,
            fontStyle: "italic",
          }}>
            <LineReveal delay={0} rm={rm}>
              <span style={{ color: "white" }}>"Food is the most intimate art form.</span>
            </LineReveal>
            <LineReveal delay={0.12} rm={rm}>
              <span style={{ color: "white" }}>You don't hang it on a wall —</span>
            </LineReveal>
            <LineReveal delay={0.24} rm={rm}>
              <span style={{ color: "var(--mk-gold)" }}>you take it into your body."</span>
            </LineReveal>
          </div>
          <ScrollReveal delay={0.35} rm={rm}>
            <p style={{ marginTop: 28, fontSize: 13, color: "rgba(255,255,255,0.25)", letterSpacing: "0.01em" }}>
              — The Suppr philosophy
            </p>
          </ScrollReveal>
        </blockquote>
      </div>
    </section>
  );
}

/* ─── 5. CHEF SPOTLIGHT ─── */

function ChefSection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-paper)", padding: "88px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}
        className="mk-chef-grid"
      >
        {/* Photo wipe */}
        <motion.div
          initial={rm ? { opacity: 0 } : { clipPath: "inset(0 100% 0 0)", opacity: 0 }}
          whileInView={rm ? { opacity: 1 } : { clipPath: "inset(0 0% 0 0)", opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
          style={{ overflow: "hidden" }}
        >
          <motion.div
            initial={rm ? {} : { scale: 1.07 }}
            whileInView={rm ? {} : { scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.5, ease: EASE_OUT_EXPO }}
          >
            <div style={{
              width: "100%", aspectRatio: "4/5", maxHeight: 540,
              background: "linear-gradient(160deg, #ECEAE2 0%, #D8D4C9 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 10, color: "#B5B0A8", letterSpacing: "0.14em", textTransform: "uppercase" }}>Photo</span>
            </div>
          </motion.div>
        </motion.div>

        <div>
          <ScrollReveal delay={0.1} rm={rm}>
            <p style={{ fontSize: 11, color: "var(--mk-gold)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 24 }}>
              Artist spotlight
            </p>
          </ScrollReveal>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 3vw, 40px)",
            lineHeight: 1.15, color: "var(--mk-ink)",
            letterSpacing: "-0.03em", fontWeight: 600, marginBottom: 24,
          }}>
            <LineReveal delay={0.15} rm={rm}>"I spent 12 years in</LineReveal>
            <LineReveal delay={0.25} rm={rm}>Michelin kitchens. I'd rather</LineReveal>
            <LineReveal delay={0.35} rm={rm}>
              cook for{" "}
              <em style={{ fontStyle: "italic", color: "var(--mk-gold)" }}>eight people who care.</em>
            </LineReveal>
          </div>
          <ScrollReveal delay={0.4} rm={rm}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #E2DFDA, #CAC6BC)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 9, color: "#A5A09A", letterSpacing: "0.06em" }}>PHOTO</span>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--mk-ink)", letterSpacing: "-0.02em" }}>Chef Marcus T.</p>
                <p style={{ fontSize: 13, color: "var(--mk-mid)" }}>San Francisco · Seasonal American</p>
              </div>
            </div>
            <Link href="/feed" data-cursor="Reserve" style={{
              display: "inline-block", textDecoration: "none", fontSize: 14,
              fontWeight: 600, color: "var(--mk-ink)",
              borderBottom: "1px solid var(--mk-faint)", paddingBottom: 3,
              letterSpacing: "-0.01em", transition: "color 0.15s ease, border-color 0.15s ease",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--mk-gold)"; e.currentTarget.style.borderColor = "var(--mk-gold)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--mk-ink)"; e.currentTarget.style.borderColor = "var(--mk-faint)"; }}
            >
              Book his next dinner →
            </Link>
          </ScrollReveal>
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .mk-chef-grid { grid-template-columns: 1fr !important; gap: 36px !important; } }`}</style>
    </section>
  );
}

/* ─── 6. HOW IT WORKS ─── */

function HowItWorks({ rm }: { rm: boolean }) {
  const STEPS = [
    { n: "1", title: "Browse tonight's canvas", body: "Filter by city, cuisine, price, or date. Every listing is a real person — vetted, background-checked, deeply passionate." },
    { n: "2", title: "Book in one text", body: "No account required. Tell us your name, note allergies, and your seat is confirmed. The chef starts prepping right away." },
    { n: "3", title: "Arrive. Be fed. Be moved.", body: "The address arrives the morning of your dinner. Payment, tip, receipt — all handled. Bring an appetite and an open mind." },
  ];
  return (
    <section id="how-it-works" style={{ background: "var(--mk-surface)", padding: "88px 40px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <ScrollReveal rm={rm}>
          <p style={{ fontSize: 11, color: "var(--mk-gold)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 48 }}>
            How it works
          </p>
        </ScrollReveal>
        {STEPS.map((s, i) => (
          <ScrollReveal key={s.n} delay={i * 0.1} rm={rm}>
            <div style={{
              display: "grid", gridTemplateColumns: "72px 1fr", gap: "0 28px",
              padding: "28px 0", borderTop: "1px solid var(--mk-faint)",
            }}>
              <p style={{
                fontFamily: "var(--font-display)", fontSize: 52, fontStyle: "italic",
                fontWeight: 300, color: "var(--mk-faint)", lineHeight: 1, letterSpacing: "-0.04em",
              }}>
                {s.n}
              </p>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--mk-ink)", marginBottom: 8, letterSpacing: "-0.02em" }}>{s.title}</p>
                <p style={{ fontSize: 14, color: "var(--mk-mid)", lineHeight: 1.7, letterSpacing: "-0.01em" }}>{s.body}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
        <div style={{ height: 1, background: "var(--mk-faint)" }} />
      </div>
    </section>
  );
}

/* ─── 7. STATS ─── */

function StatsSection({ rm }: { rm: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section ref={ref} style={{ background: "var(--mk-paper)", padding: "72px 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {STATS.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.07} rm={rm}>
            <div style={{
              display: "flex", alignItems: "baseline",
              justifyContent: "space-between", gap: 24,
              padding: "20px 0",
              borderBottom: "1px solid var(--mk-faint)",
              flexWrap: "wrap",
            }}>
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(48px, 9vw, 112px)",
                fontWeight: 700, lineHeight: 1,
                letterSpacing: "-0.04em",
                color: s.gold ? "var(--mk-gold)" : "var(--mk-ink)",
              }}>
                {rm || !inView ? s.value : s.value}
              </span>
              <span style={{
                fontSize: 14, color: "var(--mk-mid)",
                maxWidth: 220, textAlign: "right", lineHeight: 1.5, letterSpacing: "-0.01em",
              }}>
                {s.label}
              </span>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

/* ─── 8. FOR CHEFS ─── */

function ForChefsSection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-studio)", padding: "88px 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 5.5vw, 68px)",
          lineHeight: 1.0, letterSpacing: "-0.035em", fontWeight: 600,
          marginBottom: 56, maxWidth: 700,
        }}>
          <LineReveal delay={0} rm={rm}><span style={{ color: "white" }}>You cook.</span></LineReveal>
          <LineReveal delay={0.1} rm={rm}>
            <em style={{ color: "var(--mk-gold)", fontStyle: "italic" }}>We handle everything else.</em>
          </LineReveal>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0 }} className="mk-feat-grid">
          {ZERO_ADMIN.map((f, i) => (
            <ScrollReveal key={f.n} delay={i * 0.06} rm={rm}>
              <div style={{
                padding: "24px 0",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                paddingRight: i % 2 === 0 ? 40 : 0,
                paddingLeft: i % 2 === 1 ? 40 : 0,
              }}>
                <p style={{ fontSize: 10, color: "rgba(200,137,26,0.5)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>{f.n}</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: "white", letterSpacing: "-0.02em", marginBottom: 8 }}>{f.title}</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.65, letterSpacing: "-0.01em" }}>{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2} rm={rm}>
          <div style={{ marginTop: 52 }}>
            <Link href="/apply" data-cursor="Apply" style={{
              display: "inline-block", borderRadius: 999, padding: "13px 30px",
              fontSize: 15, fontWeight: 600, textDecoration: "none",
              background: "var(--mk-gold)", color: "white", letterSpacing: "-0.01em",
              transition: "opacity 0.15s ease",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Apply to host →
            </Link>
          </div>
        </ScrollReveal>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .mk-feat-grid { grid-template-columns: 1fr !important; }
          .mk-feat-grid > div { border-right: none !important; padding-right: 0 !important; padding-left: 0 !important; }
        }
      `}</style>
    </section>
  );
}

/* ─── 9. CTA BANNER ─── */

function CTASection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-studio)", padding: "0 40px 88px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <ScrollReveal rm={rm}>
          <div style={{
            position: "relative", borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "72px 56px", overflow: "hidden", textAlign: "center",
          }}>
            {!rm && (
              <motion.div
                animate={{ x: [0, 40, -30, 20, 0], y: [0, -30, 20, -10, 0], scale: [1, 1.15, 0.9, 1.1, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                aria-hidden
                style={{
                  position: "absolute", width: 480, height: 480, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(200,137,26,0.18) 0%, transparent 65%)",
                  filter: "blur(56px)",
                  top: "50%", left: "50%", marginLeft: -240, marginTop: -240,
                  pointerEvents: "none", zIndex: 0,
                }}
              />
            )}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4.5vw, 52px)",
                lineHeight: 1.1, color: "white",
                letterSpacing: "-0.03em", fontWeight: 600, marginBottom: 18,
              }}>
                <LineReveal delay={0} rm={rm}><span style={{ color: "white" }}>A table is waiting.</span></LineReveal>
                <LineReveal delay={0.1} rm={rm}>
                  <em style={{ color: "var(--mk-gold)", fontStyle: "italic" }}>Tonight.</em>
                </LineReveal>
              </div>
              <ScrollReveal delay={0.2} rm={rm}>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.36)", lineHeight: 1.65, maxWidth: 360, margin: "0 auto 32px", letterSpacing: "-0.01em" }}>
                  No queue. No restaurant noise. Just a chef, a set menu, and the people you bring.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.3} rm={rm}>
                <Link href="/feed" data-cursor="Let's go" style={{
                  display: "inline-block", borderRadius: 999, padding: "13px 30px",
                  fontSize: 15, fontWeight: 600, background: "white",
                  color: "var(--mk-studio)", textDecoration: "none",
                  letterSpacing: "-0.01em", transition: "background 0.15s ease, color 0.15s ease",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mk-gold)"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "var(--mk-studio)"; }}
                >
                  Find tonight's table
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── PAGE ─── */

export default function MarketingHomePage() {
  const rm = usePRM();
  return (
    <>
      <HeroSection rm={rm} />
      <Ticker />
      <TonightSection rm={rm} />
      <ManifestoSection rm={rm} />
      <ChefSection rm={rm} />
      <HowItWorks rm={rm} />
      <StatsSection rm={rm} />
      <ForChefsSection rm={rm} />
      <CTASection rm={rm} />
    </>
  );
}

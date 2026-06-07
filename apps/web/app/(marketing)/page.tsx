"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
} from "framer-motion";
import { EASE_OUT_EXPO, EASE_OUT_SOFT } from "./motion-config";

/* ─── types ─────────────────────────────────────────────── */

type EventCard = {
  id: string;
  title: string;
  chef: string;
  location: string;
  date: string;
  seats: string;
  price: number;
  tag: string;
};

type StatItem = {
  value: number;
  suffix: string;
  label: string;
  coral?: boolean;
  decimals?: number;
};

type ZeroAdminFeature = { title: string; desc: string };

/* ─── data ───────────────────────────────────────────────── */

const MOCK_EVENTS: [EventCard, EventCard, EventCard] = [
  {
    id: "1",
    title: "Omakase in Hayes Valley",
    chef: "Chef Kenji M.",
    location: "San Francisco",
    date: "Tonight · 7 pm",
    seats: "2 seats left",
    price: 145,
    tag: "Tonight",
  },
  {
    id: "2",
    title: "Supper Club: Coastal Italian",
    chef: "Chef Maria C.",
    location: "Brooklyn",
    date: "Sat Jun 7 · 7 pm",
    seats: "4 seats left",
    price: 95,
    tag: "Weekend",
  },
  {
    id: "3",
    title: "Tasting Menu: The Garden",
    chef: "Chef Aisha W.",
    location: "Chicago",
    date: "Fri Jun 6 · 7:30 pm",
    seats: "Full table",
    price: 125,
    tag: "Trending",
  },
];

const PRESS = [
  "New York Times",
  "Eater",
  "Bon Appétit",
  "Food & Wine",
  "The Atlantic",
  "Vogue",
  "GQ",
  "Condé Nast Traveler",
];

const HOW_IT_WORKS = [
  {
    num: "1",
    title: "Browse tonight's tables",
    desc: "Filter by city, date, cuisine, or price. Every listing is a real person cooking in their home or private space — curated and background-checked.",
  },
  {
    num: "2",
    title: "Book in one tap",
    desc: "No account required. Enter your name, note any allergies, and you're confirmed. The chef receives your details and starts prepping.",
  },
  {
    num: "3",
    title: "Just show up",
    desc: "Arrive at the address (revealed 24 h before the event), sit down, and let the chef do the rest. Payment, tip, and receipt — all handled.",
  },
];

const STATS: StatItem[] = [
  { value: 48000, suffix: "+", label: "Diners served", coral: true },
  { value: 4.9, suffix: "", label: "Average rating", decimals: 1 },
  { value: 1200, suffix: "+", label: "Active chefs" },
  { value: 2, suffix: " min", label: "Average booking time" },
];

const ZERO_ADMIN: ZeroAdminFeature[] = [
  { title: "AI-drafted menus", desc: "Describe your concept; the AI writes the full menu copy." },
  { title: "Instant booking pages", desc: "Your listing goes live in minutes with pricing and availability built in." },
  { title: "Guest communications", desc: "Confirmations, allergy follow-ups, and reminders sent automatically." },
  { title: "Payment & tip handling", desc: "Stripe Checkout collects payment. You get paid out the next day." },
  { title: "Dietary flagging", desc: "Allergies and restrictions surfaced before service — no surprises." },
  { title: "Event-day dashboard", desc: "Cover count, allergy alerts, and real-time revenue in one glance." },
];

const WHY = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="10" cy="10" r="8" />
        <path d="M13.5 6.5l-1.8 5.2-5.2 1.8 1.8-5.2 5.2-1.8z" />
        <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    title: "Discover something real",
    desc: "Not a restaurant, not a meal kit. A chef who has trained for years, cooking for a dozen people in their home.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
        <rect x="4" y="2" width="12" height="16" rx="2" />
        <path d="M7 7h6M7 11h4" />
        <line x1="10" y1="15" x2="10" y2="15" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Book by text, confirm in seconds",
    desc: "Message our concierge the way you'd text a friend. No login, no app required — your seat is held in real time.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
        <path d="M4 10l4 4 8-8" />
      </svg>
    ),
    title: "Just show up",
    desc: "Everything else is handled. Allergies noted, payment settled, address revealed the morning of. You bring the appetite.",
  },
];

/* ─── shared hooks ───────────────────────────────────────── */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useCountUp(target: number, active: boolean, duration = 1600, decimals = 0): number {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    let start: number | null = null;
    let rafId: number;
    function step(ts: number) {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const raw = eased * target;
      setCount(decimals > 0 ? Math.round(raw * 10 ** decimals) / 10 ** decimals : Math.round(raw));
      if (p < 1) rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [active, target, duration, decimals]);

  return count;
}

/* ─── shared components ──────────────────────────────────── */

function HeroLine({
  children,
  delay,
  rm,
}: {
  children: React.ReactNode;
  delay: number;
  rm: boolean;
}) {
  if (rm) {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
        initial={{ y: "110%", opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay }}
        style={{ display: "block" }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function LineReveal({
  children,
  delay = 0,
  rm,
}: {
  children: React.ReactNode;
  delay?: number;
  rm: boolean;
}) {
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
        initial={{ y: "110%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true, margin: "-12%" }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay }}
        style={{ display: "block" }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function FadeUp({
  children,
  delay = 0,
  rm,
}: {
  children: React.ReactNode;
  delay?: number;
  rm: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: rm ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay }}
    >
      {children}
    </motion.div>
  );
}

function MagneticPill({
  href,
  children,
  primary,
  rm,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  rm: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);
  const x = useSpring(xRaw, { stiffness: 500, damping: 22 });
  const y = useSpring(yRaw, { stiffness: 500, damping: 22 });
  const [hovered, setHovered] = useState(false);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (rm || !divRef.current) return;
    const r = divRef.current.getBoundingClientRect();
    xRaw.set((e.clientX - r.left - r.width / 2) * 0.2);
    yRaw.set((e.clientY - r.top - r.height / 2) * 0.2 - 2);
  }
  function onLeave() {
    xRaw.set(0);
    yRaw.set(0);
    setHovered(false);
  }

  return (
    <motion.div
      ref={divRef}
      style={{ x, y, display: "inline-block" }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
    >
      <Link
        href={href}
        style={{
          display: "inline-block",
          borderRadius: 999,
          padding: "13px 28px",
          fontSize: 15,
          fontWeight: 500,
          textDecoration: "none",
          letterSpacing: "-0.01em",
          transition: "box-shadow 0.2s ease, background 0.15s ease",
          boxShadow: hovered
            ? primary
              ? "0 12px 32px rgba(0,0,0,0.18)"
              : "0 8px 20px rgba(0,0,0,0.06)"
            : "none",
          ...(primary
            ? { background: "var(--mk-ink)", color: "var(--mk-bg)" }
            : {
                background: "var(--mk-bg)",
                color: "var(--mk-ink)",
                border: "1px solid #DDDDDD",
              }),
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}

/* ─── EventCard ──────────────────────────────────────────── */

function HeroEventCard({
  title,
  chef,
  location,
  date,
  seats,
  price,
  tag,
  featured,
}: EventCard & { featured?: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4, boxShadow: "0 24px 64px rgba(0,0,0,0.13)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        width: featured ? 288 : 252,
        borderRadius: 16,
        background: "var(--mk-bg)",
        border: "1px solid var(--mk-line)",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: featured
          ? "0 12px 40px rgba(0,0,0,0.09)"
          : "0 2px 16px rgba(0,0,0,0.05)",
        userSelect: "none",
      }}
    >
      {/* Photo */}
      <div style={{ height: featured ? 176 : 152, overflow: "hidden", position: "relative" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#F3F0EC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.25s ease",
          }}
        >
          <span style={{ fontSize: 11, color: "#C4BEB6", letterSpacing: "0.1em" }}>PHOTO</span>
        </div>
        <span style={{
          position: "absolute",
          top: 12, left: 12,
          background: "var(--mk-accent)",
          color: "white",
          fontSize: 11,
          fontWeight: 600,
          padding: "3px 10px",
          borderRadius: 999,
          letterSpacing: "0.04em",
        }}>
          {tag}
        </span>
      </div>

      {/* Details */}
      <div style={{ padding: "14px 16px 16px" }}>
        <p style={{ fontSize: 12, color: "var(--mk-ink-3)", marginBottom: 5, letterSpacing: "-0.01em" }}>
          {chef} · {location}
        </p>
        <p style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--mk-ink)",
          marginBottom: 10,
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
        }}>
          {title}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--mk-ink-2)" }}>{date}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--mk-ink)" }}>${price}</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--mk-accent)", marginTop: 8, fontWeight: 500 }}>{seats}</p>
      </div>
    </motion.div>
  );
}

/* ─── 1. HERO ────────────────────────────────────────────── */

function HeroSection({ rm }: { rm: boolean }) {
  const { scrollYProgress } = useScroll();
  const c1y = useTransform(scrollYProgress, [0, 0.4], [0, rm ? 0 : -70]);
  const c2y = useTransform(scrollYProgress, [0, 0.4], [0, rm ? 0 : -40]);
  const c3y = useTransform(scrollYProgress, [0, 0.4], [0, rm ? 0 : -90]);

  return (
    <section
      style={{ background: "var(--mk-bg)", paddingTop: 80, paddingBottom: 0 }}
      aria-labelledby="hero-heading"
    >
      {/* Text block */}
      <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", padding: "0 24px 64px" }}>
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: rm ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_SOFT }}
          style={{
            fontSize: 13,
            color: "var(--mk-ink-3)",
            letterSpacing: "0.08em",
            marginBottom: 36,
            textTransform: "uppercase",
          }}
        >
          Private dinners · Supper clubs · Chef's tables
        </motion.p>

        {/* Headline */}
        <h1
          id="hero-heading"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(44px, 7.5vw, 82px)",
            lineHeight: 1.04,
            marginBottom: 28,
            color: "var(--mk-ink)",
            letterSpacing: "-0.02em",
          }}
        >
          <HeroLine delay={0.1} rm={rm}>Why go to a restaurant</HeroLine>
          <HeroLine delay={0.2} rm={rm}>when the chef will cook</HeroLine>
          <HeroLine delay={0.3} rm={rm}>
            for{" "}
            <em style={{ color: "var(--mk-accent)", fontStyle: "italic" }}>you</em>?
          </HeroLine>
        </h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: rm ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay: 0.5 }}
          style={{
            fontSize: "clamp(16px, 2.5vw, 19px)",
            color: "var(--mk-ink-2)",
            lineHeight: 1.65,
            maxWidth: 540,
            margin: "0 auto 40px",
            letterSpacing: "-0.01em",
          }}
        >
          Discover intimate dinners, supper clubs, and chef's tables happening near
          you — real home-chef experiences, booked in a tap.
        </motion.p>

        {/* Pills */}
        <motion.div
          initial={{ opacity: 0, y: rm ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_SOFT, delay: 0.65 }}
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 }}
        >
          <MagneticPill href="/feed" primary rm={rm}>Find a table tonight</MagneticPill>
          <MagneticPill href="/for-chefs" rm={rm}>Become a host</MagneticPill>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.82 }}
          style={{
            fontSize: 13,
            color: "var(--mk-ink-3)",
            letterSpacing: "-0.01em",
          }}
        >
          ★ 4.9 · loved by{" "}
          <strong style={{ color: "var(--mk-ink-2)", fontWeight: 600 }}>48,000+</strong>{" "}
          diners · no account needed
        </motion.p>
      </div>

      {/* Cards */}
      <div style={{ background: "var(--mk-bg-soft)", padding: "56px 24px 72px" }}>
        <div style={{
          maxWidth: 920,
          margin: "0 auto",
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {/* Left card */}
          <motion.div
            style={{ y: c1y, marginTop: 28 }}
            initial={{ opacity: 0, scale: rm ? 1 : 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay: 0.95 }}
          >
            <HeroEventCard {...MOCK_EVENTS[0]} />
          </motion.div>

          {/* Center card — elevated + floating */}
          <motion.div
            style={{ y: c2y }}
            initial={{ opacity: 0, scale: rm ? 1 : 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay: 1.05 }}
          >
            <motion.div
              animate={rm ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <HeroEventCard {...MOCK_EVENTS[1]} featured />
            </motion.div>
          </motion.div>

          {/* Right card */}
          <motion.div
            style={{ y: c3y, marginTop: 28 }}
            initial={{ opacity: 0, scale: rm ? 1 : 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay: 1.15 }}
          >
            <HeroEventCard {...MOCK_EVENTS[2]} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── 2. PRESS STRIP ─────────────────────────────────────── */

function PressStrip() {
  const doubled = [...PRESS, ...PRESS];

  return (
    <section style={{ background: "var(--mk-bg)", padding: "40px 0", borderBottom: "1px solid var(--mk-line)" }}>
      <p style={{
        textAlign: "center",
        fontSize: 12,
        color: "var(--mk-ink-3)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: 24,
      }}>
        Featured in
      </p>
      <div className="mk-marquee-wrap" style={{ overflow: "hidden" }}>
        <div className="mk-marquee-track" style={{ display: "flex", gap: 64, width: "max-content" }}>
          {doubled.map((name, i) => (
            <span
              key={i}
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--mk-ink-3)",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
                fontFamily: "var(--font-display)",
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes mk-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .mk-marquee-track {
          animation: mk-marquee 28s linear infinite;
          will-change: transform;
        }
        .mk-marquee-wrap:hover .mk-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .mk-marquee-track { animation: none; }
        }
      `}</style>
    </section>
  );
}

/* ─── 3. WHY SUPPR ───────────────────────────────────────── */

function WhySupprSection({ rm }: { rm: boolean }) {
  return (
    <section
      id="how-it-works"
      style={{ background: "var(--mk-bg)", padding: "96px 24px" }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 50px)",
              lineHeight: 1.1,
              color: "var(--mk-ink)",
              letterSpacing: "-0.02em",
              marginBottom: 0,
            }}
          >
            <LineReveal delay={0} rm={rm}>Dining out, reinvented.</LineReveal>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 48px" }}>
          {WHY.map((item, i) => (
            <FadeUp key={item.title} delay={i * 0.12} rm={rm}>
              <div style={{ padding: "32px 0", borderTop: "1px solid var(--mk-line)" }}>
                <div style={{ color: "var(--mk-ink-3)", marginBottom: 20 }}>
                  {item.icon}
                </div>
                <p style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--mk-ink)",
                  marginBottom: 12,
                  letterSpacing: "-0.02em",
                }}>
                  {item.title}
                </p>
                <p style={{
                  fontSize: 15,
                  color: "var(--mk-ink-2)",
                  lineHeight: 1.65,
                  letterSpacing: "-0.01em",
                }}>
                  {item.desc}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 4. FEATURED CHEF ───────────────────────────────────── */

function FeaturedChefSection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-bg-soft)", padding: "80px 24px" }}>
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 72,
        alignItems: "center",
      }}>
        {/* Photo — clip-path wipe */}
        <motion.div
          initial={rm ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)", opacity: 0 }}
          whileInView={rm ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)", opacity: 1 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
          style={{ overflow: "hidden", borderRadius: 0 }}
        >
          <motion.div
            initial={rm ? {} : { scale: 1.08 }}
            whileInView={rm ? {} : { scale: 1 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ duration: 1.4, ease: EASE_OUT_EXPO }}
          >
            <div style={{
              width: "100%",
              aspectRatio: "3/4",
              background: "#F3F0EC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              maxHeight: 520,
            }}>
              <span style={{ fontSize: 12, color: "#C4BEB6", letterSpacing: "0.1em" }}>PHOTO</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Editorial content */}
        <div>
          <FadeUp delay={0.1} rm={rm}>
            <p style={{
              fontSize: 12,
              color: "var(--mk-accent)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}>
              Featured chef
            </p>
          </FadeUp>

          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4vw, 44px)",
            lineHeight: 1.15,
            color: "var(--mk-ink)",
            letterSpacing: "-0.02em",
            marginBottom: 32,
          }}>
            <LineReveal delay={0.15} rm={rm}>
              "I spent 12 years in Michelin
            </LineReveal>
            <LineReveal delay={0.25} rm={rm}>
              kitchens. I'd rather cook for
            </LineReveal>
            <LineReveal delay={0.35} rm={rm}>
              eight people who care."
            </LineReveal>
          </div>

          <FadeUp delay={0.45} rm={rm}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#E8E3DB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, color: "#B0A99F", letterSpacing: "0.05em" }}>PHOTO</span>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--mk-ink)", letterSpacing: "-0.01em" }}>
                  Chef Marcus T.
                </p>
                <p style={{ fontSize: 13, color: "var(--mk-ink-3)" }}>
                  San Francisco · Seasonal American
                </p>
              </div>
            </div>
            <Link
              href="/feed"
              style={{
                display: "inline-block",
                borderRadius: 999,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                background: "transparent",
                color: "var(--mk-accent)",
                border: "1px solid var(--mk-accent)",
                letterSpacing: "-0.01em",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              Book his next dinner →
            </Link>
          </FadeUp>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mk-chef-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

/* ─── 5. HOW IT WORKS ────────────────────────────────────── */

function HowItWorksSection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-bg)", padding: "96px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 50px)",
              lineHeight: 1.1,
              color: "var(--mk-ink)",
              letterSpacing: "-0.02em",
            }}
          >
            <LineReveal delay={0} rm={rm}>From discovery to dessert.</LineReveal>
          </h2>
        </div>

        <div>
          {HOW_IT_WORKS.map((step, i) => (
            <FadeUp key={step.num} delay={i * 0.12} rm={rm}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr",
                gap: "0 32px",
                padding: "36px 0",
                borderTop: "1px solid var(--mk-line)",
              }}>
                <p style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 48,
                  fontStyle: "italic",
                  color: "var(--mk-line)",
                  lineHeight: 1,
                  paddingTop: 4,
                  letterSpacing: "-0.03em",
                }}>
                  {step.num}
                </p>
                <div>
                  <p style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--mk-ink)",
                    marginBottom: 10,
                    letterSpacing: "-0.02em",
                  }}>
                    {step.title}
                  </p>
                  <p style={{
                    fontSize: 15,
                    color: "var(--mk-ink-2)",
                    lineHeight: 1.65,
                    letterSpacing: "-0.01em",
                  }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
          <div style={{ height: 1, background: "var(--mk-line)" }} />
        </div>
      </div>
    </section>
  );
}

/* ─── 6. STATS BAND ──────────────────────────────────────── */

function StatDisplay({ item, active, rm }: { item: StatItem; active: boolean; rm: boolean }) {
  const count = useCountUp(item.value, active && !rm, 1600, item.decimals ?? 0);
  const display = rm || !active ? item.value : count;
  const formatted =
    item.decimals && item.decimals > 0
      ? display.toFixed(item.decimals)
      : Math.round(display as number).toLocaleString();

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(40px, 6vw, 64px)",
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: item.coral ? "var(--mk-accent)" : "white",
        marginBottom: 12,
      }}>
        {formatted}{item.suffix}
      </p>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", letterSpacing: "-0.01em" }}>
        {item.label}
      </p>
    </div>
  );
}

function StatsBand({ rm }: { rm: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section
      ref={ref}
      style={{ background: "var(--mk-ink)", padding: "80px 24px" }}
    >
      <div style={{
        maxWidth: 1040,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "48px 32px",
      }}>
        {STATS.map((s, i) => (
          <FadeUp key={s.label} delay={i * 0.1} rm={rm}>
            <StatDisplay item={s} active={inView} rm={rm} />
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* ─── 7. FOR CHEFS / ZERO ADMIN ──────────────────────────── */

function ForChefsSection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-bg)", padding: "96px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 5.5vw, 60px)",
            lineHeight: 1.08,
            color: "var(--mk-ink)",
            letterSpacing: "-0.025em",
            marginBottom: 20,
          }}
        >
          <LineReveal delay={0} rm={rm}>You cook.</LineReveal>
          <LineReveal delay={0.1} rm={rm}>We handle the rest.</LineReveal>
        </h2>

        <FadeUp delay={0.2} rm={rm}>
          <p style={{
            fontSize: 17,
            color: "var(--mk-ink-2)",
            lineHeight: 1.65,
            maxWidth: 500,
            margin: "0 auto 56px",
            letterSpacing: "-0.01em",
          }}>
            Suppr is built around one idea: the chef's job is to cook, not to manage logistics.
            Our AI handles everything else.
          </p>
        </FadeUp>

        <div style={{ textAlign: "left", marginBottom: 48 }}>
          {ZERO_ADMIN.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.08} rm={rm}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 48px",
                padding: "20px 0",
                borderTop: i === 0 ? "1px solid var(--mk-line)" : undefined,
                borderBottom: "1px solid var(--mk-line)",
              }}>
                <p style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--mk-ink)",
                  letterSpacing: "-0.01em",
                }}>
                  {f.title}
                </p>
                <p style={{
                  fontSize: 14,
                  color: "var(--mk-ink-2)",
                  lineHeight: 1.6,
                  letterSpacing: "-0.01em",
                }}>
                  {f.desc}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3} rm={rm}>
          <Link
            href="/apply"
            style={{
              display: "inline-block",
              borderRadius: 999,
              padding: "14px 32px",
              fontSize: 16,
              fontWeight: 500,
              textDecoration: "none",
              background: "var(--mk-accent)",
              color: "white",
              letterSpacing: "-0.01em",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mk-accent-dk)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--mk-accent)")}
          >
            Apply to host on Suppr →
          </Link>
        </FadeUp>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .mk-zero-admin-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

/* ─── 8. BIG CTA BANNER ──────────────────────────────────── */

function BigCTASection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-bg)", padding: "64px 24px 96px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <FadeUp rm={rm}>
          <div style={{
            position: "relative",
            background: "var(--mk-ink)",
            borderRadius: 24,
            padding: "80px 48px",
            overflow: "hidden",
            textAlign: "center",
          }}>
            {/* Coral glow blob */}
            {!rm && (
              <motion.div
                animate={{
                  x: [0, 30, -20, 40, 0],
                  y: [0, -20, 30, -10, 0],
                  scale: [1, 1.12, 0.9, 1.08, 1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  width: 400,
                  height: 400,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(224,83,61,0.28) 0%, transparent 70%)",
                  filter: "blur(48px)",
                  pointerEvents: "none",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 0,
                }}
              />
            )}

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(32px, 5vw, 56px)",
                  lineHeight: 1.1,
                  color: "white",
                  letterSpacing: "-0.025em",
                  marginBottom: 20,
                }}
              >
                <LineReveal delay={0} rm={rm}>A table is waiting tonight.</LineReveal>
              </h2>

              <FadeUp delay={0.15} rm={rm}>
                <p style={{
                  fontSize: 17,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.6,
                  maxWidth: 420,
                  margin: "0 auto 36px",
                  letterSpacing: "-0.01em",
                }}>
                  No reservation line. No restaurant noise. Just a real chef, a set menu, and the people you bring.
                </p>
              </FadeUp>

              <FadeUp delay={0.25} rm={rm}>
                <Link
                  href="/feed"
                  style={{
                    display: "inline-block",
                    borderRadius: 999,
                    padding: "14px 32px",
                    fontSize: 16,
                    fontWeight: 500,
                    background: "white",
                    color: "var(--mk-ink)",
                    textDecoration: "none",
                    letterSpacing: "-0.01em",
                    transition: "background 0.15s ease, color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.88)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  Find a table tonight
                </Link>
              </FadeUp>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ─── PAGE ───────────────────────────────────────────────── */

/*
 * Alternate hero headlines (for A/B testing):
 * - "The best table in the city isn't in a restaurant."
 * - "Forget the reservation. Pull up a chair at a chef's own table."
 */

export default function MarketingHomePage() {
  const rm = usePrefersReducedMotion();

  return (
    <main>
      <HeroSection rm={rm} />
      <PressStrip />
      <WhySupprSection rm={rm} />
      <FeaturedChefSection rm={rm} />
      <HowItWorksSection rm={rm} />
      <StatsBand rm={rm} />
      <ForChefsSection rm={rm} />
      <BigCTASection rm={rm} />
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
} from "framer-motion";
import { EASE_OUT_EXPO, EASE_OUT_SOFT } from "./motion-config";

/* ─── types ─────────────────────────────────────────────── */

type ChefReel = {
  id: string;
  handle: string;
  name: string;
  city: string;
  followers: string;
  cuisine: string;
  gradient: string;
  // muxPlaybackId?: string; ← plug Mux video source here
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

/*
 * Chef reels — curated showcase in the hero. NOT the main /feed.
 * To wire real Mux videos, add muxPlaybackId to each entry and
 * replace the gradient placeholder div in ChefVideoCard with:
 *
 *   <video
 *     src={`https://stream.mux.com/${reel.muxPlaybackId}/low.mp4`}
 *     poster={`https://image.mux.com/${reel.muxPlaybackId}/thumbnail.jpg?time=3`}
 *     autoPlay muted loop playsInline
 *     style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
 *   />
 */
const CHEF_REELS: ChefReel[] = [
  {
    id: "1",
    handle: "@chef.kenji",
    name: "Kenji Murakami",
    city: "San Francisco",
    followers: "12.4k",
    cuisine: "Omakase · Japanese",
    gradient: "linear-gradient(160deg, #1A1208 0%, #3D2814 45%, #7A5028 100%)",
  },
  {
    id: "2",
    handle: "@mariancooks",
    name: "Maria Conti",
    city: "Brooklyn",
    followers: "8.9k",
    cuisine: "Coastal Italian · Supper Club",
    gradient: "linear-gradient(160deg, #180A0A 0%, #3D1515 45%, #7A2A2A 100%)",
  },
  {
    id: "3",
    handle: "@aishatable",
    name: "Aisha Williams",
    city: "Chicago",
    followers: "21.2k",
    cuisine: "Garden Tasting · Seasonal",
    gradient: "linear-gradient(160deg, #080F0A 0%, #142A18 45%, #285235 100%)",
  },
  {
    id: "4",
    handle: "@chefsebastian",
    name: "Sebastian Park",
    city: "Los Angeles",
    followers: "15.7k",
    cuisine: "Modern Korean · Chef's Table",
    gradient: "linear-gradient(160deg, #08090F 0%, #141830 45%, #222848 100%)",
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

/* ─── shared animation components ───────────────────────── */

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

/* ─── Chef Video Feed (hero right column) ────────────────── */

/*
 * This is the CURATED SHOWCASE — a premium reel of chefs cooking.
 * It is intentionally separate from the main discovery feed at /feed.
 *
 * To wire Mux: add muxPlaybackId to each CHEF_REELS entry, then
 * replace the gradient placeholder div inside ChefVideoCard with a
 * <video> element as described in the CHEF_REELS comment above.
 */

const CARD_W = 300;
const CARD_H = 500;

function ChefVideoCard({ reel, isBack }: { reel: ChefReel; isBack?: boolean }) {
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        background: reel.gradient,
        boxShadow: isBack ? "none" : "0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      {/* ── VIDEO PLACEHOLDER ─────────────────────────────────
          Replace this with a <video> element when Mux is ready.
          See the CHEF_REELS comment above for the exact markup.
         ──────────────────────────────────────────────────── */}
      <motion.div
        animate={isBack ? {} : { scale: [1, 1.04, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background: reel.gradient,
        }}
      />

      {/* Gradient scrim — bottom 60% */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 100%)",
          zIndex: 1,
        }}
      />

      {/* Playing indicator — top right */}
      {!isBack && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 999,
            padding: "5px 11px",
          }}
        >
          <motion.span
            animate={{ opacity: [1, 0.15, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{
              display: "block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--mk-accent)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.9)",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            PREVIEW
          </span>
        </div>
      )}

      {/* Chef info overlay — bottom */}
      {!isBack && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0 18px 20px",
            zIndex: 2,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {reel.cuisine}
          </p>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.02em",
              marginBottom: 2,
              fontFamily: "var(--font-display)",
            }}
          >
            {reel.name}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              marginBottom: 16,
            }}
          >
            {reel.city} · {reel.followers} followers
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.38)",
                fontStyle: "italic",
              }}
            >
              {reel.handle}
            </span>
            {/* /chefs/[handle] — public, no login required */}
            <Link
              href={`/chefs/${reel.handle.replace("@", "").replace(/\./g, "-")}`}
              style={{
                background: "var(--mk-accent)",
                color: "white",
                padding: "7px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              View table →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ChefVideoFeed({ rm }: { rm: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (rm) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % CHEF_REELS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [rm]);

  const backIdx = (active + 1) % CHEF_REELS.length;

  return (
    <div
      style={{
        position: "relative",
        width: CARD_W + 28,
        height: CARD_H + 20,
        margin: "0 auto",
      }}
    >
      {/* Back card — peeking, shows next chef */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 14,
          right: 0,
          width: CARD_W,
          height: CARD_H,
          transform: "rotate(5deg) scale(0.9)",
          transformOrigin: "bottom center",
          opacity: 0.42,
          zIndex: 1,
          borderRadius: 20,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <ChefVideoCard reel={CHEF_REELS[backIdx]!} isBack />
      </div>

      {/* Front card — active, animates in/out */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: rm ? 0 : 22, scale: rm ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: rm ? 0 : -14, scale: rm ? 1 : 0.97 }}
          transition={{ duration: 0.52, ease: EASE_OUT_SOFT }}
          style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
        >
          <ChefVideoCard reel={CHEF_REELS[active]!} />
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div
        style={{
          position: "absolute",
          bottom: -32,
          left: CARD_W / 2,
          transform: "translateX(-50%)",
          display: "flex",
          gap: 6,
          zIndex: 10,
        }}
      >
        {CHEF_REELS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Show chef ${i + 1}`}
            style={{
              width: i === active ? 24 : 6,
              height: 6,
              borderRadius: 999,
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: i === active ? "var(--mk-accent)" : "#DDDDDD",
              transition: "width 0.3s ease, background 0.2s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── 1. HERO ────────────────────────────────────────────── */

function HeroSection({ rm }: { rm: boolean }) {
  return (
    <section
      style={{
        background: "var(--mk-bg)",
        paddingTop: 80,
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
      }}
      aria-labelledby="hero-heading"
    >
      <div
        className="mk-hero-grid"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "56px 40px 96px",
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 72,
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* LEFT: Text */}
        <div className="mk-hero-text">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: rm ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_SOFT }}
            style={{
              fontSize: 12,
              color: "var(--mk-ink-3)",
              letterSpacing: "0.1em",
              marginBottom: 32,
              textTransform: "uppercase",
            }}
          >
            Private dinners · Supper clubs · Chef's tables
          </motion.p>

          {/* Headline
           *
           * A/B options — swap the three HeroLine children to test:
           *
           * Option A (current — direct, benefit-led):
           *   "Why go to a restaurant / when the chef will cook / for you?"
           *
           * Option B (exclusivity-forward):
           *   "Not every table / is open to everyone. / Yours is waiting."
           *
           * Option C (discovery-focused):
           *   "The best meal / you've never had / is someone's home kitchen."
           */}
          <h1
            id="hero-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(38px, 5vw, 68px)",
              lineHeight: 1.05,
              marginBottom: 18,
              color: "var(--mk-ink)",
              letterSpacing: "-0.025em",
            }}
          >
            <HeroLine delay={0.1} rm={rm}>Why go to a restaurant</HeroLine>
            <HeroLine delay={0.2} rm={rm}>when the chef will cook</HeroLine>
            <HeroLine delay={0.3} rm={rm}>
              for{" "}
              <em style={{ color: "var(--mk-accent)", fontStyle: "italic" }}>you</em>?
            </HeroLine>
          </h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: rm ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_SOFT, delay: 0.42 }}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(17px, 1.8vw, 22px)",
              fontStyle: "italic",
              color: "var(--mk-ink-2)",
              marginBottom: 22,
              letterSpacing: "-0.01em",
            }}
          >
            Find your next food adventure.
          </motion.p>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: rm ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_SOFT, delay: 0.52 }}
            style={{
              fontSize: "clamp(15px, 1.6vw, 17px)",
              color: "var(--mk-ink-2)",
              lineHeight: 1.65,
              maxWidth: 460,
              marginBottom: 40,
              letterSpacing: "-0.01em",
            }}
          >
            Intimate, once-in-a-lifetime chef-hosted experiences — private
            dinners, supper clubs, and chef's tables from the world's best
            home chefs. No reservation, no login required.
          </motion.p>

          {/* CTAs — both go to public pages, no login wall */}
          <motion.div
            className="mk-cta-row"
            initial={{ opacity: 0, y: rm ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_SOFT, delay: 0.64 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}
          >
            <MagneticPill href="/feed" primary rm={rm}>
              Find a table
            </MagneticPill>
            <MagneticPill href="/for-chefs" rm={rm}>
              Become a host
            </MagneticPill>
          </motion.div>

          {/* Social proof */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            style={{ fontSize: 13, color: "var(--mk-ink-3)", letterSpacing: "-0.01em" }}
          >
            ★ 4.9 · loved by{" "}
            <strong style={{ color: "var(--mk-ink-2)", fontWeight: 600 }}>48,000+</strong>{" "}
            diners · no account needed to browse
          </motion.p>
        </div>

        {/* RIGHT: Curated chef video feed */}
        <motion.div
          className="mk-hero-video"
          initial={{ opacity: 0, x: rm ? 0 : 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.25 }}
        >
          <ChefVideoFeed rm={rm} />
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .mk-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 56px !important;
            padding: 48px 24px 88px !important;
          }
          .mk-hero-text { text-align: center; }
          .mk-hero-text p { margin-left: auto; margin-right: auto; }
          .mk-cta-row { justify-content: center; }
        }
        @media (max-width: 600px) {
          .mk-hero-video { display: none; }
        }
      `}</style>
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
          style={{ overflow: "hidden" }}
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
            {/* Public chef profile — no login required */}
            <Link
              href="/chefs/marcus-t"
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
                {/* /feed is fully public — no account required */}
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

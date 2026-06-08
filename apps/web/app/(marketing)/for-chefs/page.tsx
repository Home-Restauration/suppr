"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { EASE_OUT_EXPO, EASE_OUT_SOFT } from "../motion-config";

/* ─── data ───────────────────────────────────────────────── */

const HOW_CHEF_WORKS = [
  {
    num: "1",
    title: "Apply & get accepted",
    desc: "We review every application personally. No mass sign-ups — we curate for talent, care, and craft. Accepted chefs receive an onboarding call before their first event.",
  },
  {
    num: "2",
    title: "Create your event in minutes",
    desc: "Describe your concept. Our AI drafts your menu copy, event description, and pricing suggestions. You edit, approve, and publish — in the time it takes to drink your morning coffee.",
  },
  {
    num: "3",
    title: "Show up and cook",
    desc: "We handle guest communications, allergy management, payment collection, and next-day payouts. Your only job is cooking. That's the whole idea.",
  },
];

const AI_FEATURES = [
  {
    title: "Menu writer",
    desc: "Describe your dishes in plain language. The AI turns them into polished, appetizing copy that converts.",
  },
  {
    title: "Guest communications",
    desc: "Booking confirmations, allergy follow-ups, day-of reminders, and post-event thank-yous — sent automatically.",
  },
  {
    title: "Dietary intelligence",
    desc: "Allergies and dietary restrictions collected at booking and surfaced to you before service. No surprises.",
  },
  {
    title: "Real-time dashboard",
    desc: "Cover count, allergy summary, payment status, and tip total — all in one screen, the morning of your event.",
  },
];

const PRICING = [
  {
    name: "Basic",
    price: "Free",
    fee: "15% platform fee",
    description: "Everything you need to run your first dinner.",
    features: [
      "Unlimited events",
      "Booking & guest management",
      "Stripe payment processing",
      "Dietary flag collection",
      "Next-day payouts",
      "Public chef profile",
    ],
    cta: "Apply for free",
    href: "/apply",
    primary: false,
  },
  {
    name: "Chef+AI",
    price: "$20",
    period: "/mo",
    fee: "10% platform fee",
    description: "AI tools that make you look like you have a full team.",
    features: [
      "Everything in Basic",
      "AI menu writer",
      "Automated guest communications",
      "Priority placement in search",
      "Advanced analytics",
      "Dedicated chef support",
    ],
    cta: "Apply to host",
    href: "/apply",
    primary: true,
    badge: "Most popular",
  },
];

const FAQ = [
  {
    q: "Is Suppr really invite-only?",
    a: "Yes. We review every application personally. We're building deliberately — quality over scale. Every chef on the platform has been vetted, which is part of what makes the experience valuable for guests.",
  },
  {
    q: "How does payment work?",
    a: "Guests pay in full at the time of booking through Stripe Checkout. You receive your payout — minus the platform fee — the next business day via Stripe Connect. Tips are collected separately and paid out in full.",
  },
  {
    q: "What's the platform fee?",
    a: "15% on the Basic plan, 10% on Chef+AI. No hidden charges, no listing fees, no monthly minimum on Basic. You only pay when you earn.",
  },
  {
    q: "Can I set my own menu and price?",
    a: "Completely. Suppr never touches your menu or pricing. The AI offers suggestions, but you have full editorial control. Price your dinners however you want.",
  },
  {
    q: "What happens if a guest cancels or no-shows?",
    a: "Our cancellation policy protects you. Guests who cancel within 48 hours of the event are charged in full. Confirmed no-shows are also charged. You always get paid for the seat.",
  },
];

/* ─── shared animation utilities ────────────────────────── */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
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

/* ─── FAQ accordion item ─────────────────────────────────── */

function FAQItem({ q, a, rm }: { q: string; a: string; rm: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <FadeUp rm={rm}>
      <div style={{ borderTop: "1px solid var(--mk-line)" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "22px 0",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            gap: 24,
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "var(--mk-ink)",
              letterSpacing: "-0.02em",
              lineHeight: 1.35,
            }}
          >
            {q}
          </span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              flexShrink: 0,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--mk-ink-3)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="8" y1="2" x2="8" y2="14" />
              <line x1="2" y1="8" x2="14" y2="8" />
            </svg>
          </motion.span>
        </button>

        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
          style={{ overflow: "hidden" }}
        >
          <p
            style={{
              fontSize: 15,
              color: "var(--mk-ink-2)",
              lineHeight: 1.7,
              letterSpacing: "-0.01em",
              paddingBottom: 24,
              maxWidth: 640,
            }}
          >
            {a}
          </p>
        </motion.div>
      </div>
    </FadeUp>
  );
}

/* ─── page sections ──────────────────────────────────────── */

function ChefHero({ rm }: { rm: boolean }) {
  return (
    <section
      style={{
        background: "var(--mk-bg)",
        paddingTop: 80,
        minHeight: "80dvh",
        display: "flex",
        alignItems: "center",
      }}
      aria-labelledby="for-chefs-heading"
    >
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "72px 24px 96px", width: "100%" }}>
        <motion.p
          initial={{ opacity: 0, y: rm ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_SOFT }}
          style={{
            fontSize: 12,
            color: "var(--mk-accent)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 36,
          }}
        >
          For chefs & home cooks
        </motion.p>

        <h1
          id="for-chefs-heading"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(44px, 7vw, 88px)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            color: "var(--mk-ink)",
            marginBottom: 32,
          }}
        >
          <span style={{ display: "block", overflow: "hidden" }}>
            <motion.span
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.1 }}
              style={{ display: "block" }}
            >
              Cook for people
            </motion.span>
          </span>
          <span style={{ display: "block", overflow: "hidden" }}>
            <motion.span
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.2 }}
              style={{ display: "block" }}
            >
              who{" "}
              <em style={{ color: "var(--mk-accent)", fontStyle: "italic" }}>actually</em> care.
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: rm ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay: 0.38 }}
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "var(--mk-ink-2)",
            lineHeight: 1.6,
            maxWidth: 540,
            marginBottom: 48,
            letterSpacing: "-0.01em",
          }}
        >
          Suppr is the only platform built for serious home chefs. Zero admin,
          full creative control, next-day payouts. You cook — we handle everything else.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: rm ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_SOFT, delay: 0.52 }}
          style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}
        >
          <Link
            href="/apply"
            style={{
              display: "inline-block",
              borderRadius: 999,
              padding: "14px 32px",
              fontSize: 16,
              fontWeight: 500,
              textDecoration: "none",
              background: "var(--mk-ink)",
              color: "var(--mk-bg)",
              letterSpacing: "-0.01em",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Apply to host →
          </Link>
          <a
            href="#how-it-works"
            style={{
              fontSize: 15,
              color: "var(--mk-ink-2)",
              textDecoration: "none",
              letterSpacing: "-0.01em",
              borderBottom: "1px solid var(--mk-line)",
              paddingBottom: 2,
              transition: "color 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--mk-ink)";
              e.currentTarget.style.borderColor = "var(--mk-ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--mk-ink-2)";
              e.currentTarget.style.borderColor = "var(--mk-line)";
            }}
          >
            See how it works
          </a>
        </motion.div>

        {/* Social proof row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          style={{
            display: "flex",
            gap: 32,
            marginTop: 56,
            flexWrap: "wrap",
          }}
        >
          {[
            { value: "1,200+", label: "Active chefs" },
            { value: "4.9★", label: "Avg chef rating" },
            { value: "Next day", label: "Payout speed" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 600,
                color: "var(--mk-ink)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: 4,
              }}>
                {s.value}
              </p>
              <p style={{ fontSize: 13, color: "var(--mk-ink-3)" }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksChef({ rm }: { rm: boolean }) {
  return (
    <section
      id="how-it-works"
      style={{ background: "var(--mk-bg-soft)", padding: "96px 24px" }}
    >
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
            <LineReveal delay={0} rm={rm}>Simple on purpose.</LineReveal>
          </h2>
        </div>

        {HOW_CHEF_WORKS.map((step, i) => (
          <FadeUp key={step.num} delay={i * 0.1} rm={rm}>
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
    </section>
  );
}

function AIToolsSection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-bg)", padding: "96px 24px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ marginBottom: 64 }}>
          <FadeUp rm={rm}>
            <p style={{
              fontSize: 12,
              color: "var(--mk-accent)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}>
              AI tools
            </p>
          </FadeUp>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 50px)",
              lineHeight: 1.1,
              color: "var(--mk-ink)",
              letterSpacing: "-0.02em",
            }}
          >
            <LineReveal delay={0} rm={rm}>Your AI sous-chef.</LineReveal>
            <LineReveal delay={0.1} rm={rm}>Never sleeps, never complains.</LineReveal>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 1,
          background: "var(--mk-line)",
          border: "1px solid var(--mk-line)",
          borderRadius: 16,
          overflow: "hidden",
        }}>
          {AI_FEATURES.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.08} rm={rm}>
              <div style={{
                background: "var(--mk-bg)",
                padding: "32px 28px",
              }}>
                <p style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--mk-ink)",
                  marginBottom: 10,
                  letterSpacing: "-0.02em",
                }}>
                  {f.title}
                </p>
                <p style={{
                  fontSize: 14,
                  color: "var(--mk-ink-2)",
                  lineHeight: 1.65,
                  letterSpacing: "-0.01em",
                }}>
                  {f.desc}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection({ rm }: { rm: boolean }) {
  return (
    <section
      id="pricing"
      style={{ background: "var(--mk-bg-soft)", padding: "96px 24px" }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 50px)",
              lineHeight: 1.1,
              color: "var(--mk-ink)",
              letterSpacing: "-0.02em",
            }}
          >
            <LineReveal delay={0} rm={rm}>Simple pricing.</LineReveal>
          </h2>
          <FadeUp delay={0.15} rm={rm}>
            <p style={{
              fontSize: 16,
              color: "var(--mk-ink-2)",
              marginTop: 16,
              letterSpacing: "-0.01em",
            }}>
              No listing fees. No monthly minimum on Basic. You pay only when you earn.
            </p>
          </FadeUp>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {PRICING.map((plan) => (
            <FadeUp key={plan.name} rm={rm}>
              <div style={{
                background: plan.primary ? "var(--mk-ink)" : "var(--mk-bg)",
                border: plan.primary ? "none" : "1px solid var(--mk-line)",
                borderRadius: 20,
                padding: "40px 36px",
                position: "relative",
                overflow: "hidden",
              }}>
                {plan.badge && (
                  <span style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    background: "var(--mk-accent)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    padding: "4px 10px",
                    borderRadius: 999,
                    textTransform: "uppercase",
                  }}>
                    {plan.badge}
                  </span>
                )}

                <p style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: plan.primary ? "rgba(255,255,255,0.5)" : "var(--mk-ink-3)",
                  marginBottom: 16,
                }}>
                  {plan.name}
                </p>

                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 52,
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                    color: plan.primary ? "white" : "var(--mk-ink)",
                    lineHeight: 1,
                  }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontSize: 16, color: plan.primary ? "rgba(255,255,255,0.5)" : "var(--mk-ink-3)" }}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: 13,
                  color: plan.primary ? "rgba(255,255,255,0.4)" : "var(--mk-ink-3)",
                  marginBottom: 8,
                  letterSpacing: "-0.01em",
                }}>
                  + {plan.fee}
                </p>
                <p style={{
                  fontSize: 14,
                  color: plan.primary ? "rgba(255,255,255,0.6)" : "var(--mk-ink-2)",
                  lineHeight: 1.55,
                  marginBottom: 32,
                  letterSpacing: "-0.01em",
                }}>
                  {plan.description}
                </p>

                <div style={{ marginBottom: 36 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={plan.primary ? "rgba(255,255,255,0.5)" : "var(--mk-ink-3)"} strokeWidth="1.5">
                        <path d="M2 7l3.5 3.5L12 3" />
                      </svg>
                      <span style={{
                        fontSize: 14,
                        color: plan.primary ? "rgba(255,255,255,0.75)" : "var(--mk-ink-2)",
                        letterSpacing: "-0.01em",
                      }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href={plan.href}
                  style={{
                    display: "block",
                    textAlign: "center",
                    borderRadius: 999,
                    padding: "13px 24px",
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: "none",
                    letterSpacing: "-0.01em",
                    transition: "opacity 0.15s ease",
                    ...(plan.primary
                      ? { background: "var(--mk-accent)", color: "white" }
                      : { background: "var(--mk-ink)", color: "var(--mk-bg)" }),
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {plan.cta} →
                </Link>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function InviteOnlySection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-ink)", padding: "80px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <FadeUp rm={rm}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}>
            Invite-only · Application-based
          </p>
        </FadeUp>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4.5vw, 52px)",
            lineHeight: 1.1,
            color: "white",
            letterSpacing: "-0.025em",
            marginBottom: 24,
          }}
        >
          <LineReveal delay={0} rm={rm}>Not everyone gets in.</LineReveal>
          <LineReveal delay={0.1} rm={rm}>That's the point.</LineReveal>
        </h2>

        <FadeUp delay={0.2} rm={rm}>
          <p style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.7,
            maxWidth: 520,
            margin: "0 auto 40px",
            letterSpacing: "-0.01em",
          }}>
            We curate for quality — not volume. Every chef is personally reviewed.
            Every dinner is covered by our guest guarantee. That's what makes
            Suppr worth something.
          </p>
        </FadeUp>

        <FadeUp delay={0.3} rm={rm}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/apply"
              style={{
                display: "inline-block",
                borderRadius: 999,
                padding: "13px 28px",
                fontSize: 15,
                fontWeight: 500,
                textDecoration: "none",
                background: "var(--mk-accent)",
                color: "white",
                letterSpacing: "-0.01em",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Apply now →
            </Link>
            <p style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.35)",
              alignSelf: "center",
              letterSpacing: "-0.01em",
            }}>
              Already have an invite code?{" "}
              <Link
                href="/apply"
                style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}
              >
                You'll skip the queue.
              </Link>
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function FAQSection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-bg)", padding: "96px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4vw, 44px)",
            lineHeight: 1.1,
            color: "var(--mk-ink)",
            letterSpacing: "-0.025em",
            marginBottom: 48,
          }}
        >
          <LineReveal delay={0} rm={rm}>Common questions.</LineReveal>
        </h2>

        <div>
          {FAQ.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} rm={rm} />
          ))}
          <div style={{ height: 1, background: "var(--mk-line)" }} />
        </div>
      </div>
    </section>
  );
}

function ChefCTASection({ rm }: { rm: boolean }) {
  return (
    <section style={{ background: "var(--mk-bg)", padding: "32px 24px 96px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <FadeUp rm={rm}>
          <div style={{
            background: "var(--mk-bg-soft)",
            border: "1px solid var(--mk-line)",
            borderRadius: 24,
            padding: "64px 48px",
            textAlign: "center",
          }}>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 46px)",
              lineHeight: 1.12,
              color: "var(--mk-ink)",
              letterSpacing: "-0.025em",
              marginBottom: 16,
            }}>
              Ready to cook for people who truly care?
            </h2>
            <p style={{
              fontSize: 16,
              color: "var(--mk-ink-2)",
              lineHeight: 1.6,
              maxWidth: 420,
              margin: "0 auto 36px",
              letterSpacing: "-0.01em",
            }}>
              Applications take 5 minutes. We review every one personally.
            </p>
            <Link
              href="/apply"
              style={{
                display: "inline-block",
                borderRadius: 999,
                padding: "14px 36px",
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
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ─── page ───────────────────────────────────────────────── */

export default function ForChefsPage() {
  const rm = usePrefersReducedMotion();

  return (
    <main>
      <ChefHero rm={rm} />
      <HowItWorksChef rm={rm} />
      <AIToolsSection rm={rm} />
      <PricingSection rm={rm} />
      <InviteOnlySection rm={rm} />
      <FAQSection rm={rm} />
      <ChefCTASection rm={rm} />
    </main>
  );
}

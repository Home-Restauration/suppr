"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { EASE_OUT_EXPO, EASE_OUT_SOFT } from "../motion-config";

/* ─── types ─────────────────────────────────────────────── */

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  cuisine: string;
  experience: string;
  socialHandle: string;
  inviteCode: string;
  about: string;
};

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  city: "",
  cuisine: "",
  experience: "",
  socialHandle: "",
  inviteCode: "",
  about: "",
};

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

function FadeUp({
  children,
  delay = 0,
  rm,
  animate = false,
}: {
  children: React.ReactNode;
  delay?: number;
  rm: boolean;
  animate?: boolean;
}) {
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: rm ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay }}
      >
        {children}
      </motion.div>
    );
  }
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

/* ─── form field components ──────────────────────────────── */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--mk-ink)",
          letterSpacing: "-0.01em",
          marginBottom: hint ? 4 : 8,
        }}
      >
        {label}
      </label>
      {hint && (
        <p style={{ fontSize: 12, color: "var(--mk-ink-3)", marginBottom: 8, letterSpacing: "-0.01em" }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  fontSize: 15,
  color: "var(--mk-ink)",
  background: "var(--mk-bg)",
  border: "1px solid var(--mk-line)",
  borderRadius: 10,
  outline: "none",
  letterSpacing: "-0.01em",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
  fontFamily: "inherit",
};

/* ─── success state ──────────────────────────────────────── */

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_SOFT }}
      style={{
        textAlign: "center",
        padding: "80px 24px",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <div style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "var(--mk-accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 32px",
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M4 12l5 5L20 6" />
        </svg>
      </div>
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(28px, 4vw, 40px)",
        lineHeight: 1.15,
        color: "var(--mk-ink)",
        letterSpacing: "-0.025em",
        marginBottom: 16,
      }}>
        Application received.
      </h2>
      <p style={{
        fontSize: 16,
        color: "var(--mk-ink-2)",
        lineHeight: 1.65,
        letterSpacing: "-0.01em",
        marginBottom: 12,
      }}>
        We review every application personally and reach out within 2 weeks.
        If you used an invite code, expect to hear from us sooner.
      </p>
      <p style={{ fontSize: 14, color: "var(--mk-ink-3)", letterSpacing: "-0.01em" }}>
        Questions? Reach us at{" "}
        <a
          href="mailto:chefs@suppr.co"
          style={{ color: "var(--mk-accent)", textDecoration: "none" }}
        >
          chefs@suppr.co
        </a>
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          marginTop: 40,
          fontSize: 14,
          color: "var(--mk-ink-2)",
          textDecoration: "none",
          borderBottom: "1px solid var(--mk-line)",
          paddingBottom: 2,
          letterSpacing: "-0.01em",
        }}
      >
        ← Back to home
      </Link>
    </motion.div>
  );
}

/* ─── application form ───────────────────────────────────── */

function ApplicationForm({ rm }: { rm: boolean }) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // TODO: POST to /api/chef-applications when endpoint is ready.
      // Replace the simulated delay below with:
      //
      // const res = await fetch("/api/chef-applications", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(form),
      // });
      // if (!res.ok) throw new Error("Application failed");
      //
      // The API should return 201 on success and store the application
      // in the chef_applications table (see packages/contracts for the schema).

      await new Promise((r) => setTimeout(r, 1000)); // stub delay
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email chefs@suppr.co");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return <SuccessState />;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Name row */}
        <FadeUp delay={0.1} rm={rm}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="mk-name-row">
            <Field label="First name">
              <input
                required
                value={form.firstName}
                onChange={set("firstName")}
                placeholder="Elena"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--mk-ink)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--mk-line)")}
              />
            </Field>
            <Field label="Last name">
              <input
                required
                value={form.lastName}
                onChange={set("lastName")}
                placeholder="Rossi"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--mk-ink)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--mk-line)")}
              />
            </Field>
          </div>
        </FadeUp>

        {/* Email */}
        <FadeUp delay={0.15} rm={rm}>
          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--mk-ink)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--mk-line)")}
            />
          </Field>
        </FadeUp>

        {/* City */}
        <FadeUp delay={0.2} rm={rm}>
          <Field label="City" hint="Where you cook">
            <input
              required
              value={form.city}
              onChange={set("city")}
              placeholder="San Francisco, CA"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--mk-ink)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--mk-line)")}
            />
          </Field>
        </FadeUp>

        {/* Cuisine */}
        <FadeUp delay={0.22} rm={rm}>
          <Field label="Cuisine style" hint="What you cook — be specific">
            <input
              required
              value={form.cuisine}
              onChange={set("cuisine")}
              placeholder="Modern Japanese, tasting menus, seasonal"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--mk-ink)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--mk-line)")}
            />
          </Field>
        </FadeUp>

        {/* Experience */}
        <FadeUp delay={0.24} rm={rm}>
          <Field label="Years cooking experience">
            <select
              required
              value={form.experience}
              onChange={set("experience")}
              style={{
                ...inputStyle,
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238A8A8A' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                paddingRight: 40,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--mk-ink)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--mk-line)")}
            >
              <option value="" disabled>Select…</option>
              <option value="1-3">1 – 3 years</option>
              <option value="3-5">3 – 5 years</option>
              <option value="5-10">5 – 10 years</option>
              <option value="10+">10+ years</option>
            </select>
          </Field>
        </FadeUp>

        {/* Social handle — optional */}
        <FadeUp delay={0.26} rm={rm}>
          <Field label="Social handle (optional)" hint="Instagram, TikTok, or personal site">
            <input
              value={form.socialHandle}
              onChange={set("socialHandle")}
              placeholder="@chefyou"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--mk-ink)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--mk-line)")}
            />
          </Field>
        </FadeUp>

        {/* Invite code — optional, highlighted */}
        <FadeUp delay={0.28} rm={rm}>
          <div style={{
            background: "var(--mk-bg-soft)",
            border: "1px solid var(--mk-line)",
            borderRadius: 12,
            padding: "20px 20px 16px",
          }}>
            <Field
              label="Invite code (optional)"
              hint="Have a code from a Suppr chef? Enter it here — you'll skip the waitlist."
            >
              <input
                value={form.inviteCode}
                onChange={set("inviteCode")}
                placeholder="SUPPR-XXXX"
                style={{
                  ...inputStyle,
                  fontFamily: "monospace",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--mk-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--mk-line)")}
              />
            </Field>
          </div>
        </FadeUp>

        {/* About */}
        <FadeUp delay={0.32} rm={rm}>
          <Field
            label="Tell us about your cooking"
            hint="What does a dinner at your table look like? What drives you to cook for strangers? (4–8 sentences)"
          >
            <textarea
              required
              rows={6}
              value={form.about}
              onChange={set("about")}
              placeholder="I've been hosting pop-up dinners in my apartment for three years…"
              style={{
                ...inputStyle,
                resize: "vertical",
                lineHeight: 1.6,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--mk-ink)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--mk-line)")}
            />
          </Field>
        </FadeUp>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 14, color: "#B5564A", letterSpacing: "-0.01em" }}>{error}</p>
        )}

        {/* Submit */}
        <FadeUp delay={0.36} rm={rm}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "15px 24px",
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              borderRadius: 999,
              border: "none",
              cursor: submitting ? "default" : "pointer",
              background: submitting ? "var(--mk-ink-3)" : "var(--mk-accent)",
              color: "white",
              transition: "background 0.15s ease, opacity 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = "var(--mk-accent-dk)";
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.background = "var(--mk-accent)";
            }}
          >
            {submitting ? "Sending application…" : "Submit application →"}
          </button>
          <p style={{
            fontSize: 12,
            color: "var(--mk-ink-3)",
            textAlign: "center",
            marginTop: 14,
            letterSpacing: "-0.01em",
            lineHeight: 1.55,
          }}>
            We review every application personally. No automated rejections.
            Expect to hear from us within 2 weeks.
          </p>
        </FadeUp>
      </div>

      <style>{`
        @media (max-width: 520px) {
          .mk-name-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  );
}

/* ─── page ───────────────────────────────────────────────── */

export default function ApplyPage() {
  const rm = usePrefersReducedMotion();

  return (
    <main style={{ background: "var(--mk-bg)", paddingTop: 80 }}>
      {/* Editorial header */}
      <section style={{ padding: "72px 24px 64px", borderBottom: "1px solid var(--mk-line)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <FadeUp delay={0} rm={rm} animate>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--mk-accent)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "var(--mk-accent-tint, #F3E4DB)",
                padding: "4px 12px",
                borderRadius: 999,
              }}>
                Invite-only
              </span>
              <span style={{ fontSize: 12, color: "var(--mk-ink-3)", letterSpacing: "-0.01em" }}>
                Application-based enrollment
              </span>
            </div>
          </FadeUp>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(38px, 6vw, 72px)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              color: "var(--mk-ink)",
              marginBottom: 20,
            }}
          >
            <span style={{ display: "block", overflow: "hidden" }}>
              <motion.span
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.1 }}
                style={{ display: "block" }}
              >
                Apply to join
              </motion.span>
            </span>
            <span style={{ display: "block", overflow: "hidden" }}>
              <motion.span
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.2 }}
                style={{ display: "block" }}
              >
                the Suppr kitchen.
              </motion.span>
            </span>
          </h1>

          <FadeUp delay={0.38} rm={rm} animate>
            <p style={{
              fontSize: "clamp(15px, 1.8vw, 18px)",
              color: "var(--mk-ink-2)",
              lineHeight: 1.65,
              letterSpacing: "-0.01em",
              maxWidth: 520,
            }}>
              This isn't a sign-up form. We review every application personally —
              we want to know who you are, how you cook, and why you want to
              feed strangers in your home.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Two-column layout: form left, context right */}
      <section style={{ padding: "64px 24px 96px" }}>
        <div
          className="mk-apply-grid"
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 72,
            alignItems: "start",
          }}
        >
          {/* Form */}
          <FadeUp delay={0.1} rm={rm}>
            <ApplicationForm rm={rm} />
          </FadeUp>

          {/* Sidebar context */}
          <div
            className="mk-apply-sidebar"
            style={{
              position: "sticky",
              top: 96,
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            <FadeUp delay={0.2} rm={rm}>
              <div style={{
                background: "var(--mk-ink)",
                borderRadius: 16,
                padding: "28px 24px",
              }}>
                <p style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.45)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}>
                  What we look for
                </p>
                {[
                  "A genuine love for cooking — not a side hustle, a craft",
                  "Willingness to cook for strangers in your own space",
                  "A point of view: cuisine, concept, or story",
                  "Reliability — guests are trusting you with their evening",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M2 7l3.5 3.5L12 3" />
                    </svg>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, letterSpacing: "-0.01em" }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.28} rm={rm}>
              <div style={{
                border: "1px solid var(--mk-line)",
                borderRadius: 16,
                padding: "24px 22px",
              }}>
                <p style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--mk-ink-3)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}>
                  After you apply
                </p>
                <p style={{ fontSize: 13, color: "var(--mk-ink-2)", lineHeight: 1.65, letterSpacing: "-0.01em" }}>
                  We review personally and respond within <strong>2 weeks</strong>. If
                  accepted, you'll receive an onboarding call before your first event
                  goes live.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.34} rm={rm}>
              <p style={{ fontSize: 13, color: "var(--mk-ink-3)", lineHeight: 1.6, letterSpacing: "-0.01em" }}>
                Already a Suppr chef?{" "}
                <Link
                  href="/login"
                  style={{ color: "var(--mk-ink)", textDecoration: "none", borderBottom: "1px solid var(--mk-line)" }}
                >
                  Sign in to your console →
                </Link>
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .mk-apply-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .mk-apply-sidebar { position: static !important; }
        }
      `}</style>
    </main>
  );
}

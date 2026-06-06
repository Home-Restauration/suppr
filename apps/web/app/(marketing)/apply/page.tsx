"use client";

import React, { useState } from "react";
import Link from "next/link";

type Step = 1 | 2;

interface FormData {
  // Step 1
  name: string;
  email: string;
  phone: string;
  city: string;
  experience: string;
  types: string[];
  eventSize: string;
  // Step 2
  background: string;
  recentEvent: string;
  priceRange: string;
  instagram: string;
  heardAbout: string;
}

const EXPERIENCE_OPTIONS = [
  { value: "new", label: "Just starting" },
  { value: "1-2", label: "1–2 years" },
  { value: "3+", label: "3+ years" },
];

const SIZE_OPTIONS = [
  { value: "intimate", label: "Intimate (4–8)" },
  { value: "medium", label: "Medium (8–16)" },
  { value: "larger", label: "Larger (16+)" },
];

const TYPES = ["Supper clubs", "Chef dinners", "Private dining", "Cooking workshops", "Tastings", "Pop-ups"];

const HEARD_OPTIONS = ["Instagram", "A friend / word of mouth", "Google search", "Press / media", "Another chef", "Other"];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>
      {children}{required && <span style={{ color: "var(--color-accent)", marginLeft: 2 }}>*</span>}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 44, padding: "0 14px",
  background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
  borderRadius: "var(--radius-md)", fontSize: "var(--text-base)",
  color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
  borderRadius: "var(--radius-md)", fontSize: "var(--text-base)",
  color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none",
  boxSizing: "border-box", resize: "vertical", lineHeight: "var(--lh-base)",
};

function RadioGroup({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {options.map(opt => (
        <label key={opt.value} style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          height: 38, padding: "0 14px",
          background: value === opt.value ? "var(--color-accent-tint)" : "var(--color-canvas)",
          border: `0.5px solid ${value === opt.value ? "var(--color-accent)" : "var(--color-hairline)"}`,
          borderRadius: "var(--radius-md)", transition: "all 150ms ease",
        }}>
          <input type="radio" value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} style={{ display: "none" }} />
          <span style={{ fontSize: "var(--text-sm)", color: value === opt.value ? "var(--color-accent-deep)" : "var(--color-text-2)", fontWeight: value === opt.value ? 600 : 400 }}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}

export default function ApplyPage() {
  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "", email: "", phone: "", city: "",
    experience: "", types: [], eventSize: "",
    background: "", recentEvent: "", priceRange: "",
    instagram: "", heardAbout: "",
  });

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleType(t: string) {
    set("types", form.types.includes(t) ? form.types.filter(x => x !== t) : [...form.types, t]);
  }

  function canAdvance() {
    return form.name.trim() && form.email.trim() && form.city.trim() && form.experience && form.eventSize;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 32px" }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          {/* Animated checkmark */}
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-paid-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: "suppr-fade-in 500ms ease-out" }}>
              <path d="M7 16l7 7L26 9" stroke="var(--color-paid)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 500, color: "var(--color-text)", marginBottom: 12, lineHeight: "var(--lh-3xl)" }}>
            Application received.
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", lineHeight: "var(--lh-base)", marginBottom: 40 }}>
            We'll be in touch within 48 hours. In the meantime, you're welcome to set up your profile and explore the platform.
          </p>
          {/* Next steps */}
          <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", padding: "24px 28px", textAlign: "left", marginBottom: 28 }}>
            <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>What happens next</p>
            {[
              { step: "1", label: "Application review", desc: "We read every application personally — usually within 48 hours." },
              { step: "2", label: "Onboarding call (optional)", desc: "A short call to walk through the platform and answer questions." },
              { step: "3", label: "Profile live", desc: "Set up your profile, policies, and first event. Usually within a week." },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: "0.5px solid var(--color-hairline)" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{s.step}</span>
                </div>
                <div>
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", marginBottom: 2 }}>{s.label}</p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-2)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="#" style={{ fontSize: "var(--text-sm)", color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
            Follow us on Instagram for updates →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "80px 32px 96px", background: "var(--color-canvas)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Join Suppr</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", fontWeight: 500, color: "var(--color-text)", lineHeight: "var(--lh-4xl)", marginBottom: 12 }}>
            Apply to host.
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", lineHeight: "var(--lh-base)" }}>
            We review every application personally. Most decisions within 48 hours.
          </p>
        </div>

        {/* Progress indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 48 }}>
          {([1, 2] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: step >= s ? "var(--color-text)" : "var(--color-surface-2)",
                  border: `0.5px solid ${step >= s ? "var(--color-text)" : "var(--color-hairline)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 200ms ease",
                }}>
                  {step > s ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l3 3 4-5" stroke="var(--color-canvas)" strokeWidth="1.3" strokeLinecap="round" /></svg>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: step >= s ? "var(--color-canvas)" : "var(--color-text-muted)" }}>{s}</span>
                  )}
                </div>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: step === s ? 600 : 400, color: step === s ? "var(--color-text)" : "var(--color-text-muted)" }}>
                  {s === 1 ? "About you" : "Your story"}
                </span>
              </div>
              {i === 0 && (
                <div style={{ flex: 1, height: "0.5px", background: step > 1 ? "var(--color-text)" : "var(--color-hairline)", margin: "0 16px", transition: "background 300ms ease" }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <FieldLabel required>Full name</FieldLabel>
                <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name" required />
              </div>
              <div>
                <FieldLabel required>Email</FieldLabel>
                <input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input style={inputStyle} type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                <FieldLabel required>City</FieldLabel>
                <input style={inputStyle} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Oakland, CA" required />
              </div>
            </div>

            <div>
              <FieldLabel required>How long have you been hosting culinary events?</FieldLabel>
              <RadioGroup options={EXPERIENCE_OPTIONS} value={form.experience} onChange={v => set("experience", v)} />
            </div>

            <div>
              <FieldLabel>Types of experiences</FieldLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TYPES.map(t => (
                  <label key={t} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.types.includes(t)} onChange={() => toggleType(t)} style={{ accentColor: "var(--color-accent)", width: 14, height: 14 }} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel required>Typical event size</FieldLabel>
              <RadioGroup options={SIZE_OPTIONS} value={form.eventSize} onChange={v => set("eventSize", v)} />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canAdvance()}
              style={{
                height: 48, background: "var(--color-text)", border: "none",
                borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", fontWeight: 600,
                color: "var(--color-canvas)", cursor: canAdvance() ? "pointer" : "not-allowed",
                opacity: canAdvance() ? 1 : 0.45, transition: "opacity 150ms ease",
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <FieldLabel required>Tell us about your cooking background</FieldLabel>
              <textarea required rows={4} style={textareaStyle} value={form.background}
                onChange={e => set("background", e.target.value)}
                placeholder="How did you learn to cook? What are your influences? What makes your food distinct?"
              />
            </div>

            <div>
              <FieldLabel required>Describe a recent event you hosted</FieldLabel>
              <textarea required rows={4} style={textareaStyle} value={form.recentEvent}
                onChange={e => set("recentEvent", e.target.value)}
                placeholder="What did you cook, who came, what was the setting like? What did guests say?"
              />
            </div>

            <div>
              <FieldLabel>What would you charge per seat? (rough range)</FieldLabel>
              <input style={inputStyle} value={form.priceRange} onChange={e => set("priceRange", e.target.value)} placeholder="e.g. $75–$120 per person" />
            </div>

            <div>
              <FieldLabel>Instagram handle or website</FieldLabel>
              <input style={inputStyle} type="url" value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="https://instagram.com/yourhandle" />
            </div>

            <div>
              <FieldLabel>How did you hear about Suppr?</FieldLabel>
              <select value={form.heardAbout} onChange={e => set("heardAbout", e.target.value)} style={{ ...inputStyle, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239A9384' strokeWidth='1.3' strokeLinecap='round' fill='none'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 36 }}>
                <option value="">Select…</option>
                {HEARD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <FieldLabel>Sample menu or photo (optional)</FieldLabel>
              <div style={{
                height: 80, border: "0.5px dashed var(--color-hairline)", borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                background: "var(--color-surface)", position: "relative",
              }}>
                <input type="file" accept="image/*,.pdf" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Click to upload (JPG, PNG, PDF — max 10MB)</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  height: 48, flex: "0 0 auto", padding: "0 24px",
                  background: "transparent", border: "0.5px solid var(--color-hairline)",
                  borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", color: "var(--color-text-2)",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting || !form.background.trim() || !form.recentEvent.trim()}
                style={{
                  height: 48, flex: 1, background: "var(--color-text)", border: "none",
                  borderRadius: "var(--radius-md)", fontSize: "var(--text-base)", fontWeight: 600,
                  color: "var(--color-canvas)", cursor: submitting ? "wait" : "pointer",
                  opacity: submitting || !form.background.trim() || !form.recentEvent.trim() ? 0.6 : 1,
                  transition: "opacity 150ms ease",
                }}
              >
                {submitting ? "Submitting…" : "Submit application"}
              </button>
            </div>

            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textAlign: "center" }}>
              By submitting you agree to our{" "}
              <Link href="/terms" style={{ color: "var(--color-text-muted)", textDecoration: "underline" }}>Terms</Link>
              {" and "}
              <Link href="/privacy" style={{ color: "var(--color-text-muted)", textDecoration: "underline" }}>Privacy policy</Link>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

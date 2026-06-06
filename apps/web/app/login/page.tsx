"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "email" | "phone";
type Step = "input" | "sent";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("email");
  const [step, setStep] = useState<Step>("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getNextParam() {
    if (typeof window === "undefined") return "/chef-console/dashboard";
    return new URLSearchParams(window.location.search).get("next") ?? "/chef-console/dashboard";
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNextParam())}`;
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep("sent");
  }

  async function handlePhoneSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep("sent");
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setLoading(false);
    if (err) { setError(err.message); return; }
    window.location.href = getNextParam();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, color: "var(--color-accent)" }}>Suppr</span>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>Chef-hosted dining</p>
      </div>

      <div style={{ width: "100%", maxWidth: 380, background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", padding: "32px 28px" }}>
        {step === "input" && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>Sign in</h1>
            <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 24 }}>
              {mode === "email" ? "We'll send you a magic link." : "We'll send a one-time code."}
            </p>

            {/* Mode toggle */}
            <div style={{ display: "flex", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", padding: 3, marginBottom: 20 }}>
              {(["email", "phone"] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); }}
                  style={{
                    flex: 1, height: 34, background: mode === m ? "var(--color-canvas)" : "transparent",
                    border: "none", borderRadius: "var(--radius-sm)", fontSize: 13,
                    fontWeight: mode === m ? 600 : 400,
                    color: mode === m ? "var(--color-text)" : "var(--color-text-muted)",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                >
                  {m === "email" ? "Email" : "Phone"}
                </button>
              ))}
            </div>

            {mode === "email" ? (
              <form onSubmit={handleEmailSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@example.com"
                    style={{ width: "100%", height: 42, padding: "0 14px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {error && <p style={{ fontSize: 12, color: "var(--color-alert)", marginBottom: 12 }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{ width: "100%", height: 44, background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 14, fontWeight: 600, color: "var(--color-canvas)", cursor: loading || !email ? "not-allowed" : "pointer", opacity: loading || !email ? 0.6 : 1 }}
                >
                  {loading ? "Sending…" : "Send magic link"}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePhoneSend}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>Phone number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                    required
                    autoFocus
                    placeholder="+1 (555) 000-0000"
                    style={{ width: "100%", height: 42, padding: "0 14px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {error && <p style={{ fontSize: 12, color: "var(--color-alert)", marginBottom: 12 }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !phone}
                  style={{ width: "100%", height: 44, background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 14, fontWeight: 600, color: "var(--color-canvas)", cursor: loading || !phone ? "not-allowed" : "pointer", opacity: loading || !phone ? 0.6 : 1 }}
                >
                  {loading ? "Sending…" : "Send code"}
                </button>
              </form>
            )}
          </>
        )}

        {/* Sent confirmation — email */}
        {step === "sent" && mode === "email" && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-paid-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M2 6l9 6 9-6M2 6v12h18V6M2 6h18" stroke="var(--color-paid)" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", marginBottom: 8 }}>Check your inbox</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6, marginBottom: 20 }}>
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
            <button onClick={() => { setStep("input"); setError(null); }} style={{ fontSize: 13, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Use a different email
            </button>
          </div>
        )}

        {/* OTP input — phone */}
        {step === "sent" && mode === "phone" && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", marginBottom: 8 }}>Enter code</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 20 }}>
              We texted a 6-digit code to <strong>{phone}</strong>.
            </p>
            <form onSubmit={handleOtpVerify}>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  placeholder="000000"
                  style={{ width: "100%", height: 52, padding: "0 14px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 24, fontWeight: 600, letterSpacing: "0.2em", color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none", textAlign: "center", boxSizing: "border-box" }}
                />
              </div>
              {error && <p style={{ fontSize: 12, color: "var(--color-alert)", marginBottom: 12 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                style={{ width: "100%", height: 44, background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 14, fontWeight: 600, color: "var(--color-canvas)", cursor: loading || otp.length < 6 ? "not-allowed" : "pointer", opacity: loading || otp.length < 6 ? 0.6 : 1, marginBottom: 12 }}
              >
                {loading ? "Verifying…" : "Verify"}
              </button>
              <button type="button" onClick={() => { setStep("input"); setOtp(""); setError(null); }} style={{ width: "100%", height: 36, background: "transparent", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--color-text-muted)", cursor: "pointer" }}>
                Change number
              </button>
            </form>
          </>
        )}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--color-text-muted)", textAlign: "center" }}>
        By signing in you agree to our{" "}
        <a href="/terms" style={{ color: "var(--color-text-muted)", textDecoration: "underline" }}>Terms</a>
        {" and "}
        <a href="/privacy" style={{ color: "var(--color-text-muted)", textDecoration: "underline" }}>Privacy policy</a>.
      </p>
    </div>
  );
}

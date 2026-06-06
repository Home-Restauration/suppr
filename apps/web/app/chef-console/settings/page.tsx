"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createApiClient } from "@suppr/contracts/client";
import type { ChefProfile } from "@suppr/contracts/schemas";

function getApi(token?: string | undefined) {
  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
    ...(token ? { token } : {}),
  });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)", marginBottom: 16, paddingBottom: 10, borderBottom: "0.5px solid var(--color-hairline)" }}>
      {children}
    </h2>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, paddingBottom: 20, marginBottom: 20, borderBottom: "0.5px solid var(--color-hairline)", alignItems: "flex-start" }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", paddingTop: 10 }}>{label}</label>
      <div>{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string | undefined; type?: string | undefined }) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      style={{ width: "100%", height: 42, padding: "0 14px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
    />
  );
}

function Toggle({ value, onChange, label, description }: { value: boolean; onChange: (v: boolean) => void; label: string; description?: string | undefined }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>{label}</p>
        {description && <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{description}</p>}
      </div>
      <button
        type="button" onClick={() => onChange(!value)}
        style={{ width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer", background: value ? "var(--color-accent)" : "var(--color-surface-2)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
      >
        <span style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </button>
    </div>
  );
}

const CUISINES_LIST = ["American", "French", "Italian", "Japanese", "Korean", "Mediterranean", "Mexican", "Middle Eastern", "Southeast Asian", "West African", "Other"];
const ADDRESS_RULES = [
  { value: "always", label: "Always visible" },
  { value: "on_confirmation", label: "On booking confirmation" },
  { value: "before_event", label: "Hours before event" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<ChefProfile | null>(null);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState("");

  // Form state
  const [brandName, setBrandName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [brandAccent, setBrandAccent] = useState("#C77B5C");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [defaultAddressRule, setDefaultAddressRule] = useState("on_confirmation");
  const [autopilot, setAutopilot] = useState(false);
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifCancellation, setNotifCancellation] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const t = session?.access_token;
      setToken(t);
      try {
        const p = await getApi(t).chef.profile.get();
        setProfile(p);
        setBrandName(p.brand_name);
        setBio(p.bio ?? "");
        setCity(p.city);
        setCuisines(p.cuisines);
        setBrandAccent(p.brand_accent ?? "#C77B5C");
        setSocialLinks(p.social_links as Record<string, string>);
        setInstagram((p.social_links as Record<string, string>).instagram ?? "");
        setTiktok((p.social_links as Record<string, string>).tiktok ?? "");
        setWebsite((p.social_links as Record<string, string>).website ?? "");
        setAutopilot(p.autopilot);
      } catch {
        // no profile yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveSection(section: string, patch: Partial<ChefProfile>) {
    setSaving(true);
    try {
      const updated = await getApi(token).chef.profile.update(patch);
      setProfile(updated);
      setSavedSection(section);
      setTimeout(() => setSavedSection(""), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function toggleCuisine(c: string) {
    setCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  if (loading) return <div style={{ padding: 32 }}><p style={{ color: "var(--color-text-muted)" }}>Loading…</p></div>;

  // Onboarding checklist
  const checklist = [
    { done: !!profile?.payment_acct_id, label: "Connect Stripe account", description: "Required to receive payouts" },
    { done: !!profile?.bio, label: "Add bio", description: "Tell guests about yourself" },
    { done: (profile?.gallery ?? []).length > 0, label: "Add profile photo", description: "A face to the name" },
  ];
  const needsOnboarding = checklist.some(c => !c.done);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, marginBottom: 32 }}>Settings</h1>

      {/* Onboarding checklist */}
      {needsOnboarding && (
        <div style={{ background: "var(--color-note-bg)", border: "0.5px solid var(--color-note)", borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 32 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-note)", marginBottom: 12 }}>Before you can publish events:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {checklist.map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: item.done ? "var(--color-paid)" : "transparent", border: `1.5px solid ${item.done ? "var(--color-paid)" : "var(--color-note)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {item.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: item.done ? 400 : 600, color: item.done ? "var(--color-text-muted)" : "var(--color-note)", textDecoration: item.done ? "line-through" : "none" }}>{item.label}</p>
                  {!item.done && <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile */}
      <div style={{ marginBottom: 40 }}>
        <SectionTitle>Profile</SectionTitle>
        <FieldRow label="Brand name">
          <TextInput value={brandName} onChange={setBrandName} placeholder="Your culinary brand" />
        </FieldRow>
        <FieldRow label="Bio">
          <textarea
            value={bio} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
            rows={4} placeholder="Tell guests about your cooking style, background, inspiration…"
            style={{ width: "100%", padding: "10px 14px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-sans)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
        </FieldRow>
        <FieldRow label="City">
          <TextInput value={city} onChange={setCity} placeholder="San Francisco, CA" />
        </FieldRow>
        <FieldRow label="Cuisines">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CUISINES_LIST.map(c => (
              <button
                key={c} type="button" onClick={() => toggleCuisine(c)}
                style={{
                  height: 30, padding: "0 12px", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                  background: cuisines.includes(c) ? "var(--color-text)" : "var(--color-surface-2)",
                  border: "0.5px solid var(--color-hairline)",
                  color: cuisines.includes(c) ? "var(--color-canvas)" : "var(--color-text-2)",
                }}
              >{c}</button>
            ))}
          </div>
        </FieldRow>
        <FieldRow label="Brand accent color">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="color" value={brandAccent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrandAccent(e.target.value)} style={{ width: 44, height: 44, padding: 2, borderRadius: "var(--radius-md)", border: "0.5px solid var(--color-hairline)", cursor: "pointer", background: "none" }} />
            <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>{brandAccent}</span>
          </div>
        </FieldRow>
        <FieldRow label="Social links">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <TextInput value={instagram} onChange={setInstagram} placeholder="Instagram handle (without @)" />
            <TextInput value={tiktok} onChange={setTiktok} placeholder="TikTok handle (without @)" />
            <TextInput value={website} onChange={setWebsite} type="url" placeholder="https://yourwebsite.com" />
          </div>
        </FieldRow>
        <button
          onClick={() => saveSection("profile", { brand_name: brandName, bio: bio || null, city, cuisines, brand_accent: brandAccent || null, social_links: { instagram, tiktok, website } })}
          disabled={saving}
          style={{ height: 40, padding: "0 20px", background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "var(--color-canvas)", cursor: "pointer" }}
        >
          {savedSection === "profile" ? "Saved ✓" : saving ? "Saving…" : "Save profile"}
        </button>
      </div>

      {/* Payout */}
      <div style={{ marginBottom: 40 }}>
        <SectionTitle>Payout setup</SectionTitle>
        {profile?.payment_acct_id ? (
          <div style={{ padding: "14px 16px", background: "var(--color-paid-bg)", border: "0.5px solid var(--color-paid)", borderRadius: "var(--radius-md)", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--color-paid)", fontWeight: 600 }}>✓ Stripe account connected</p>
            <p style={{ fontSize: 12, color: "var(--color-text-2)", marginTop: 4 }}>Account ID: {profile.payment_acct_id}</p>
          </div>
        ) : (
          <div style={{ padding: "14px 16px", background: "var(--color-alert-bg)", border: "0.5px solid var(--color-alert)", borderRadius: "var(--radius-md)", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--color-alert)", fontWeight: 600 }}>Stripe not connected</p>
            <p style={{ fontSize: 12, color: "var(--color-text-2)", marginTop: 4 }}>Connect Stripe to receive payouts from bookings.</p>
          </div>
        )}
        <button
          onClick={async () => {
            try {
              const { url } = await getApi(token).chef.stripe.connectUrl();
              window.location.href = url;
            } catch {}
          }}
          style={{ height: 40, padding: "0 20px", background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "var(--color-canvas)", cursor: "pointer" }}
        >
          {profile?.payment_acct_id ? "Manage Stripe account" : "Connect Stripe →"}
        </button>
      </div>

      {/* Address privacy */}
      <div style={{ marginBottom: 40 }}>
        <SectionTitle>Address privacy default</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ADDRESS_RULES.map(rule => (
            <label key={rule.value} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", borderRadius: "var(--radius-md)", cursor: "pointer", background: defaultAddressRule === rule.value ? "var(--color-surface-2)" : "transparent", border: `0.5px solid ${defaultAddressRule === rule.value ? "var(--color-accent)" : "var(--color-hairline)"}` }}>
              <input type="radio" name="addr_rule" value={rule.value} checked={defaultAddressRule === rule.value} onChange={() => setDefaultAddressRule(rule.value)} style={{ accentColor: "var(--color-accent)" }} />
              <span style={{ fontSize: 13, color: "var(--color-text)" }}>{rule.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* AI & Autopilot */}
      <div style={{ marginBottom: 40 }}>
        <SectionTitle>AI & Autopilot</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Toggle
            value={autopilot}
            onChange={(v) => { setAutopilot(v); saveSection("autopilot", { autopilot: v }); }}
            label="Autopilot mode"
            description="AI executes tasks automatically without asking for approval. Only available on Chef+AI plan."
          />
        </div>
      </div>

      {/* Notifications */}
      <div style={{ marginBottom: 40 }}>
        <SectionTitle>Notifications</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Toggle value={notifBooking} onChange={setNotifBooking} label="New booking" description="Notify me when a guest books" />
          <Toggle value={notifCancellation} onChange={setNotifCancellation} label="Cancellation" description="Notify me when a guest cancels" />
          <Toggle value={notifMessage} onChange={setNotifMessage} label="Guest message" description="Notify me when a guest sends a message" />
        </div>
      </div>

      {/* Subscription */}
      <div style={{ marginBottom: 40 }}>
        <SectionTitle>Subscription</SectionTitle>
        <div style={{ padding: "16px 20px", background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>
                {profile?.tier === "chef_ai" ? "Chef+AI" : "Basic"}
              </p>
              <p style={{ fontSize: 13, color: "var(--color-text-2)", marginTop: 4 }}>
                {profile?.tier === "chef_ai" ? "Autopilot, AI autofill, AI captions, priority support." : "Manual mode. Upgrade for AI features."}
              </p>
            </div>
            <span style={{ fontSize: 11, padding: "4px 12px", background: profile?.tier === "chef_ai" ? "var(--color-accent-tint)" : "var(--color-surface-2)", color: profile?.tier === "chef_ai" ? "var(--color-accent-deep)" : "var(--color-text-2)", borderRadius: "var(--radius-md)", fontWeight: 600 }}>
              {profile?.tier === "chef_ai" ? "Chef+AI" : "Basic"}
            </span>
          </div>
        </div>
        {profile?.tier !== "chef_ai" && (
          <button style={{ height: 40, padding: "0 20px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>
            Upgrade to Chef+AI
          </button>
        )}
      </div>

      {/* Danger zone */}
      <div>
        <SectionTitle>Danger zone</SectionTitle>
        <div style={{ padding: "16px 20px", background: "var(--color-alert-bg)", border: "0.5px solid var(--color-alert)", borderRadius: "var(--radius-lg)" }}>
          <p style={{ fontSize: 13, color: "var(--color-alert)", marginBottom: 12, fontWeight: 600 }}>Deactivate account</p>
          <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 16 }}>Your profile will be hidden and no new bookings can be made. Existing bookings are not affected.</p>
          <button
            onClick={() => { if (confirm("Are you sure you want to deactivate your account?")) { /* TODO: call deactivate endpoint */ } }}
            style={{ height: 38, padding: "0 16px", background: "var(--color-alert)", border: "none", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}
          >
            Deactivate account
          </button>
        </div>
      </div>
    </div>
  );
}

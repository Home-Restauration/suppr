"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@suppr/contracts/schemas";
import { saveEventDraft, publishEvent, saveEventTemplate, autofillEvent, getSignedUploadUrl } from "./actions";

// ── Types ──────────────────────────────────────────────────────────────────────

type MenuItem = { course: string; description: string };
type GalleryItem = { url: string; alt: string };
type CancellationRow = { hours_before: number; refund_pct: number };

interface FormState {
  type: string;
  title: string;
  description: string;
  starts_at: string;
  capacity: number;
  menu: MenuItem[];
  gallery: GalleryItem[];
  exact_address: string;
  approx_location: string;
  address_rule: "always" | "on_confirmation" | "before_event";
  address_release_hours: number;
  ticket_name: string;
  price_cents: number;
  max_per_booking: number;
  tax_enabled: boolean;
  gratuity_required_pct: number;
  gratuity_optional: boolean;
  gratuity_before_tax: boolean;
  dietary_intake_required: boolean;
  dietary_modifications_allowed: boolean;
  dietary_cannot_accommodate: string[];
  dietary_upcharge_cents: number;
  use_default_cancellation: boolean;
  cancellation: CancellationRow[];
}

const DEFAULT_FORM: FormState = {
  type: "supper_club",
  title: "",
  description: "",
  starts_at: "",
  capacity: 12,
  menu: [{ course: "Main", description: "" }],
  gallery: [],
  exact_address: "",
  approx_location: "",
  address_rule: "on_confirmation",
  address_release_hours: 24,
  ticket_name: "General admission",
  price_cents: 0,
  max_per_booking: 4,
  tax_enabled: false,
  gratuity_required_pct: 0,
  gratuity_optional: true,
  gratuity_before_tax: false,
  dietary_intake_required: true,
  dietary_modifications_allowed: true,
  dietary_cannot_accommodate: [],
  dietary_upcharge_cents: 0,
  use_default_cancellation: true,
  cancellation: [{ hours_before: 72, refund_pct: 100 }, { hours_before: 24, refund_pct: 50 }],
};

const EVENT_TYPES = [
  { value: "supper_club", label: "Supper club" },
  { value: "chef_dinner", label: "Chef's dinner" },
  { value: "private", label: "Private event" },
  { value: "workshop", label: "Workshop" },
  { value: "tasting", label: "Tasting" },
  { value: "series", label: "Series" },
  { value: "other", label: "Other" },
];

const ADDRESS_RULES = [
  { value: "always", label: "Always visible", description: "Address shown on the public listing. Best for fixed-location restaurants." },
  { value: "on_confirmation", label: "On booking confirmation", description: "Revealed only after a guest books. Common for pop-ups and private homes." },
  { value: "before_event", label: "X hours before event", description: "Sent via notification shortly before the event. Maximum privacy." },
];

const STEPS = [
  { label: "Basics" },
  { label: "Menu" },
  { label: "Images" },
  { label: "Location" },
  { label: "Pricing" },
  { label: "Dietary" },
  { label: "Policy" },
  { label: "Review" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function eventToForm(e: Event): FormState {
  return {
    type: e.type,
    title: e.title,
    description: e.description ?? "",
    starts_at: e.starts_at.replace("Z", "").slice(0, 16),
    capacity: e.capacity,
    menu: e.menu.length > 0 ? e.menu : DEFAULT_FORM.menu,
    gallery: [],
    exact_address: "",
    approx_location: e.approx_location,
    address_rule: e.address_rule,
    address_release_hours: e.address_release_hours ?? 24,
    ticket_name: e.ticket_types?.[0]?.name ?? "General admission",
    price_cents: e.ticket_types?.[0]?.price_cents ?? 0,
    max_per_booking: e.ticket_types?.[0]?.max_per_booking ?? 4,
    tax_enabled: e.tax_enabled,
    gratuity_required_pct: e.gratuity_required_pct ?? 0,
    gratuity_optional: e.gratuity_optional,
    gratuity_before_tax: e.gratuity_before_tax,
    dietary_intake_required: e.dietary_policy.intake_required,
    dietary_modifications_allowed: e.dietary_policy.modifications_allowed,
    dietary_cannot_accommodate: e.dietary_policy.cannot_accommodate,
    dietary_upcharge_cents: e.dietary_policy.upcharge_cents ?? 0,
    use_default_cancellation: true,
    cancellation: DEFAULT_FORM.cancellation,
  };
}

function formToApiBody(form: FormState): Record<string, unknown> {
  return {
    type: form.type,
    title: form.title,
    description: form.description || null,
    starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    capacity: form.capacity,
    menu: form.menu,
    approx_location: form.approx_location,
    address_rule: form.address_rule,
    address_release_hours: form.address_rule === "before_event" ? form.address_release_hours : null,
    ticket_types: [{
      name: form.ticket_name,
      quantity: form.capacity,
      price_cents: form.price_cents,
      is_deposit: false,
      max_per_booking: form.max_per_booking,
      sale_start: null,
      sale_end: null,
    }],
    tax_enabled: form.tax_enabled,
    gratuity_required_pct: form.gratuity_required_pct > 0 ? form.gratuity_required_pct : null,
    gratuity_optional: form.gratuity_optional,
    gratuity_before_tax: form.gratuity_before_tax,
    dietary_policy: {
      intake_required: form.dietary_intake_required,
      modifications_allowed: form.dietary_modifications_allowed,
      cannot_accommodate: form.dietary_cannot_accommodate,
      ...(form.dietary_upcharge_cents > 0 ? { upcharge_cents: form.dietary_upcharge_cents } : {}),
    },
    publish_status: "draft",
    visibility: "public",
    policy_id: null,
    template_id: null,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean | undefined }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>
      {children}{required && <span style={{ color: "var(--color-accent)", marginLeft: 3 }}>*</span>}
    </label>
  );
}

function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 5 }}>{children}</p>;
}

function TextInput({
  value, onChange, placeholder, type = "text", min, max,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  type?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      max={max}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", height: 44, padding: "0 14px",
        background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
        borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)",
        fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
      }}
    />
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "0.5px solid var(--color-hairline)" }}
    >
      <span style={{ fontSize: 14, color: "var(--color-text)" }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
          background: value ? "var(--color-accent)" : "var(--color-surface-2)",
          position: "relative", transition: "background 0.2s",
        }}
        aria-pressed={value}
      >
        <span style={{
          position: "absolute", top: 3, left: value ? 21 : 3,
          width: 20, height: 20, borderRadius: "50%",
          background: "white", transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </button>
    </div>
  );
}

// ── Step renders ───────────────────────────────────────────────────────────────

function StepBasics({ form, update, onAiAutofill }: { form: FormState; update: (patch: Partial<FormState>) => void; onAiAutofill: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onAiAutofill}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px",
            background: "var(--color-accent-tint)", border: "0.5px solid var(--color-accent)",
            borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600,
            color: "var(--color-accent-deep)", cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l1.5 3.5L12 6l-3.5 1.5L7 11l-1.5-3.5L2 6l3.5-1.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          AI autofill
        </button>
      </div>

      <div>
        <FieldLabel required>Event type</FieldLabel>
        <select
          value={form.type}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update({ type: e.target.value })}
          style={{
            width: "100%", height: 44, padding: "0 14px",
            background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)",
            fontFamily: "var(--font-sans)", appearance: "none", outline: "none",
          }}
        >
          {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <FieldLabel required>Title</FieldLabel>
        <TextInput value={form.title} onChange={v => update({ title: v })} placeholder="A cozy Moroccan supper in Williamsburg…" />
        <FieldHelp>Max 120 characters. {120 - form.title.length} remaining.</FieldHelp>
      </div>

      <div>
        <FieldLabel>Description</FieldLabel>
        <textarea
          value={form.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update({ description: e.target.value })}
          placeholder="Tell guests what makes this dinner special…"
          rows={5}
          style={{
            width: "100%", padding: "12px 14px",
            background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)",
            fontFamily: "var(--font-sans)", resize: "vertical", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <FieldLabel required>Date & time</FieldLabel>
          <TextInput type="datetime-local" value={form.starts_at} onChange={v => update({ starts_at: v })} />
        </div>
        <div>
          <FieldLabel required>Capacity</FieldLabel>
          <TextInput type="number" value={form.capacity} onChange={v => update({ capacity: parseInt(v) || 1 })} min={1} max={200} />
        </div>
      </div>
    </div>
  );
}

function StepMenu({ form, update }: { form: FormState; update: (patch: Partial<FormState>) => void }) {
  const [dragging, setDragging] = useState<number | null>(null);

  function addCourse() {
    update({ menu: [...form.menu, { course: "", description: "" }] });
  }

  function removeCourse(i: number) {
    update({ menu: form.menu.filter((_, idx) => idx !== i) });
  }

  function updateCourse(i: number, field: "course" | "description", value: string) {
    const next = form.menu.map((m, idx) => idx === i ? { ...m, [field]: value } : m);
    update({ menu: next });
  }

  function handleDrop(targetIdx: number) {
    if (dragging === null) return;
    const next = [...form.menu];
    const removed = next.splice(dragging, 1)[0];
    if (removed === undefined) return;
    next.splice(targetIdx, 0, removed);
    update({ menu: next });
    setDragging(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 4 }}>
        Add courses in order. Drag the handle to reorder.
      </p>

      {form.menu.map((item, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragging(i)}
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={() => handleDrop(i)}
          style={{
            display: "grid", gridTemplateColumns: "24px 1fr 1fr 28px",
            gap: 10, alignItems: "flex-start",
            padding: "12px", background: "var(--color-surface)",
            border: `0.5px solid ${dragging === i ? "var(--color-accent)" : "var(--color-hairline)"}`,
            borderRadius: "var(--radius-md)", cursor: "grab",
            opacity: dragging === i ? 0.5 : 1,
          }}
        >
          <div style={{ color: "var(--color-text-muted)", paddingTop: 12, cursor: "grab" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="4.5" cy="4.5" r="1.2" fill="currentColor" />
              <circle cx="9.5" cy="4.5" r="1.2" fill="currentColor" />
              <circle cx="4.5" cy="9.5" r="1.2" fill="currentColor" />
              <circle cx="9.5" cy="9.5" r="1.2" fill="currentColor" />
            </svg>
          </div>
          <div>
            <FieldLabel>Course name</FieldLabel>
            <TextInput value={item.course} onChange={v => updateCourse(i, "course", v)} placeholder="Amuse-bouche" />
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <TextInput value={item.description} onChange={v => updateCourse(i, "description", v)} placeholder="Oyster, mignonette, chive" />
          </div>
          <button
            type="button"
            onClick={() => removeCourse(i)}
            style={{ marginTop: 24, width: 28, height: 28, borderRadius: "var(--radius-sm)", border: "none", background: "var(--color-alert-bg)", color: "var(--color-alert)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addCourse}
        style={{
          height: 40, background: "transparent", border: "0.5px dashed var(--color-hairline)",
          borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--color-text-2)",
          cursor: "pointer", fontWeight: 500,
        }}
      >
        + Add course
      </button>
    </div>
  );
}

function StepImages({ form, update }: { form: FormState; update: (patch: Partial<FormState>) => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (form.gallery.length + files.length > 8) {
      alert("Maximum 8 images.");
      return;
    }
    setUploading(true);
    const newItems: GalleryItem[] = [];
    for (const file of Array.from(files)) {
      try {
        const { upload_url, public_url } = await getSignedUploadUrl("suppr-media", file.name, file.type);
        await fetch(upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        newItems.push({ url: public_url, alt: file.name.split(".")[0] ?? "" });
      } catch {
        // skip failed uploads
      }
    }
    update({ gallery: [...form.gallery, ...newItems] });
    setUploading(false);
  }

  function removeImage(i: number) {
    update({ gallery: form.gallery.filter((_, idx) => idx !== i) });
  }

  function handleDrop(targetIdx: number) {
    if (dragging === null) return;
    const next = [...form.gallery];
    const removed = next.splice(dragging, 1)[0];
    if (removed === undefined) return;
    next.splice(targetIdx, 0, removed);
    update({ gallery: next });
    setDragging(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: "var(--color-text-2)" }}>
        Add 1–8 images. The first image is the cover. Drag to reorder.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {form.gallery.map((img, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => setDragging(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            style={{
              position: "relative", aspectRatio: "4/3",
              borderRadius: "var(--radius-md)", overflow: "hidden",
              border: `0.5px solid ${dragging === i ? "var(--color-accent)" : "var(--color-hairline)"}`,
              cursor: "grab", opacity: dragging === i ? 0.5 : 1,
            }}
          >
            <img src={img.url} alt={img.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {i === 0 && (
              <span style={{
                position: "absolute", top: 6, left: 6, fontSize: 10, fontWeight: 600,
                background: "var(--color-text)", color: "var(--color-canvas)", padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
              }}>Cover</span>
            )}
            <button
              type="button"
              onClick={() => removeImage(i)}
              style={{
                position: "absolute", top: 6, right: 6, width: 22, height: 22,
                borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)",
                color: "white", cursor: "pointer", fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        ))}

        {form.gallery.length < 8 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              aspectRatio: "4/3", background: "var(--color-surface)",
              border: "0.5px dashed var(--color-hairline)", borderRadius: "var(--radius-md)",
              cursor: uploading ? "wait" : "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{uploading ? "Uploading…" : "Add image"}</span>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
      />
    </div>
  );
}

function StepLocation({ form, update }: { form: FormState; update: (patch: Partial<FormState>) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10, padding: 14,
        background: "var(--color-note-bg)", borderRadius: "var(--radius-md)",
        border: "0.5px solid var(--color-note)",
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
          <circle cx="8" cy="8" r="7" stroke="var(--color-note)" strokeWidth="1.2" />
          <path d="M8 7v4M8 5v1" stroke="var(--color-note)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p style={{ fontSize: 13, color: "var(--color-note)", lineHeight: 1.5 }}>
          The <strong>exact address</strong> is private — never shown publicly. The <strong>approximate location</strong> is what guests see before booking.
        </p>
      </div>

      <div>
        <FieldLabel required>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="5" width="11" height="7" rx="1.5" stroke="var(--color-text-muted)" strokeWidth="1.1" />
              <path d="M4 5V3.5a2.5 2.5 0 015 0V5" stroke="var(--color-text-muted)" strokeWidth="1.1" />
            </svg>
            Exact address (private)
          </span>
        </FieldLabel>
        <TextInput value={form.exact_address} onChange={v => update({ exact_address: v })} placeholder="123 Main St, Brooklyn, NY 11201" />
        <FieldHelp>Only shared with guests based on the release rule below.</FieldHelp>
      </div>

      <div>
        <FieldLabel required>Approximate location (public)</FieldLabel>
        <TextInput value={form.approx_location} onChange={v => update({ approx_location: v })} placeholder="Williamsburg, Brooklyn" />
        <FieldHelp>Visible on the public listing. Neighborhood or intersection is ideal.</FieldHelp>
      </div>

      <div>
        <FieldLabel required>Address release rule</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {ADDRESS_RULES.map(rule => (
            <label
              key={rule.value}
              style={{
                display: "flex", gap: 12, padding: "14px 16px", cursor: "pointer",
                borderRadius: "var(--radius-md)",
                background: form.address_rule === rule.value ? "var(--color-surface-2)" : "var(--color-surface)",
                border: `0.5px solid ${form.address_rule === rule.value ? "var(--color-accent)" : "var(--color-hairline)"}`,
              }}
            >
              <input
                type="radio"
                name="address_rule"
                value={rule.value}
                checked={form.address_rule === rule.value}
                onChange={() => update({ address_rule: rule.value as FormState["address_rule"] })}
                style={{ marginTop: 2, accentColor: "var(--color-accent)" }}
              />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{rule.label}</p>
                <p style={{ fontSize: 12, color: "var(--color-text-2)", marginTop: 3 }}>{rule.description}</p>
              </div>
            </label>
          ))}
        </div>

        {form.address_rule === "before_event" && (
          <div style={{ marginTop: 12 }}>
            <FieldLabel>Hours before event to reveal</FieldLabel>
            <TextInput type="number" value={form.address_release_hours} onChange={v => update({ address_release_hours: parseInt(v) || 24 })} min={1} max={168} />
          </div>
        )}
      </div>
    </div>
  );
}

function StepPricing({ form, update }: { form: FormState; update: (patch: Partial<FormState>) => void }) {
  const platformFee = Math.round(form.price_cents * 0.05);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <FieldLabel required>Ticket name</FieldLabel>
          <TextInput value={form.ticket_name} onChange={v => update({ ticket_name: v })} placeholder="General admission" />
        </div>
        <div>
          <FieldLabel required>Price per seat</FieldLabel>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-muted)" }}>$</span>
            <input
              type="number"
              value={form.price_cents / 100}
              min={0}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ price_cents: Math.round(parseFloat(e.target.value || "0") * 100) })}
              style={{
                width: "100%", height: 44, padding: "0 14px 0 28px",
                background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
                borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)",
                fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>Max seats per booking</FieldLabel>
        <TextInput type="number" value={form.max_per_booking} onChange={v => update({ max_per_booking: parseInt(v) || 1 })} min={1} max={form.capacity} />
      </div>

      <div style={{ padding: "14px 16px", background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)" }}>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Platform fee (read-only)</p>
        <p style={{ fontSize: 14, color: "var(--color-text-2)" }}>5% of ticket price = <strong style={{ color: "var(--color-text)" }}>{fmtCents(platformFee)}</strong> per seat. Deducted from payout.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <Toggle value={form.tax_enabled} onChange={v => update({ tax_enabled: v })} label="Collect sales tax" />
        <Toggle value={form.gratuity_optional} onChange={v => update({ gratuity_optional: v })} label="Allow optional gratuity" />
        <Toggle value={form.gratuity_before_tax} onChange={v => update({ gratuity_before_tax: v })} label="Apply gratuity before tax" />
      </div>

      <div>
        <FieldLabel>Required gratuity: {form.gratuity_required_pct}%</FieldLabel>
        <input
          type="range" min={0} max={30} step={5}
          value={form.gratuity_required_pct}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ gratuity_required_pct: parseInt(e.target.value) })}
          style={{ width: "100%", accentColor: "var(--color-accent)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
          <span>0% (none)</span><span>15%</span><span>30%</span>
        </div>
      </div>
    </div>
  );
}

function StepDietary({ form, update }: { form: FormState; update: (patch: Partial<FormState>) => void }) {
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || form.dietary_cannot_accommodate.includes(tag)) { setTagInput(""); return; }
    update({ dietary_cannot_accommodate: [...form.dietary_cannot_accommodate, tag] });
    setTagInput("");
  }

  function removeTag(tag: string) {
    update({ dietary_cannot_accommodate: form.dietary_cannot_accommodate.filter(t => t !== tag) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <Toggle value={form.dietary_intake_required} onChange={v => update({ dietary_intake_required: v })} label="Require dietary info from all guests" />
      <Toggle value={form.dietary_modifications_allowed} onChange={v => update({ dietary_modifications_allowed: v })} label="Offer menu modifications" />

      <div style={{ paddingTop: 20 }}>
        <FieldLabel>Cannot accommodate (tags)</FieldLabel>
        <FieldHelp>e.g. "shellfish", "peanuts", "vegan" — things the kitchen cannot safely handle</FieldHelp>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {form.dietary_cannot_accommodate.map(tag => (
            <span
              key={tag}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", background: "var(--color-alert-bg)",
                borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--color-alert)",
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", lineHeight: 1, padding: 0 }}
              >×</button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Type and press Enter"
            style={{
              height: 30, padding: "0 10px", fontSize: 12,
              background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
              borderRadius: "var(--radius-sm)", color: "var(--color-text)",
              fontFamily: "var(--font-sans)", outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ paddingTop: 20 }}>
        <FieldLabel>Dietary modification upcharge</FieldLabel>
        <div style={{ position: "relative", width: 160 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-muted)" }}>$</span>
          <input
            type="number" min={0} value={form.dietary_upcharge_cents / 100}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ dietary_upcharge_cents: Math.round(parseFloat(e.target.value || "0") * 100) })}
            style={{
              width: "100%", height: 44, padding: "0 14px 0 28px",
              background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
              borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)",
              fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <FieldHelp>Charged per guest for custom accommodations. 0 = free modifications.</FieldHelp>
      </div>
    </div>
  );
}

function StepCancellation({ form, update }: { form: FormState; update: (patch: Partial<FormState>) => void }) {
  function updateRow(i: number, field: keyof CancellationRow, value: number) {
    const next = form.cancellation.map((r, idx) => idx === i ? { ...r, [field]: value } : r);
    update({ cancellation: next });
  }

  function addRow() {
    update({ cancellation: [...form.cancellation, { hours_before: 48, refund_pct: 0 }] });
  }

  function removeRow(i: number) {
    update({ cancellation: form.cancellation.filter((_, idx) => idx !== i) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Toggle value={form.use_default_cancellation} onChange={v => update({ use_default_cancellation: v })} label="Use my default cancellation policy" />

      {!form.use_default_cancellation && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 28px", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hours before</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Refund %</span>
            <span />
          </div>
          {form.cancellation.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 28px", gap: 10, alignItems: "center" }}>
              <TextInput type="number" value={row.hours_before} onChange={v => updateRow(i, "hours_before", parseInt(v) || 0)} min={0} />
              <TextInput type="number" value={row.refund_pct} onChange={v => updateRow(i, "refund_pct", Math.min(100, parseInt(v) || 0))} min={0} max={100} />
              <button
                type="button"
                onClick={() => removeRow(i)}
                style={{ width: 28, height: 28, border: "none", background: "var(--color-alert-bg)", color: "var(--color-alert)", borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
          ))}
          {form.cancellation.length < 4 && (
            <button type="button" onClick={addRow} style={{ height: 38, background: "transparent", border: "0.5px dashed var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--color-text-2)", cursor: "pointer" }}>
              + Add window
            </button>
          )}
        </div>
      )}

      <div style={{ padding: "14px 16px", background: "var(--color-trust-bg)", border: "0.5px solid var(--color-trust)", borderRadius: "var(--radius-md)" }}>
        <p style={{ fontSize: 13, color: "var(--color-trust)", lineHeight: 1.5 }}>
          Cancellation windows are evaluated from latest to earliest. A guest cancelling 60 hours before receives the refund from the first window where <code>hours_before ≥ 60</code>.
        </p>
      </div>
    </div>
  );
}

function StepReview({
  form, eventId, isSaving, onSaveTemplate, onPublish,
}: {
  form: FormState;
  eventId: string | null;
  isSaving: boolean;
  onSaveTemplate: () => void;
  onPublish: () => void;
}) {
  const totalPrice = form.price_cents + Math.round(form.price_cents * (form.gratuity_required_pct / 100));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Event preview card */}
      <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {form.gallery.length > 0 && (
          <div style={{ height: 200, overflow: "hidden" }}>
            <img src={form.gallery[0]?.url ?? ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        {form.gallery.length === 0 && (
          <div style={{ height: 120, background: "var(--color-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No images added</p>
          </div>
        )}
        <div style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            {EVENT_TYPES.find(t => t.value === form.type)?.label}
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, lineHeight: 1.2, marginBottom: 10 }}>
            {form.title || <em style={{ color: "var(--color-text-muted)" }}>No title</em>}
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 16, lineHeight: 1.6 }}>
            {form.description || <em style={{ color: "var(--color-text-muted)" }}>No description</em>}
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>
              📅 {form.starts_at ? new Date(form.starts_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "No date"}
            </span>
            <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>📍 {form.approx_location || "No location"}</span>
            <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>👥 Up to {form.capacity} guests</span>
          </div>

          <div style={{ borderTop: "0.5px solid var(--color-hairline)", paddingTop: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Menu</p>
            {form.menu.map((m, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{m.course || `Course ${i + 1}`}</p>
                {m.description && <p style={{ fontSize: 12, color: "var(--color-text-2)" }}>{m.description}</p>}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)" }}>
              {fmtCents(form.price_cents)} / seat
              {form.gratuity_required_pct > 0 && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-2)" }}> + {form.gratuity_required_pct}% gratuity</span>}
            </p>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Total ~{fmtCents(totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={onSaveTemplate}
          style={{
            height: 40, padding: "0 16px", background: "transparent",
            border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)",
            fontSize: 13, fontWeight: 500, color: "var(--color-text-2)", cursor: "pointer",
          }}
        >
          Save as template
        </button>

        {!eventId && (
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
            Save draft first to get a shareable link.
          </p>
        )}
      </div>
    </div>
  );
}

// ── AI Autofill Modal ──────────────────────────────────────────────────────────

function AiAutofillModal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (result: { title: string; description: string; menu: MenuItem[] }) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await autofillEvent(prompt.trim());
      onApply(result);
      onClose();
    } catch {
      setError("AI autofill failed. Try again or fill manually.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{
        background: "var(--color-surface)", borderRadius: "var(--radius-lg)",
        padding: 28, width: "100%", maxWidth: 480,
        border: "0.5px solid var(--color-hairline)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2l2 5h5l-4 3 1.5 5L9 12l-4.5 3L6 10 2 7h5L9 2z" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>AI autofill</h2>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 20, lineHeight: 1.5 }}>
          Describe your dinner in a few sentences. The AI will draft a title, description, and menu courses.
        </p>
        <textarea
          value={prompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
          placeholder="e.g. A 6-course Moroccan feast in my Brooklyn loft, inspired by my grandmother's recipes from Marrakech. Saturday evening, intimate, 10 guests…"
          rows={5}
          style={{
            width: "100%", padding: "12px 14px",
            background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)",
            fontFamily: "var(--font-sans)", resize: "vertical", outline: "none", boxSizing: "border-box",
          }}
        />
        {error && <p style={{ fontSize: 12, color: "var(--color-alert)", marginTop: 8 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <button type="button" onClick={onClose} style={{ height: 38, padding: "0 16px", background: "transparent", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 500, color: "var(--color-text-2)", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            style={{ height: 38, padding: "0 20px", background: loading ? "var(--color-surface-2)" : "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: loading ? "var(--color-text-muted)" : "white", cursor: loading ? "wait" : "pointer" }}
          >
            {loading ? "Drafting…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface EventBuilderProps {
  initialEvent?: Event | undefined;
  eventId?: string | undefined;
}

export function EventBuilderClient({ initialEvent, eventId: initialEventId }: EventBuilderProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() =>
    initialEvent ? eventToForm(initialEvent) : DEFAULT_FORM
  );
  const [eventId, setEventId] = useState<string | null>(initialEventId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveLabel, setSaveLabel] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isDirty, setIsDirty] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [stepError, setStepError] = useState("");

  function update(patch: Partial<FormState>) {
    setForm(prev => ({ ...prev, ...patch }));
    setIsDirty(true);
    setSaveLabel("idle");
  }

  // Auto-save every 30 seconds
  const autoSave = useCallback(async () => {
    if (!isDirty) return;
    setIsSaving(true);
    setSaveLabel("saving");
    try {
      const saved = await saveEventDraft(formToApiBody(form), eventId);
      if (!eventId && "id" in saved) setEventId(saved.id as string);
      setIsDirty(false);
      setSaveLabel("saved");
      setTimeout(() => setSaveLabel("idle"), 2000);
    } catch {
      setSaveLabel("error");
    } finally {
      setIsSaving(false);
    }
  }, [form, eventId, isDirty]);

  useEffect(() => {
    const timer = setInterval(autoSave, 30_000);
    return () => clearInterval(timer);
  }, [autoSave]);

  // Unsaved-changes warning
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Step validation
  function validateStep(): string {
    if (step === 1) {
      if (!form.title.trim()) return "Title is required.";
      if (!form.starts_at) return "Date and time are required.";
      if (form.capacity < 1) return "Capacity must be at least 1.";
    }
    if (step === 2) {
      if (form.menu.some(m => !m.course.trim())) return "All courses need a name.";
    }
    if (step === 4) {
      if (!form.approx_location.trim()) return "Approximate location is required.";
    }
    if (step === 5) {
      if (form.price_cents < 0) return "Price cannot be negative.";
    }
    return "";
  }

  async function handleNext() {
    const err = validateStep();
    if (err) { setStepError(err); return; }
    setStepError("");
    // Auto-save on each step advance
    if (isDirty) await autoSave();
    setStep(s => Math.min(s + 1, 8));
    window.scrollTo({ top: 0 });
  }

  async function handleManualSave() {
    await autoSave();
  }

  async function handlePublish() {
    if (!eventId) {
      // Save draft first
      setIsSaving(true);
      try {
        const saved = await saveEventDraft(formToApiBody(form), null);
        if ("id" in saved) setEventId(saved.id as string);
        await publishEvent(saved.id as string);
        setIsDirty(false);
        router.push("/chef-console/dashboard");
      } catch {
        setStepError("Failed to publish. Please try again.");
      } finally {
        setIsSaving(false);
      }
      return;
    }
    setIsPublishing(true);
    try {
      await publishEvent(eventId);
      setIsDirty(false);
      router.push("/chef-console/dashboard");
    } catch {
      setStepError("Failed to publish. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleSaveTemplate() {
    if (!eventId) { alert("Save draft first to create a template."); return; }
    setShowTemplateModal(true);
  }

  async function submitTemplate() {
    if (!eventId || !templateName.trim()) return;
    try {
      await saveEventTemplate(eventId, templateName.trim());
      setShowTemplateModal(false);
      setTemplateName("");
    } catch {
      // ignore
    }
  }

  const saveLabelText: Record<string, string> = { idle: "Save draft", saving: "Saving…", saved: "Saved", error: "Save failed" };
  const saveLabelColor: Record<string, string> = { idle: "var(--color-text-2)", saving: "var(--color-text-muted)", saved: "var(--color-paid)", error: "var(--color-alert)" };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 720, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500 }}>
            {initialEventId ? "Edit event" : "New event"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>Step {step} of {STEPS.length}</p>
        </div>
        <button
          type="button"
          onClick={handleManualSave}
          disabled={isSaving}
          style={{
            height: 36, padding: "0 16px", background: "transparent",
            border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            color: saveLabelColor[saveLabel] ?? "var(--color-text-2)",
          }}
        >
          {saveLabelText[saveLabel] ?? "Save draft"}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 0, marginBottom: 8 }}>
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div
                key={i}
                onClick={() => n < step && setStep(n)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  cursor: n < step ? "pointer" : "default",
                }}
              >
                <div style={{ width: "100%", display: "flex", alignItems: "center" }}>
                  {i > 0 && <div style={{ flex: 1, height: "0.5px", background: done || active ? "var(--color-text)" : "var(--color-hairline)" }} />}
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: done ? "var(--color-text)" : active ? "var(--color-text)" : "var(--color-surface-2)",
                    border: `0.5px solid ${done || active ? "var(--color-text)" : "var(--color-hairline)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="var(--color-canvas)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: active ? "var(--color-canvas)" : "var(--color-text-muted)" }}>{n}</span>
                    )}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: "0.5px", background: done ? "var(--color-text)" : "var(--color-hairline)" }} />}
                </div>
                <span style={{ fontSize: 10, color: active ? "var(--color-text)" : "var(--color-text-muted)", fontWeight: active ? 600 : 400, textAlign: "center" }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step title */}
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: "var(--color-text)" }}>
        {STEPS[step - 1]?.label ?? ""}
      </h2>

      {/* Step content */}
      <div style={{ minHeight: 300 }}>
        {step === 1 && <StepBasics form={form} update={update} onAiAutofill={() => setShowAiModal(true)} />}
        {step === 2 && <StepMenu form={form} update={update} />}
        {step === 3 && <StepImages form={form} update={update} />}
        {step === 4 && <StepLocation form={form} update={update} />}
        {step === 5 && <StepPricing form={form} update={update} />}
        {step === 6 && <StepDietary form={form} update={update} />}
        {step === 7 && <StepCancellation form={form} update={update} />}
        {step === 8 && <StepReview form={form} eventId={eventId} isSaving={isSaving} onSaveTemplate={handleSaveTemplate} onPublish={handlePublish} />}
      </div>

      {/* Step error */}
      {stepError && (
        <p style={{ fontSize: 13, color: "var(--color-alert)", marginTop: 16 }}>{stepError}</p>
      )}

      {/* Navigation footer */}
      <div style={{ display: "flex", gap: 10, marginTop: 36, paddingTop: 20, borderTop: "0.5px solid var(--color-hairline)", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => { setStepError(""); setStep(s => Math.max(s - 1, 1)); }}
          disabled={step === 1}
          style={{
            height: 44, padding: "0 20px", background: "transparent",
            border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)",
            fontSize: 14, fontWeight: 500, color: "var(--color-text-2)",
            cursor: step === 1 ? "not-allowed" : "pointer", opacity: step === 1 ? 0.4 : 1,
          }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          {step === 8 ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              style={{
                height: 44, padding: "0 28px", background: "var(--color-paid)",
                border: "none", borderRadius: "var(--radius-md)",
                fontSize: 14, fontWeight: 600, color: "white",
                cursor: isPublishing ? "wait" : "pointer",
              }}
            >
              {isPublishing ? "Publishing…" : "Publish event"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              style={{
                height: 44, padding: "0 28px", background: "var(--color-text)",
                border: "none", borderRadius: "var(--radius-md)",
                fontSize: 14, fontWeight: 600, color: "var(--color-canvas)",
                cursor: "pointer",
              }}
            >
              Continue →
            </button>
          )}
        </div>
      </div>

      {/* AI autofill modal */}
      {showAiModal && (
        <AiAutofillModal
          onClose={() => setShowAiModal(false)}
          onApply={(result) => {
            update({ title: result.title, description: result.description, menu: result.menu });
          }}
        />
      )}

      {/* Save as template modal */}
      {showTemplateModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowTemplateModal(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: 28, width: "100%", maxWidth: 400, border: "0.5px solid var(--color-hairline)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Save as template</h2>
            <TextInput value={templateName} onChange={setTemplateName} placeholder="e.g. Moroccan supper club" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" onClick={() => setShowTemplateModal(false)} style={{ height: 38, padding: "0 16px", background: "transparent", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 500, color: "var(--color-text-2)", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={submitTemplate} disabled={!templateName.trim()} style={{ height: 38, padding: "0 20px", background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "var(--color-canvas)", cursor: "pointer", opacity: templateName.trim() ? 1 : 0.5 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

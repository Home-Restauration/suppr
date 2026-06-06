"use client";
import React from "react";
import type { EventCard, LineItems, GuestInput } from "@suppr/contracts";
import { createApiClient } from "@suppr/contracts/client";
import {
  Button, Input, AllergenSelector, PriceBreakdown, Chip, Toast
} from "@suppr/ui";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CheckoutFlowProps {
  holdId: string;
  expiresAt: string;
  seatsHeld: number;
  event: EventCard;
  lineItems: LineItems;
}

type Step = 1 | 2 | 3;

interface BuyerDetails {
  name: string;
  email: string;
  phone: string;
}

interface GuestDietary {
  name: string;
  allergens: string[];
  dietary: string[];
}

// ── Countdown ──────────────────────────────────────────────────────────────────

function useCountdown(expiresAt: string): { expired: boolean; display: string } {
  const [ms, setMs] = React.useState(() => new Date(expiresAt).getTime() - Date.now());

  React.useEffect(() => {
    const id = setInterval(() => {
      setMs(new Date(expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (ms <= 0) return { expired: true, display: "0:00" };

  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return {
    expired: false,
    display: `${mins}:${secs.toString().padStart(2, "0")}`,
  };
}

// ── Progress indicator ─────────────────────────────────────────────────────────

const STEPS = ["Your details", "Guest info", "Review & pay"] as const;

function ProgressBar({ step }: { step: Step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {STEPS.map((label, i) => {
        const n = (i + 1) as Step;
        const done = step > n;
        const active = step === n;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: i < STEPS.length - 1 ? undefined : 1 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--text-xs)",
                  fontWeight: 500,
                  fontFamily: "var(--font-sans)",
                  background: done || active ? "var(--color-text)" : "var(--color-surface-2)",
                  color: done || active ? "var(--color-canvas)" : "var(--color-text-muted)",
                  transition: "background 150ms ease, color 150ms ease",
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : n}
              </div>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: active ? "var(--color-text)" : "var(--color-text-muted)",
                  marginTop: 4,
                  whiteSpace: "nowrap",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "0.5px",
                  background: done ? "var(--color-text)" : "var(--color-hairline)",
                  marginBottom: 20,
                  transition: "background 150ms ease",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Step 1: Buyer details ──────────────────────────────────────────────────────

function StepDetails({
  value,
  onChange,
  onNext,
}: {
  value: BuyerDetails;
  onChange: (v: BuyerDetails) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = React.useState<Partial<BuyerDetails>>({});

  const validate = () => {
    const e: Partial<BuyerDetails> = {};
    if (!value.name.trim()) e.name = "Name is required";
    if (!value.email.trim() && !value.phone.trim())
      e.email = "Email or phone number is required";
    if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))
      e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-2xl)",
          lineHeight: "var(--leading-2xl)",
          fontWeight: 500,
          color: "var(--color-text)",
          marginBottom: 8,
        }}
      >
        Your details
      </h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", marginBottom: 24 }}>
        No account needed. We'll send your confirmation here.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          label="Full name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          error={errors.name}
          placeholder="Jane Smith"
          autoComplete="name"
          required
        />
        <Input
          label="Email"
          type="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          error={errors.email}
          placeholder="jane@example.com"
          autoComplete="email"
        />
        <Input
          label="Phone (optional)"
          type="tel"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder="+1 555 000 0000"
          autoComplete="tel"
          helperText="We'll text your confirmation if provided"
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleNext}
        style={{ width: "100%", marginTop: 32 }}
      >
        Continue →
      </Button>
    </div>
  );
}

// ── Step 2: Guest dietary info ─────────────────────────────────────────────────

function StepGuests({
  count,
  guests,
  onChange,
  onNext,
  onBack,
}: {
  count: number;
  guests: GuestDietary[];
  onChange: (guests: GuestDietary[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [activeGuest, setActiveGuest] = React.useState(0);

  const updateGuest = (i: number, patch: Partial<GuestDietary>) => {
    const updated = guests.map((g, idx) => (idx === i ? { ...g, ...patch } : g));
    onChange(updated);
  };

  const current = guests[activeGuest];
  if (!current) return null;

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-2xl)",
          lineHeight: "var(--leading-2xl)",
          fontWeight: 500,
          color: "var(--color-text)",
          marginBottom: 8,
        }}
      >
        Guest info
      </h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", marginBottom: 24 }}>
        Dietary information is collected for every guest so the chef can prepare safely.
      </p>

      {/* Guest tabs */}
      {count > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {guests.map((g, i) => (
            <button
              key={i}
              onClick={() => setActiveGuest(i)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "0.5px solid",
                borderColor: activeGuest === i ? "var(--color-text)" : "var(--color-hairline)",
                background: activeGuest === i ? "var(--color-text)" : "transparent",
                color: activeGuest === i ? "var(--color-canvas)" : "var(--color-text-2)",
                fontSize: "var(--text-sm)",
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                minHeight: 44,
                transition: "background 150ms ease, border-color 150ms ease, color 150ms ease",
              }}
            >
              {g.name || `Guest ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Guest name */}
      <Input
        label={count > 1 ? `Guest ${activeGuest + 1} name` : "Your name"}
        value={current.name}
        onChange={(e) => updateGuest(activeGuest, { name: e.target.value })}
        placeholder={count > 1 ? `Guest ${activeGuest + 1}` : "Jane Smith"}
        style={{ marginBottom: 20 }}
      />

      {/* Allergen selector */}
      <AllergenSelector
        allergens={current.allergens}
        dietary={current.dietary}
        onAllergensChange={(allergens) => updateGuest(activeGuest, { allergens })}
        onDietaryChange={(dietary) => updateGuest(activeGuest, { dietary })}
      />

      {/* Next guest or proceed */}
      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        <Button variant="ghost" size="lg" onClick={onBack} style={{ flex: 1 }}>
          ← Back
        </Button>
        {count > 1 && activeGuest < count - 1 ? (
          <Button
            variant="primary"
            size="lg"
            onClick={() => setActiveGuest((i) => i + 1)}
            style={{ flex: 2 }}
          >
            Next guest →
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={onNext} style={{ flex: 2 }}>
            Review order →
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Step 3: Review + pay ───────────────────────────────────────────────────────

const POLICY_ACKS = [
  { id: "terms", label: "I agree to the booking terms and cancellation policy." },
  { id: "dietary", label: "I confirm the dietary information provided is accurate. I understand the chef will prepare based on what I've submitted." },
  { id: "address", label: "I understand the exact address will be shared according to the chef's release policy." },
] as const;

function StepReview({
  event,
  lineItems,
  buyer,
  guests,
  seatsHeld,
  holdId,
  onBack,
  onExpired,
}: {
  event: EventCard;
  lineItems: LineItems;
  buyer: BuyerDetails;
  guests: GuestDietary[];
  seatsHeld: number;
  holdId: string;
  onBack: () => void;
  onExpired: () => void;
}) {
  const [acks, setAcks] = React.useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const allAcked = POLICY_ACKS.every((a) => acks.has(a.id));

  const toggleAck = (id: string) => {
    setAcks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePay = async () => {
    if (!allAcked) return;
    setSubmitting(true);
    setError(null);

    try {
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL! });

      const guestInputs: GuestInput[] = guests.map((g) => ({
        name: g.name || buyer.name,
        ...(buyer.email ? { email: buyer.email } : {}),
        ...(buyer.phone ? { phone: buyer.phone } : {}),
        allergens: g.allergens as GuestInput["allergens"],
        dietary: g.dietary as GuestInput["dietary"],
      }));

      const result = await api.bookings.create({
        hold_id: holdId,
        buyer_name: buyer.name,
        ...(buyer.email ? { buyer_email: buyer.email } : {}),
        ...(buyer.phone ? { buyer_phone: buyer.phone } : {}),
        guests: guestInputs,
        acknowledgements: [...acks],
        channel: "web",
      });

      window.location.href = result.checkout_url;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 410) {
        onExpired();
        return;
      }
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const ticketType = event.ticket_types?.[0];

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-2xl)",
          lineHeight: "var(--leading-2xl)",
          fontWeight: 500,
          color: "var(--color-text)",
          marginBottom: 24,
        }}
      >
        Review your order
      </h2>

      {/* Event summary */}
      <div
        style={{
          background: "var(--color-surface-2)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
          marginBottom: 24,
          border: "0.5px solid var(--color-hairline)",
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 500, color: "var(--color-text)", marginBottom: 4 }}>
          {event.title}
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
          {new Date(event.starts_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          {" · "}
          {new Date(event.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </div>
        {event.chef && (
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: 2 }}>
            by {event.chef.brand_name} · {event.approx_location}
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <Chip variant="default">{seatsHeld} {seatsHeld === 1 ? "seat" : "seats"}</Chip>
        </div>
      </div>

      {/* Buyer info */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 8 }}>
          Contact
        </div>
        <div style={{ fontSize: "var(--text-base)", color: "var(--color-text)" }}>{buyer.name}</div>
        {buyer.email && <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>{buyer.email}</div>}
        {buyer.phone && <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>{buyer.phone}</div>}
      </div>

      {/* Guests dietary summary */}
      {guests.some((g) => g.allergens.length > 0 || g.dietary.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 8 }}>
            Dietary notes
          </div>
          {guests.map((g, i) => (
            (g.allergens.length > 0 || g.dietary.length > 0) && (
              <div key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", marginBottom: 4 }}>
                <span style={{ fontWeight: 500, color: "var(--color-text)" }}>{g.name || `Guest ${i + 1}`}:</span>{" "}
                {[...g.allergens, ...g.dietary].join(", ")}
              </div>
            )
          ))}
        </div>
      )}

      {/* Price breakdown */}
      <div style={{ marginBottom: 24, borderTop: "0.5px solid var(--color-hairline)", paddingTop: 20 }}>
        <PriceBreakdown
          items={lineItems.breakdown.map((item) => ({
            label: item.label,
            amount_cents: item.type === "seat" ? (ticketType?.price_cents ?? item.amount_cents) * seatsHeld : item.amount_cents,
            muted: item.type !== "seat",
          }))}
          total_cents={lineItems.total_cents + (seatsHeld - 1) * (ticketType?.price_cents ?? 0)}
        />
      </div>

      {/* Policy acknowledgements */}
      <div
        style={{
          background: "var(--color-surface-2)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
          marginBottom: 24,
          border: "0.5px solid var(--color-hairline)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {POLICY_ACKS.map((ack) => (
          <label
            key={ack.id}
            style={{
              display: "flex",
              gap: 12,
              cursor: "pointer",
              minHeight: 44,
              alignItems: "flex-start",
              paddingTop: 2,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                border: "0.5px solid",
                borderColor: acks.has(ack.id) ? "var(--color-text)" : "var(--color-hairline)",
                background: acks.has(ack.id) ? "var(--color-text)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
                transition: "background 150ms ease, border-color 150ms ease",
              }}
            >
              {acks.has(ack.id) && (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="var(--color-canvas)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={acks.has(ack.id)}
              onChange={() => toggleAck(ack.id)}
              style={{ display: "none" }}
            />
            <span style={{ fontSize: "var(--text-sm)", lineHeight: "var(--leading-sm)", color: "var(--color-text-2)" }}>
              {ack.label}
            </span>
          </label>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Toast message={error} variant="error" />
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <Button variant="ghost" size="lg" onClick={onBack} style={{ flex: 1 }} disabled={submitting}>
          ← Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handlePay}
          disabled={!allAcked}
          loading={submitting}
          style={{ flex: 2 }}
        >
          Pay now →
        </Button>
      </div>

      <p style={{ marginTop: 12, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textAlign: "center" }}>
        You'll be taken to Stripe's secure checkout to complete payment.
      </p>
    </div>
  );
}

// ── Expired state ──────────────────────────────────────────────────────────────

function HoldExpired({ eventId }: { eventId: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--color-alert-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="var(--color-alert)" strokeWidth="1.5" />
          <path d="M12 7v5l3 3" stroke="var(--color-alert)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "var(--color-text)", marginBottom: 8 }}>
        Your hold expired
      </h2>
      <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", marginBottom: 24 }}>
        Seats are released back to the event. You can try reserving again.
      </p>
      <a
        href={`/public-pages/events/${eventId}`}
        style={{
          display: "inline-block",
          padding: "13px 28px",
          background: "var(--color-text)",
          color: "var(--color-canvas)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-base)",
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        Back to event
      </a>
    </div>
  );
}

// ── Main checkout flow ─────────────────────────────────────────────────────────

export function CheckoutFlow({ holdId, expiresAt, seatsHeld, event, lineItems }: CheckoutFlowProps) {
  const [step, setStep] = React.useState<Step>(1);
  const [expired, setExpired] = React.useState(false);
  const [buyer, setBuyer] = React.useState<BuyerDetails>({ name: "", email: "", phone: "" });
  const [guests, setGuests] = React.useState<GuestDietary[]>(() =>
    Array.from({ length: seatsHeld }, () => ({ name: "", allergens: [], dietary: [] }))
  );

  const { expired: timerExpired, display } = useCountdown(expiresAt);

  React.useEffect(() => {
    if (timerExpired) setExpired(true);
  }, [timerExpired]);

  if (expired) {
    return <HoldExpired eventId={event.id} />;
  }

  const urgency = parseInt(display.split(":")[0] ?? "99") < 3;

  return (
    <div>
      {/* Hold countdown */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderRadius: "var(--radius-md)",
          background: urgency ? "var(--color-alert-bg)" : "var(--color-surface-2)",
          border: `0.5px solid ${urgency ? "var(--color-alert)" : "var(--color-hairline)"}`,
          marginBottom: 32,
          transition: "background 150ms ease, border-color 150ms ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: urgency ? "var(--color-alert)" : "var(--color-text-muted)" }}>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 4.5V7l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "var(--text-sm)", color: urgency ? "var(--color-alert)" : "var(--color-text-2)" }}>
            {seatsHeld} {seatsHeld === 1 ? "seat" : "seats"} held for
          </span>
        </div>
        <span
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            color: urgency ? "var(--color-alert)" : "var(--color-text)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {display}
        </span>
      </div>

      <ProgressBar step={step} />

      {step === 1 && (
        <StepDetails
          value={buyer}
          onChange={setBuyer}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepGuests
          count={seatsHeld}
          guests={guests}
          onChange={setGuests}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <StepReview
          event={event}
          lineItems={lineItems}
          buyer={buyer}
          guests={guests}
          seatsHeld={seatsHeld}
          holdId={holdId}
          onBack={() => setStep(2)}
          onExpired={() => setExpired(true)}
        />
      )}
    </div>
  );
}

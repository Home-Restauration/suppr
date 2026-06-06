"use client";
import React from "react";
import type { EventCard, LineItems } from "@suppr/contracts";
import { createApiClient } from "@suppr/contracts/client";
import { Button, Chip, PriceBreakdown, BottomSheet } from "@suppr/ui";

interface BookingCardProps {
  event: EventCard;
  lineItems: LineItems | null;
  isMobile: boolean;
}

function useHoldCountdown(expiresAt?: string) {
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return secondsLeft;
}

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function BookingCardInner({ event, lineItems }: { event: EventCard; lineItems: LineItems | null }) {
  const ticketType = event.ticket_types?.[0];
  const [qty, setQty] = React.useState(1);
  const [extraTip, setExtraTip] = React.useState(0);
  const seatsLeft = event.available_seats;
  const conciergeNumber = process.env.NEXT_PUBLIC_CONCIERGE_NUMBER;

  const adjustedItems = React.useMemo(() => {
    if (!lineItems || !ticketType) return [];
    const base = lineItems.breakdown.map((item) => ({
      label: item.label,
      amount_cents: item.type === "seat" ? ticketType.price_cents * qty : item.amount_cents,
      muted: item.type !== "seat",
    }));
    if (extraTip > 0) {
      base.push({ label: "Extra tip", amount_cents: extraTip * 100, muted: true });
    }
    return base;
  }, [lineItems, ticketType, qty, extraTip]);

  const total = lineItems
    ? lineItems.total_cents + (qty - 1) * (ticketType?.price_cents ?? 0) + extraTip * 100
    : 0;

  const [reserving, setReserving] = React.useState(false);
  const [reserveError, setReserveError] = React.useState<string | null>(null);

  const handleReserve = async () => {
    if (!ticketType) return;
    setReserving(true);
    setReserveError(null);
    try {
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL! });
      const hold = await api.bookings.hold({
        event_id: event.id,
        ticket_type_id: ticketType.id,
        qty,
      });
      window.location.href = `/public-pages/checkout/${hold.hold_id}`;
    } catch {
      setReserveError("Couldn't reserve seats — please try again.");
      setReserving(false);
    }
  };

  return (
    <div>
      {/* Date/time + seats */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--color-text)", lineHeight: "var(--leading-base)" }}>
          {fmtDate(event.starts_at)}
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", marginTop: 2 }}>
          {fmtTime(event.starts_at)}
        </div>
        <div style={{ marginTop: 8 }}>
          <Chip variant={seatsLeft <= 5 ? "accent" : "paid"}>
            {seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left
          </Chip>
        </div>
      </div>

      {/* Qty selector */}
      {ticketType && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "10px 0", borderTop: "0.5px solid var(--color-hairline)", borderBottom: "0.5px solid var(--color-hairline)" }}>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", flex: 1 }}>Seats</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              style={{ width: 32, height: 32, borderRadius: "50%", border: "0.5px solid var(--color-hairline)", background: "var(--color-surface-2)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text)" }}
              aria-label="Decrease seats"
            >−</button>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--color-text)", minWidth: 16, textAlign: "center" }}>{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(seatsLeft, q + 1))}
              style={{ width: 32, height: 32, borderRadius: "50%", border: "0.5px solid var(--color-hairline)", background: "var(--color-surface-2)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text)" }}
              aria-label="Increase seats"
            >+</button>
          </div>
        </div>
      )}

      {/* Price breakdown */}
      {lineItems ? (
        <div style={{ marginBottom: 16 }}>
          <PriceBreakdown items={adjustedItems} total_cents={total} />

          {/* Optional tip */}
          {event.gratuity_optional && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
                Add a tip (optional)
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 5, 10, 20].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setExtraTip(amt)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: "var(--radius-sm)",
                      border: "0.5px solid",
                      borderColor: extraTip === amt ? "var(--color-accent)" : "var(--color-hairline)",
                      background: extraTip === amt ? "var(--color-accent-tint)" : "transparent",
                      color: extraTip === amt ? "var(--color-accent-deep)" : "var(--color-text-2)",
                      fontSize: "var(--text-xs)",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {amt === 0 ? "None" : `$${amt}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 16, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          Pricing unavailable
        </div>
      )}

      {reserveError && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-alert)", marginBottom: 8, textAlign: "center" }}>
          {reserveError}
        </p>
      )}

      {/* CTA */}
      <Button variant="primary" size="lg" onClick={handleReserve} loading={reserving} style={{ width: "100%" }}>
        Reserve a seat
      </Button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
        <div style={{ flex: 1, height: "0.5px", background: "var(--color-hairline)" }} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>or</span>
        <div style={{ flex: 1, height: "0.5px", background: "var(--color-hairline)" }} />
      </div>

      {conciergeNumber && (
        <a
          href={`sms:${conciergeNumber}`}
          style={{
            display: "block",
            textAlign: "center",
            padding: "12px",
            border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-2)",
            textDecoration: "none",
          }}
        >
          Book by text · {conciergeNumber}
        </a>
      )}

      {/* Footer notes */}
      <p style={{ marginTop: 12, fontSize: "var(--text-xs)", lineHeight: "var(--leading-xs)", color: "var(--color-text-muted)", textAlign: "center" }}>
        Exact address shared after booking. No account required.
      </p>
    </div>
  );
}

export function BookingCard({ event, lineItems, isMobile }: BookingCardProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);

  if (isMobile) {
    return (
      <>
        {/* Fixed bottom bar on mobile */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            background: "var(--color-surface)",
            borderTop: "0.5px solid var(--color-hairline)",
            padding: "12px 20px",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            {event.ticket_types?.[0] && (
              <div style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--color-text)" }}>
                {fmt(event.ticket_types[0].price_cents)}
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 400, color: "var(--color-text-muted)" }}> / seat</span>
              </div>
            )}
            <Chip variant={event.available_seats <= 5 ? "accent" : "paid"} style={{ marginTop: 2 }}>
              {event.available_seats} left
            </Chip>
          </div>
          <Button variant="primary" size="lg" onClick={() => setSheetOpen(true)} style={{ minWidth: 140 }}>
            Reserve a seat
          </Button>
        </div>

        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Reserve your seat">
          <BookingCardInner event={event} lineItems={lineItems} />
        </BottomSheet>
      </>
    );
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 24,
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-hairline)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
      }}
    >
      <BookingCardInner event={event} lineItems={lineItems} />
    </div>
  );
}

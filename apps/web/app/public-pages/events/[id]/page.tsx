import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createApiClient } from "@suppr/contracts/client";
import { Avatar, Chip, ImageGallery, Skeleton } from "@suppr/ui";
import type { EventCard, LineItems } from "@suppr/contracts";
import { BookingCard } from "./BookingCard";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

function isMobileRequest(): boolean {
  const ua = headers().get("user-agent") ?? "";
  return /mobile|android|iphone|ipad/i.test(ua);
}

async function getEventAndQuote(id: string): Promise<{ event: EventCard; lineItems: LineItems | null }> {
  const api = createApiClient({ baseUrl: process.env.API_URL! });

  const event = await api.events.get(id);

  let lineItems: LineItems | null = null;
  if (event.ticket_types?.length) {
    try {
      lineItems = await api.bookings.quote({
        event_id: event.id,
        ticket_type_id: event.ticket_types[0]!.id,
        qty: 1,
      });
    } catch {
      // price breakdown unavailable — show without
    }
  }

  return { event: event as unknown as EventCard, lineItems };
}

function AddressRuleNote({ rule, hours }: { rule: string; hours?: number | null }) {
  const messages: Record<string, string> = {
    always: "Exact address shared immediately after booking.",
    on_confirmation: "Exact address sent once your booking is confirmed.",
    before_event: `Exact address sent ${hours ?? 24}h before the event.`,
  };
  return (
    <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
      {messages[rule] ?? "Exact address shared after booking."}
    </span>
  );
}

function DietaryPolicyChip({ policy }: { policy: EventCard["dietary_policy"] }) {
  if (!policy.intake_required) return null;
  const canAccommodate = policy.cannot_accommodate.length === 0 && policy.modifications_allowed;
  return (
    <Chip variant={canAccommodate ? "trust" : "note"}>
      {canAccommodate
        ? "Dietary accommodations available"
        : policy.cannot_accommodate.length > 0
          ? `Cannot accommodate: ${policy.cannot_accommodate.join(", ")}`
          : "Limited dietary accommodations"}
    </Chip>
  );
}

export default async function EventPage({ params }: Props) {
  let event: EventCard;
  let lineItems: LineItems | null;

  try {
    ({ event, lineItems } = await getEventAndQuote(params.id));
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 404) notFound();
    // Generic error — show graceful fallback
    return (
      <main style={{ minHeight: "100dvh", background: "var(--color-canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-2)" }}>
            This event couldn't be loaded. Please try again.
          </p>
          <a href="/" style={{ display: "inline-block", marginTop: 16, fontSize: "var(--text-sm)", color: "var(--color-accent)" }}>
            ← Back to feed
          </a>
        </div>
      </main>
    );
  }

  const isMobile = isMobileRequest();
  const chef = event.chef;
  const gallery = (chef?.gallery ?? []).map((g) => ({ url: g.url, ...(g.alt !== undefined ? { alt: g.alt } : {}) }));

  return (
    <main style={{ minHeight: "100dvh", background: "var(--color-canvas)" }}>
      {/* Back nav */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 20px 0" }}>
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Suppr
        </a>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 20px",
          display: isMobile ? "block" : "grid",
          gridTemplateColumns: isMobile ? undefined : "1fr 400px",
          gap: isMobile ? undefined : "48px",
          alignItems: "start",
        }}
      >
        {/* ── Content column ── */}
        <div style={{ minWidth: 0 }}>

          {/* Image gallery */}
          {gallery.length > 0 ? (
            <ImageGallery images={gallery} />
          ) : (
            <div
              style={{
                width: "100%",
                paddingTop: "56.25%",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-2)",
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                No photos yet
              </div>
            </div>
          )}

          {/* Chef row */}
          {chef && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, paddingBottom: 20, borderBottom: "0.5px solid var(--color-hairline)" }}>
              <Avatar
                src={chef.gallery?.[0]?.url ?? null}
                name={chef.brand_name}
                size={40}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={`/public-pages/chefs/${chef.id}`}
                  style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--color-text)", textDecoration: "none" }}
                >
                  {chef.brand_name}
                </a>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{chef.city}</div>
              </div>
              <button
                style={{
                  padding: "8px 16px",
                  border: "0.5px solid var(--color-hairline)",
                  borderRadius: "var(--radius-md)",
                  background: "transparent",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-2)",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  minHeight: 44,
                }}
              >
                Follow
              </button>
            </div>
          )}

          {/* Event title */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-3xl)",
              lineHeight: "var(--leading-3xl)",
              fontWeight: 500,
              color: "var(--color-text)",
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            {event.title}
          </h1>

          {/* Description */}
          {event.description && (
            <p
              style={{
                fontSize: "var(--text-base)",
                lineHeight: "var(--leading-base)",
                color: "var(--color-text-2)",
                marginBottom: 24,
              }}
            >
              {event.description}
            </p>
          )}

          {/* Menu */}
          {event.menu.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                The Menu
              </h2>
              <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 0 }}>
                {event.menu.map((course, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: "12px 0",
                      borderBottom: "0.5px solid var(--color-hairline)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-accent)",
                        fontWeight: 500,
                        minWidth: 20,
                        paddingTop: 1,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--color-text)", marginBottom: 2 }}>
                        {course.course}
                      </div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: "var(--leading-sm)" }}>
                        {course.description}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Dietary policy */}
          <div style={{ marginBottom: 20 }}>
            <DietaryPolicyChip policy={event.dietary_policy} />
          </div>

          {/* Location */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "16px",
              background: "var(--color-surface)",
              border: "0.5px solid var(--color-hairline)",
              borderRadius: "var(--radius-md)",
              marginBottom: isMobile ? 100 : 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1, color: "var(--color-text-muted)" }}>
              <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6C12.5 3.515 10.485 1.5 8 1.5zM8 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor" />
            </svg>
            <div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text)" }}>
                {event.approx_location}
              </div>
              <AddressRuleNote rule={event.address_rule} hours={event.address_release_hours} />
            </div>
          </div>
        </div>

        {/* ── Booking card (desktop only — mobile uses fixed bottom sheet) ── */}
        {!isMobile && (
          <BookingCard event={event} lineItems={lineItems} isMobile={false} />
        )}
      </div>

      {/* Mobile booking card */}
      {isMobile && (
        <BookingCard event={event} lineItems={lineItems} isMobile={true} />
      )}
    </main>
  );
}

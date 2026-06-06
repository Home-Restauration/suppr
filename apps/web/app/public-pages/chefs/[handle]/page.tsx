import React from "react";
import { notFound } from "next/navigation";
import { createApiClient } from "@suppr/contracts/client";
import type { ChefProfilePublic, EventCard, FeedPost } from "@suppr/contracts";
import { Chip, EventCard as EventCardComponent, FeedCard, Skeleton } from "@suppr/ui";
import { FollowButton } from "./FollowButton.js";

export const dynamic = "force-dynamic";

interface Props {
  params: { handle: string };
}

async function loadChefPage(handle: string) {
  const api = createApiClient({ baseUrl: process.env.API_URL! });

  const chef = await api.chefs.get(handle);

  const [events, feed] = await Promise.all([
    api.events.list({ chef_id: chef.id }).catch(() => [] as EventCard[]),
    api.feed.list({ chef_id: chef.id }).catch(() => [] as FeedPost[]),
  ]);

  return { chef, events, feed };
}

// ── Social icon map ────────────────────────────────────────────────────────────

function SocialIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="2" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="13" cy="5" r="0.8" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M12 3c.3 1.7 1.4 2.8 3 3v2.5c-1.1 0-2.1-.4-3-.9V13a5 5 0 11-5-5v2.6a2.4 2.4 0 102.4 2.4V3H12z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case "website":
    case "url":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9 2c-2 2-3 4.5-3 7s1 5 3 7M9 2c2 2 3 4.5 3 7s-1 5-3 7M2 9h14" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M10 8l5-5M15 3h-4M15 3v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 5H5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
  }
}

// ── Hero ───────────────────────────────────────────────────────────────────────

function ChefHero({ chef }: { chef: ChefProfilePublic }) {
  const heroImage = chef.gallery[0];
  const accentColor = chef.brand_accent ?? "rgba(52,48,42,0.72)";

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 320 }}>
      {/* Background image */}
      {heroImage ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${process.env.NEXT_PUBLIC_AZURE_CDN_ENDPOINT ?? ""}${heroImage.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "var(--color-surface-2)" }} />
      )}

      {/* Brand accent overlay — gradient from accent at bottom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, transparent 30%, ${accentColor} 100%)`,
        }}
      />

      {/* Back nav */}
      <div style={{ position: "relative", padding: "16px 24px" }}>
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--text-sm)",
            color: "rgba(255,255,255,0.8)",
            textDecoration: "none",
            textShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Suppr
        </a>
      </div>

      {/* Chef name + tags over hero */}
      <div
        style={{
          position: "relative",
          padding: "0 24px 32px",
          marginTop: 180,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-4xl)",
            lineHeight: "var(--leading-4xl)",
            fontWeight: 500,
            color: "#FDFCFA",
            textShadow: "0 2px 12px rgba(0,0,0,0.3)",
            marginBottom: 12,
          }}
        >
          {chef.brand_name}
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "rgba(253,252,250,0.85)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5c0 2.81 3.5 6.5 3.5 6.5s3.5-3.69 3.5-6.5C9.5 2.57 7.93 1 6 1zm0 4.75A1.25 1.25 0 116 4.25a1.25 1.25 0 010 2.5z" fill="currentColor" />
            </svg>
            {chef.city}
          </span>
          {chef.cuisines.map((c) => (
            <span
              key={c}
              style={{
                fontSize: "var(--text-xs)",
                color: "rgba(253,252,250,0.75)",
                background: "rgba(253,252,250,0.15)",
                backdropFilter: "blur(4px)",
                padding: "3px 10px",
                borderRadius: "var(--radius-sm)",
                border: "0.5px solid rgba(253,252,250,0.2)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Social links ───────────────────────────────────────────────────────────────

function SocialLinks({ links }: { links: Record<string, string> }) {
  const entries = Object.entries(links).filter(([, url]) => url);
  if (entries.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {entries.map(([platform, url]) => (
        <a
          key={platform}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={platform}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-2)",
            textDecoration: "none",
            fontSize: "var(--text-sm)",
            background: "var(--color-surface)",
            minHeight: 44,
            transition: "border-color 150ms ease, color 150ms ease",
          }}
        >
          <SocialIcon platform={platform} />
          <span style={{ textTransform: "capitalize" }}>{platform}</span>
        </a>
      ))}
    </div>
  );
}

// ── Upcoming events section ────────────────────────────────────────────────────

function UpcomingEvents({ events, chef }: { events: EventCard[]; chef: ChefProfilePublic }) {
  if (events.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-hairline)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", marginBottom: 8 }}>
          No upcoming experiences right now.
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Follow {chef.brand_name} to get notified when new dates drop.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
        gap: 16,
      }}
    >
      {events.map((event) => (
        <EventCardComponent
          key={event.id}
          id={event.id}
          title={event.title}
          starts_at={event.starts_at}
          available_seats={event.available_seats}
          price_cents={event.ticket_types?.[0]?.price_cents ?? 0}
          media={event.ticket_types ? [] : []}
          chef={{
            brand_name: chef.brand_name,
            city: chef.city,
            avatar_url: chef.gallery[0]?.url ?? null,
          }}
          href={`/public-pages/events/${event.id}`}
        />
      ))}
    </div>
  );
}

// ── Kitchen feed strip ─────────────────────────────────────────────────────────

function KitchenFeed({ posts }: { posts: FeedPost[] }) {
  if (posts.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "32px 20px",
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-hairline)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          No posts yet from the kitchen.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        overflowX: "auto",
        paddingBottom: 8,
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            minWidth: 280,
            maxWidth: 320,
            scrollSnapAlign: "start",
            flexShrink: 0,
          }}
        >
          <FeedCard
            id={post.id}
            caption={post.caption}
            media={post.media}
            published_at={post.published_at}
            linked_event={
              post.linked_event_id
                ? { id: post.linked_event_id, title: "", available_seats: 0 }
                : null
            }
          />
        </div>
      ))}
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        color: "var(--color-text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.09em",
        marginBottom: 16,
      }}
    >
      {children}
    </h2>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ChefProfilePage({ params }: Props) {
  let chef: ChefProfilePublic;
  let events: EventCard[];
  let feed: FeedPost[];

  try {
    ({ chef, events, feed } = await loadChefPage(params.handle));
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 404) notFound();

    return (
      <main style={{ minHeight: "100dvh", background: "var(--color-canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-2)" }}>
            This profile couldn't be loaded. Please try again.
          </p>
          <a href="/" style={{ display: "inline-block", marginTop: 16, fontSize: "var(--text-sm)", color: "var(--color-accent)" }}>
            ← Back to feed
          </a>
        </div>
      </main>
    );
  }

  const upcomingEvents = events
    .filter((e) => new Date(e.starts_at) > new Date())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return (
    <main style={{ minHeight: "100dvh", background: "var(--color-canvas)" }}>
      {/* Hero */}
      <ChefHero chef={chef} />

      {/* Body */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Actions row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          <FollowButton chefId={chef.id} />

          <a
            href={`/public-pages/inquiries?chefId=${chef.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              border: "0.5px solid var(--color-hairline)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-2)",
              textDecoration: "none",
              background: "var(--color-surface)",
              minHeight: 44,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12 2H2a1 1 0 00-1 1v7a1 1 0 001 1h2l2 2 2-2h4a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            Request a private dinner
          </a>
        </div>

        {/* Bio */}
        {chef.bio && (
          <section style={{ marginBottom: 40 }}>
            <p
              style={{
                fontSize: "var(--text-lg)",
                lineHeight: "var(--leading-lg)",
                color: "var(--color-text-2)",
                fontFamily: "var(--font-sans)",
                maxWidth: 640,
              }}
            >
              {chef.bio}
            </p>
          </section>
        )}

        {/* Brass divider */}
        <div style={{ height: "0.5px", background: "var(--color-brass)", marginBottom: 32, opacity: 0.5 }} />

        {/* Social links */}
        {Object.keys(chef.social_links).length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <SocialLinks links={chef.social_links} />
          </section>
        )}

        {/* Upcoming experiences */}
        <section style={{ marginBottom: 48 }}>
          <SectionHeading>Upcoming experiences</SectionHeading>
          <UpcomingEvents events={upcomingEvents} chef={chef} />
        </section>

        {/* Kitchen feed strip */}
        {feed.length > 0 && (
          <section>
            <SectionHeading>From the kitchen</SectionHeading>
            <KitchenFeed posts={feed} />
          </section>
        )}
      </div>
    </main>
  );
}

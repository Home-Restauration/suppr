"use client";
import React from "react";
import type { EventCard, FeedPost } from "@suppr/contracts";
import { createApiClient } from "@suppr/contracts/client";
import { createClient } from "@/lib/supabase/client";
import { EventCard as EventCardComponent, EventCardSkeleton, FeedCard, FeedCardSkeleton, TabBar } from "@suppr/ui";
import type { TabId } from "@suppr/ui";

// ── Tonight rail ───────────────────────────────────────────────────────────────

function TonightRail({ events }: { events: EventCard[] }) {
  if (events.length === 0) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 500,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          marginBottom: 14,
          paddingInline: 20,
        }}
      >
        Tonight near you
      </h2>
      <div
        style={{
          display: "flex",
          gap: 14,
          overflowX: "auto",
          paddingInline: 20,
          paddingBottom: 4,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            style={{ minWidth: 260, maxWidth: 300, flexShrink: 0, scrollSnapAlign: "start" }}
          >
            <EventCardComponent
              id={event.id}
              title={event.title}
              starts_at={event.starts_at}
              available_seats={event.available_seats}
              price_cents={event.ticket_types?.[0]?.price_cents ?? 0}
              media={[]}
              chef={
                event.chef
                  ? {
                      brand_name: event.chef.brand_name,
                      city: event.chef.city,
                      avatar_url: event.chef.gallery[0]?.url ?? null,
                    }
                  : undefined
              }
              href={`/public-pages/events/${event.id}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── New drops pill ─────────────────────────────────────────────────────────────

function NewDropsPill({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null;
  return (
    <div
      style={{
        position: "sticky",
        top: 12,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        marginBottom: -44,
      }}
    >
      <button
        onClick={onClick}
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 18px",
          borderRadius: 99,
          background: "var(--color-accent)",
          color: "#FDFCFA",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          fontFamily: "var(--font-sans)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.32)",
          animation: "suppr-fade 200ms ease",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 11V3M3 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {count} new {count === 1 ? "drop" : "drops"}
      </button>
    </div>
  );
}

// ── Location chip ──────────────────────────────────────────────────────────────

function LocationChip({ city }: { city?: string | undefined }) {
  if (!city) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        border: "0.5px solid var(--color-hairline)",
        borderRadius: 99,
        fontSize: "var(--text-xs)",
        color: "var(--color-text-2)",
        background: "var(--color-surface)",
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1C3.34 1 2 2.34 2 4c0 2.25 3 6 3 6s3-3.75 3-6c0-1.66-1.34-3-3-3zm0 4a1 1 0 110-2 1 1 0 010 2z" fill="currentColor" />
      </svg>
      {city}
    </div>
  );
}

// ── Main feed client ───────────────────────────────────────────────────────────

interface FeedClientProps {
  initialFeed: FeedPost[];
  tonightEvents: EventCard[];
  nextCursor: string | null;
  city?: string | undefined;
}

export function FeedClient({ initialFeed, tonightEvents, nextCursor: initialCursor, city }: FeedClientProps) {
  const [posts, setPosts] = React.useState<FeedPost[]>(initialFeed);
  const [cursor, setCursor] = React.useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [newPosts, setNewPosts] = React.useState<FeedPost[]>([]);
  const [activeTab, setActiveTab] = React.useState<TabId>("feed");
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // ── Supabase Realtime: subscribe to new feed_posts ─────────────────────────

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("feed-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_posts", filter: "status=eq.published" },
        (payload) => {
          const incoming = payload.new as FeedPost;
          // Only surface it as a pill — don't silently prepend
          setNewPosts((prev) => [incoming, ...prev]);
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  // ── Infinite scroll via IntersectionObserver ───────────────────────────────

  const loadMore = React.useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL! });
      const next = await api.feed.list({ cursor });
      if (next.length === 0) {
        setCursor(null);
        return;
      }
      setPosts((prev) => [...prev, ...next]);
      const last = next[next.length - 1];
      setCursor(last?.published_at ?? null);
    } catch {
      // keep current state
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Flush new posts into feed ──────────────────────────────────────────────

  const flushNewPosts = () => {
    setPosts((prev) => [...newPosts, ...prev]);
    setNewPosts([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Tab navigation ─────────────────────────────────────────────────────────

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const routes: Partial<Record<TabId, string>> = {
      discover: "/discover",
      concierge: "/concierge",
      bookings: "/bookings",
      you: "/profile",
    };
    const route = routes[tab];
    if (route) window.location.href = route;
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-canvas)",
        color: "var(--color-text)",
        paddingBottom: 80,
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 12px",
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--color-canvas)",
          borderBottom: "0.5px solid var(--color-hairline)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            fontWeight: 500,
            color: "var(--color-accent)",
            letterSpacing: "-0.01em",
          }}
        >
          Suppr
        </span>
        <LocationChip city={city} />
      </header>

      {/* Tonight rail */}
      <div style={{ paddingTop: 24 }}>
        <TonightRail events={tonightEvents} />
      </div>

      {/* New drops pill */}
      <NewDropsPill count={newPosts.length} onClick={flushNewPosts} />

      {/* Feed */}
      <section style={{ display: "flex", flexDirection: "column", gap: 1, paddingInline: 20 }}>
        {posts.length === 0 && !loadingMore ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-2)", marginBottom: 8 }}>
              No drops yet in your area.
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              Check back soon — chefs are cooking.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {posts.map((post) => (
                <FeedCard
                  key={post.id}
                  id={post.id}
                  caption={post.caption}
                  media={post.media}
                  published_at={post.published_at}
                  chef={
                    post.chef
                      ? {
                          brand_name: post.chef.brand_name,
                          city: post.chef.city,
                          avatar_url: post.chef.gallery[0]?.url ?? null,
                        }
                      : undefined
                  }
                  linked_event={
                    post.linked_event_id
                      ? { id: post.linked_event_id, title: "", available_seats: 0, href: `/public-pages/events/${post.linked_event_id}` }
                      : null
                  }
                />
              ))}
            </div>

            {/* Load-more skeletons */}
            {loadingMore && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                <FeedCardSkeleton />
                <FeedCardSkeleton />
              </div>
            )}

            {/* Sentinel for IntersectionObserver */}
            {cursor && <div ref={sentinelRef} style={{ height: 1 }} />}

            {/* End of feed */}
            {!cursor && posts.length > 0 && (
              <p style={{ textAlign: "center", padding: "32px 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                You're all caught up.
              </p>
            )}
          </>
        )}
      </section>

      {/* Tab bar */}
      <TabBar active={activeTab} onChange={handleTabChange} />
    </div>
  );
}
